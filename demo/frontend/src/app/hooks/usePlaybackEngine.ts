import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { MediaBlock, MusicBlock } from '../types/timeline-blocks';

// ── Types ──────────────────────────────────────────────────
export interface PlaybackBlock {
  id: number;
  startTime: number;
  endTime: number;
  /** Seconds to skip from the start of the source audio (set by resize-left). */
  trimStart?: number;
  audioUrl?: string;
}

export interface PlaybackEngineState {
  isPlaying: boolean;
  currentTime: number;
  activeBlockId: number | null;
}

interface Volumes { voiceover: number; media: number; audio: number; }

// ── Hook ───────────────────────────────────────────────────
export function usePlaybackEngine(deps: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  blockAudioRef: React.RefObject<HTMLAudioElement | null>;
  musicAudioRef: React.RefObject<HTMLAudioElement | null>;
  volumesRef: React.RefObject<Volumes>;
  mediaBlocksRef: React.RefObject<MediaBlock[]>;
  musicBlocksRef: React.RefObject<MusicBlock[]>;
  /** Loudness gain factors per music block id.
   *  Applied via HTMLAudioElement.volume (capped at 1.0) since music can be
   *  cross-origin (S3 CDN) → GainNode would silence the tainted media. */
  musicGainsRef?: React.RefObject<Map<number, number>>;
  /** Fired once when playback reaches the end of the timeline on its own
   *  (not on user pause). Used for analytics — receives the end time. */
  onComplete?: (endTime: number) => void;
}) {
  const { videoRef, blockAudioRef, musicAudioRef, volumesRef, mediaBlocksRef, musicBlocksRef, musicGainsRef, onComplete } = deps;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [state, setState] = useState<PlaybackEngineState>({
    isPlaying: false, currentTime: 0, activeBlockId: null,
  });

  const sessionRef = useRef(0);
  const rafRef = useRef(0);
  const clockRef = useRef({ startWall: 0, startSeek: 0, rate: 1 });
  const blocksRef = useRef<PlaybackBlock[]>([]);
  const stateRef = useRef(state);
  const rateRef = useRef(1); // #18: persist desired rate across pause/play
  stateRef.current = state;

  const voiceLoopRef = useRef<{ cancel: () => void } | null>(null);
  const voiceLoopDoneRef = useRef(true); // true = no active voiceover sequence
  const activeTimersRef = useRef<{ cut: number; fade: number }>({ cut: 0, fade: 0 });

  // ── Master Clock ──────────────────────────────────────────
  const getCurrentTime = useCallback(() => {
    if (!stateRef.current.isPlaying) return stateRef.current.currentTime;
    const elapsed = (performance.now() - clockRef.current.startWall) / 1000 * clockRef.current.rate;
    return clockRef.current.startSeek + elapsed;
  }, []);

  const videoPause = useCallback(() => { videoRef.current?.pause(); }, [videoRef]);

  // ── Voiceover sequencing ──────────────────────────────────
  const startVoiceoverSequence = useCallback((blocks: PlaybackBlock[], seekTime: number, session: number) => {
    voiceLoopRef.current?.cancel();
    // Force clear any active cut/fade timers from previous sequence
    clearTimeout(activeTimersRef.current.cut);
    clearInterval(activeTimersRef.current.fade);
    activeTimersRef.current = { cut: 0, fade: 0 };

    let cancelled = false;
    voiceLoopRef.current = {
      cancel: () => {
        cancelled = true;
        voiceLoopDoneRef.current = true;
        clearTimeout(activeTimersRef.current.cut);
        clearInterval(activeTimersRef.current.fade);
        activeTimersRef.current = { cut: 0, fade: 0 };
      }
    };

    const blockAudio = blockAudioRef.current;
    if (!blockAudio) { voiceLoopDoneRef.current = true; return; }

    voiceLoopDoneRef.current = false; // sequence active

    // Find start block
    let startIdx = blocks.findIndex(b => seekTime >= b.startTime && seekTime < b.endTime);
    if (startIdx === -1) startIdx = blocks.findIndex(b => b.startTime >= seekTime);
    if (startIdx === -1) startIdx = blocks.length;

    (async () => {
      for (let i = startIdx; i < blocks.length; i++) {
        if (cancelled || sessionRef.current !== session) return;
        const block = blocks[i];

        // Skip zero-duration blocks
        if (block.endTime <= block.startTime) continue;
        if (!block.audioUrl) continue;

        const blockStart = block.startTime;

        if (getCurrentTime() < blockStart) {
          await new Promise<void>(resolve => {
            const check = () => {
              if (cancelled || sessionRef.current !== session) { resolve(); return; }
              if (getCurrentTime() >= blockStart) { resolve(); return; }
              requestAnimationFrame(check);
            };
            check();
          });
          if (cancelled || sessionRef.current !== session) {
            return;
          }
        }

        setState(prev => ({ ...prev, activeBlockId: block.id }));

        const seekOffset = (i === startIdx && seekTime > blockStart) ? seekTime - blockStart : 0;
        const audioOffset = (block.trimStart ?? 0) + seekOffset;

        await new Promise<void>(resolve => {

          const segmentDur = block.endTime - blockStart;
          // Remaining timeline duration of this block from current play position
          // (independent of trimStart — trimStart only shifts where in the audio we start).
          const remainingSegment = Math.max(0, segmentDur - seekOffset);
          const globalRate = clockRef.current.rate;
          let cutTimerId = 0;
          let fadeIntervalId = 0;
          // Track timers globally so cancel() can clear them
          const storeTimers = () => { activeTimersRef.current = { cut: cutTimerId, fade: fadeIntervalId }; };

          // Apply rate only sets playbackRate — cut timer starts separately after play()
          // Audio plays at natural speed (globalRate); block duration only trims (cuts) the audio,
          // it does NOT time-stretch the audio to fit.
          const applyRate = () => {
            const rawAudioDur = blockAudio.duration;
            if (!rawAudioDur || !isFinite(rawAudioDur)) {
              blockAudio.playbackRate = globalRate;
              return;
            }
            const clampedOffset = Math.min(audioOffset, rawAudioDur);
            blockAudio.currentTime = clampedOffset;
            const audioDur = rawAudioDur - clampedOffset;
            if (audioDur <= 0 || remainingSegment <= 0) {
              blockAudio.pause();
              onEnd('applyRate-noDuration');
              return;
            }
            blockAudio.playbackRate = globalRate;
          };

          // Start cut timer AFTER play succeeds — not from metadata load
          const startCutTimer = () => {
            const cutAfterMs = (remainingSegment / globalRate) * 1000;
            const fadeMs = Math.min(200, cutAfterMs);
            const fadeSteps = Math.max(1, Math.floor(fadeMs / 20));

            cutTimerId = window.setTimeout(() => {
              if (cancelled || sessionRef.current !== session || blockAudio.paused) { onEnd('cutTimer-guard'); return; }
              const userVol = volumesRef.current.voiceover / 100;
              if (userVol === 0) { blockAudio.pause(); onEnd("applyRate-zeroDur"); return; }
              // #9: read fresh volume for fade start
              const fadeStart = volumesRef.current.voiceover / 100;
              let step = 0;
              fadeIntervalId = window.setInterval(() => {
                if (cancelled || sessionRef.current !== session) { clearInterval(fadeIntervalId); storeTimers(); return; }
                // #9: if user changed volume during fade, abort fade
                const currentUserVol = volumesRef.current.voiceover / 100;
                if (Math.abs(currentUserVol - fadeStart) > 0.05) {
                  clearInterval(fadeIntervalId);
                  blockAudio.volume = currentUserVol;
                  blockAudio.pause();
                  onEnd('fade-volChange');
                  return;
                }
                step++;
                blockAudio.volume = fadeStart * (1 - step / fadeSteps);
                if (step >= fadeSteps) {
                  clearInterval(fadeIntervalId);
                  blockAudio.pause();
                  blockAudio.volume = volumesRef.current.voiceover / 100;
                  onEnd('fade-complete');
                }
              }, 20);
            }, Math.max(0, cutAfterMs - fadeMs));
            storeTimers();
          };

          let ended = false;
          let playTimerId = 0;
          const onEnd = (reason = 'unknown') => {
            if (ended) return;
            ended = true;
            clearTimeout(cutTimerId);
            clearInterval(fadeIntervalId);
            clearTimeout(playTimerId);
            // Only clear listeners if this session still owns blockAudio
            if (!cancelled && sessionRef.current === session) {
              blockAudio.onended = null;
              blockAudio.onerror = null;
              blockAudio.onloadedmetadata = null;
              blockAudio.oncanplay = null;
            }
            resolve();
          };

          if (cancelled || sessionRef.current !== session) { resolve(); return; }

          // Clear ALL listeners before src change to prevent stale events
          blockAudio.onended = null;
          blockAudio.onerror = null;
          blockAudio.onloadedmetadata = null;
          blockAudio.oncanplay = null;
          blockAudio.pause(); // stop any previous playback on this element

          blockAudio.src = block.audioUrl!;
          blockAudio.volume = volumesRef.current.voiceover / 100;
          blockAudio.load();

          // Set listeners AFTER src + load (avoids stale abort/ended from src change)
          let rateApplied = false;
          blockAudio.onloadedmetadata = () => {
            if (!rateApplied) { rateApplied = true; applyRate(); }
          };
          blockAudio.onended = () => onEnd('ended-natural');
          blockAudio.onerror = () => onEnd('error');

          // Play when ready + start cut timer after play succeeds
          let playStarted = false;
          const doPlay = () => {
            playStarted = true;
            if (cancelled || sessionRef.current !== session) { onEnd('doPlay-cancelled'); return; }
            blockAudio.oncanplay = null;
            if (!rateApplied && blockAudio.duration && isFinite(blockAudio.duration)) {
              rateApplied = true;
              applyRate();
            }
            blockAudio.play().then(() => {
              startCutTimer();
            }).catch(() => onEnd('play-rejected'));
          };

          // Robust ready detection: event + polling + fallback
          blockAudio.oncanplay = () => doPlay();

          // Poll readyState every frame in case canplay event was missed
          const pollReady = () => {
            if (playStarted || ended || cancelled || sessionRef.current !== session) return;
            if (blockAudio.readyState >= 2) {
              doPlay();
            } else {
              requestAnimationFrame(pollReady);
            }
          };
          requestAnimationFrame(pollReady);
        });

        if (cancelled || sessionRef.current !== session) return;
      }

      // All blocks done
      voiceLoopDoneRef.current = true;
      if (!cancelled && sessionRef.current === session) {
        setState(prev => ({ ...prev, activeBlockId: null }));
      }
    })();
  }, [blockAudioRef, volumesRef, getCurrentTime]);

  // ── Video loop for media blocks ──────────────────────────
  const lastMediaBlockId = useRef<number | null>(null);
  const switchIdRef = useRef(0); // invalidate stale async operations
  // Immediately updated (no React render lag) — VideoPreview reads this for showVideo.
  // Starts true so video shows before first syncVideoLoop call (same as old behavior).
  const hasActiveVideoRef = useRef(true);
  // Immediately updated src of current image block (null when no image active).
  const activeImageSrcRef = useRef<string | null>(null);

  // Normalize src for comparison (video.src returns full URL, active.src may be relative)
  const srcMatches = useCallback((videoEl: HTMLVideoElement, src: string) => {
    if (!videoEl.src || !src) return false;
    try {
      return new URL(videoEl.src).href === new URL(src, window.location.href).href;
    } catch {
      return videoEl.src === src;
    }
  }, []);

  const syncVideoLoop = useCallback((time: number, seekOnly = false) => {
    const video = videoRef.current;
    if (!video) return;
    const mBlocks = mediaBlocksRef.current;
    if (!mBlocks || mBlocks.length === 0) {
      hasActiveVideoRef.current = false;
      activeImageSrcRef.current = null;
      if (!video.paused) video.pause();
      lastMediaBlockId.current = null;
      return;
    }

    const active = mBlocks.find(b => time >= b.startTime && time < b.startTime + b.duration);
    if (!active || active.type === 'image') {
      hasActiveVideoRef.current = false;
      activeImageSrcRef.current = active?.type === 'image' ? active.src : null;
      if (!video.paused) video.pause();
      if (active?.type === 'image') {
        video.style.opacity = '0';
      }
      lastMediaBlockId.current = null;
      return;
    }
    hasActiveVideoRef.current = true;
    activeImageSrcRef.current = null;

    const elapsed = time - active.startTime;
    const mediaTrimStart = active.trimStart ?? 0;
    // For same-src path only — when switching src, we recompute in onReady with actual video.duration
    const natDur = active.naturalDuration > 0 ? active.naturalDuration : 0;
    const loopedOffset = natDur > 0
      ? (mediaTrimStart + elapsed) % natDur
      : mediaTrimStart + elapsed;
    const needsSrcSwitch = !srcMatches(video, active.src);


    if (needsSrcSwitch) {
      const switchId = ++switchIdRef.current;
      lastMediaBlockId.current = active.id;
      video.style.opacity = '0';
      video.pause();
      video.onloadeddata = null;
      video.onseeked = null;
      video.src = active.src;
      video.load();

      const onReady = () => {
        video.onloadeddata = null;
        video.oncanplay = null;
        if (switchIdRef.current !== switchId) {
          video.style.opacity = '1';
          return;
        }
        // Recompute offset using actual video.duration when naturalDuration was unknown
        const actualNatDur = active.naturalDuration > 0 ? active.naturalDuration : video.duration;
        const actualOffset = actualNatDur > 0
          ? (mediaTrimStart + elapsed) % actualNatDur
          : mediaTrimStart + elapsed;
        video.currentTime = actualOffset;
        video.volume = volumesRef.current.media / 100;
        video.muted = volumesRef.current.media === 0;
        video.playbackRate = rateRef.current;

        video.onseeked = () => {
          video.onseeked = null;
          if (switchIdRef.current !== switchId) {
            video.style.opacity = '1';
            return;
          }
          if (!seekOnly) video.play().catch(() => {});
          video.style.opacity = '1';
        };
        // If already seeked (readyState high enough), fire immediately
        if (video.readyState >= 3) {
          video.onseeked = null;
          if (!seekOnly) video.play().catch(() => {});
          video.style.opacity = '1';
        }
      };

      video.onloadeddata = onReady;
      video.oncanplay = onReady;

      // Fallback: if already loaded (cached), events may not fire
      if (video.readyState >= 2) {
        onReady();
      }
      return;
    }

    // Same src — just sync position
    lastMediaBlockId.current = active.id;

    // Show video if hidden (e.g. after coming from a gap)
    if (video.style.opacity === '0') {
      video.style.opacity = '1';
    }

    const drift = Math.abs(video.currentTime - loopedOffset);
    // For explicit seeks (seekOnly), always update — even tiny drifts matter for frame accuracy.
    // During playback, 0.3s tolerance avoids constant micro-corrections.
    if (seekOnly ? drift > 0.001 : drift > 0.3) {
      video.currentTime = loopedOffset;
    }

    if (seekOnly) {
      if (!video.paused) video.pause();
    } else if (video.paused && !video.ended) {
      video.volume = volumesRef.current.media / 100;
      video.muted = volumesRef.current.media === 0;
      video.playbackRate = rateRef.current;
      video.play().catch(() => {});
    }
  }, [videoRef, mediaBlocksRef, volumesRef, srcMatches]);

  // ── Music playback for music blocks ─────────────────────
  const lastMusicBlockId = useRef<number | null>(null);

  const syncMusicPlayback = useCallback((time: number, seekOnly = false) => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    const mBlocks = musicBlocksRef.current;
    if (!mBlocks || mBlocks.length === 0) {
      if (!audio.paused) audio.pause();
      lastMusicBlockId.current = null;
      return;
    }

    const active = mBlocks.find(b => time >= b.startTime && time < b.startTime + b.duration);
    if (!active) {
      if (!audio.paused) audio.pause();
      lastMusicBlockId.current = null;
      return;
    }

    const elapsed = time - active.startTime;
    const trimStart = active.trimStart ?? 0;
    const loopedOffset = active.naturalDuration > 0
      ? (trimStart + elapsed) % active.naturalDuration
      : trimStart + elapsed;

    // Compute effective volume: user slider × loudness gain (capped at 1.0).
    // Can't use GainNode for amplification because cross-origin (S3) sources
    // would be silenced if routed through MediaElementSource.
    const baseVol = volumesRef.current.audio / 100;
    const gain = musicGainsRef?.current?.get(active.id) ?? 1;
    const effectiveVol = Math.min(1.0, baseVol * gain);
    const isMuted = volumesRef.current.audio === 0;

    // Switch track if different block
    if (lastMusicBlockId.current !== active.id) {
      lastMusicBlockId.current = active.id;
      audio.src = active.url;
      audio.currentTime = loopedOffset;
      audio.volume = effectiveVol;
      audio.muted = isMuted;
      audio.playbackRate = rateRef.current;
      if (!seekOnly) audio.play().catch(() => {});
      return;
    }

    // Sync position if drifted (loop point or drift)
    const drift = Math.abs(audio.currentTime - loopedOffset);
    if (drift > 0.5) {
      audio.currentTime = loopedOffset;
    }

    // Always sync volume (handles case where volume was changed while ref was null)
    audio.volume = effectiveVol;
    audio.muted = isMuted;

    if (seekOnly) {
      if (!audio.paused) audio.pause();
    } else if (audio.paused) {
      audio.playbackRate = rateRef.current;
      audio.play().catch(() => {});
    }
  }, [musicAudioRef, musicBlocksRef, volumesRef]);

  // ── RAF tick (stable ref pattern — #2 fix) ────────────────
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    const rawTime = getCurrentTime();
    const video = videoRef.current;
    const blockAudio = blockAudioRef.current;
    const musicAudio = musicAudioRef.current;
    const blocks = blocksRef.current;
    const lastBlockEnd = blocks.length > 0 ? Math.max(...blocks.map(b => b.endTime)) : 0;
    const mBlocks = mediaBlocksRef.current;
    const muBlocks = musicBlocksRef.current;
    const lastMediaEnd = mBlocks && mBlocks.length > 0 ? Math.max(...mBlocks.map(b => b.startTime + b.duration)) : 0;
    const lastMusicEnd = muBlocks && muBlocks.length > 0 ? Math.max(...muBlocks.map(b => b.startTime + b.duration)) : 0;

    // #15: only update state when delta is meaningful (reduce re-renders)
    setState(prev => {
      if (Math.abs(prev.currentTime - rawTime) < 0.03) return prev;
      return { ...prev, currentTime: rawTime };
    });

    // Sync video loop + music playback
    syncVideoLoop(rawTime);
    syncMusicPlayback(rawTime);

    // Check end — all tracks must be past their end
    const overallEnd = Math.max(lastBlockEnd, lastMediaEnd, lastMusicEnd);
    const voiceoverDone = voiceLoopDoneRef.current;
    const beyondBlocks = lastBlockEnd > 0 ? rawTime >= lastBlockEnd : true;
    const beyondAll = overallEnd > 0 ? rawTime >= overallEnd : true;

    if (voiceoverDone && beyondBlocks && beyondAll) {
      cancelAnimationFrame(rafRef.current);
      onCompleteRef.current?.(rawTime);
      if (video) video.pause();
      if (blockAudio) { blockAudio.pause(); blockAudio.currentTime = 0; }
      if (musicAudio) { musicAudio.pause(); musicAudio.currentTime = 0; }
      voiceLoopRef.current?.cancel();
      lastMusicBlockId.current = null;
      lastMediaBlockId.current = null;
      switchIdRef.current++;
      const endSession = sessionRef.current;
      const endState = { isPlaying: false, currentTime: rawTime, activeBlockId: null as number | null };
      stateRef.current = endState;
      setState(endState);
      setTimeout(() => {
        if (sessionRef.current !== endSession) return;
        lastMediaBlockId.current = null;
        switchIdRef.current++;
        syncVideoLoop(0, true);
        const resetState = { isPlaying: false, currentTime: 0, activeBlockId: null as number | null };
        stateRef.current = resetState;
        setState(resetState);
      }, 300);
      return;
    }

    rafRef.current = requestAnimationFrame(() => tickRef.current());
  };

  const startTick = useCallback(() => {
    cancelAnimationFrame(rafRef.current); // #3: always cancel old RAF first
    rafRef.current = requestAnimationFrame(() => tickRef.current());
  }, []);

  // ── Public API ────────────────────────────────────────────
  const play = useCallback((blocks: PlaybackBlock[], fromTime?: number, rate?: number) => {
    // #3: cancel old RAF + voiceover before starting new
    cancelAnimationFrame(rafRef.current);
    voiceLoopRef.current?.cancel();
    // Restore volume after cancel (fade may have lowered it) — don't pause, sequence handles it
    if (blockAudioRef.current) {
      blockAudioRef.current.volume = volumesRef.current.voiceover / 100;
    }

    const session = ++sessionRef.current;
    blocksRef.current = blocks;
    const useRate = rate ?? rateRef.current; // #18: use persisted rate if not specified
    rateRef.current = useRate;

    const seekTime = fromTime ?? stateRef.current.currentTime;
    const mBlocks = mediaBlocksRef.current;
    const muBlocks = musicBlocksRef.current;
    const maxDuration = Math.max(
      blocks.length > 0 ? Math.max(...blocks.map(b => b.endTime)) : 0,
      mBlocks && mBlocks.length > 0 ? Math.max(...mBlocks.map(b => b.startTime + b.duration)) : 0,
      muBlocks && muBlocks.length > 0 ? Math.max(...muBlocks.map(b => b.startTime + b.duration)) : 0,
    );
    const actualSeek = seekTime > maxDuration ? 0 : seekTime;

    // Reset tracking refs so syncVideoLoop/syncMusicPlayback re-evaluate cleanly
    lastMediaBlockId.current = null;
    lastMusicBlockId.current = null;
    switchIdRef.current++;

    clockRef.current = { startWall: performance.now(), startSeek: actualSeek, rate: useRate };
    startVoiceoverSequence(blocks, actualSeek, session);
    setState({ isPlaying: true, currentTime: actualSeek, activeBlockId: null });
    startTick();
  }, [startVoiceoverSequence, startTick]);

  const pause = useCallback(() => {
    sessionRef.current++;
    cancelAnimationFrame(rafRef.current);
    videoPause();
    blockAudioRef.current?.pause();
    musicAudioRef.current?.pause();
    lastMusicBlockId.current = null;
    lastMediaBlockId.current = null;
    voiceLoopRef.current?.cancel();
    const time = getCurrentTime();
    const newState = { isPlaying: false, currentTime: time, activeBlockId: null };
    stateRef.current = newState; // sync update so seek() sees paused immediately
    setState(newState);
  }, [videoPause, blockAudioRef, musicAudioRef, getCurrentTime]);

  const seek = useCallback((time: number) => {
    if (stateRef.current.isPlaying) {
      play(blocksRef.current, time, clockRef.current.rate);
    } else {
      // Reset tracking refs so sync re-evaluates from scratch
      lastMediaBlockId.current = null;
      lastMusicBlockId.current = null;
      switchIdRef.current++;
      // Sync video and music to new position (seekOnly = don't auto-play)
      syncVideoLoop(time, true);
      syncMusicPlayback(time, true);
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, [play, syncVideoLoop, syncMusicPlayback]);

  const setVolume = useCallback((track: 'media' | 'voiceover' | 'audio', value: number) => {
    if (track === 'media' && videoRef.current) {
      videoRef.current.volume = value / 100;
      videoRef.current.muted = value === 0;
    } else if (track === 'voiceover' && blockAudioRef.current) {
      blockAudioRef.current.volume = value / 100;
      blockAudioRef.current.muted = value === 0;
    } else if (track === 'audio' && musicAudioRef.current) {
      musicAudioRef.current.volume = value / 100;
      musicAudioRef.current.muted = value === 0;
    }
  }, [videoRef, blockAudioRef, musicAudioRef]);

  // #18 + #19: persist rate — if playing, restart engine so voiceover sequence uses new rate
  const setPlaybackRate = useCallback((rate: number) => {
    rateRef.current = rate;
    if (stateRef.current.isPlaying) {
      // Restart from current position with new rate — voiceover sequence re-inits with fresh globalRate
      const time = getCurrentTime();
      play(blocksRef.current, time, rate);
    }
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [getCurrentTime, play, videoRef]);

  // #4: sync engine time after external video manipulation (handlePlayBlock)
  const syncTime = useCallback((time: number) => {
    if (!stateRef.current.isPlaying) {
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  // Reset tracking refs when blocks change externally (delete/move/add)
  const resetTracking = useCallback(() => {
    lastMediaBlockId.current = null;
    lastMusicBlockId.current = null;
    switchIdRef.current++;
    // Re-sync to current position
    const time = stateRef.current.currentTime;
    if (!stateRef.current.isPlaying) {
      syncVideoLoop(time, true);
      syncMusicPlayback(time, true);
    }
  }, [syncVideoLoop, syncMusicPlayback]);

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); voiceLoopRef.current?.cancel(); blockAudioRef.current?.pause(); musicAudioRef.current?.pause(); };
  }, [musicAudioRef]);

  // #2,3: memoize return object so consumers don't get new ref every render
  return useMemo(() => ({
    state, stateRef,
    play, pause, seek,
    setVolume, setPlaybackRate,
    getCurrentTime, syncTime, resetTracking,
    hasActiveVideoRef,
    activeImageSrcRef,
  }), [state, play, pause, seek, setVolume, setPlaybackRate, getCurrentTime, syncTime, resetTracking]);
}
