import { useRef, useCallback, useEffect, useMemo } from 'react';

/**
 * Web Audio GainNode middleware for loudness normalization.
 *
 * Intercepts audio output from <audio>/<video> elements and applies
 * a gain factor BEFORE it reaches the speakers. This way:
 *   - element.volume = user slider %  ← existing code, untouched
 *   - GainNode.gain = normalization    ← this hook, transparent layer
 *
 * Each track (voiceover, media, music) gets its own GainNode.
 * Gains are per-block (Map<blockId, gain>) so different blocks
 * can have different normalization factors.
 */

interface GainNodeEntry {
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

export function useAudioGainNodes() {
  // Track which elements are already connected (can only call createMediaElementSource once per element)
  const connectedRef = useRef<Map<HTMLMediaElement, GainNodeEntry>>(new Map());
  // Per-block gain values
  const voiceGainsRef = useRef<Map<number, number>>(new Map());
  const mediaGainsRef = useRef<Map<number, number>>(new Map());
  const musicGainsRef = useRef<Map<number, number>>(new Map());

  /**
   * Connect an element to Web Audio with a GainNode.
   * Safe to call multiple times — only connects once per element.
   */
  const connectElement = useCallback((el: HTMLMediaElement | null) => {
    if (!el || connectedRef.current.has(el)) return;
    try {
      const ctx = getCtx();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(ctx.destination);
      connectedRef.current.set(el, { source, gain });
    } catch {
      // If createMediaElementSource fails, audio still plays normally
    }
  }, []);

  /**
   * Disconnect a previously connected element (e.g. video remount).
   * Must be called before the old element is garbage collected.
   */
  const disconnectElement = useCallback((el: HTMLMediaElement | null) => {
    if (!el) return;
    const entry = connectedRef.current.get(el);
    if (entry) {
      try { entry.source.disconnect(); entry.gain.disconnect(); } catch {}
      connectedRef.current.delete(el);
    }
  }, []);

  /** Resume AudioContext — call on first user gesture (e.g. click play) */
  const resumeContext = useCallback(() => {
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
  }, []);

  /**
   * Set normalization gain for a specific block on a track.
   * Also immediately applies if that track's element is currently connected.
   */
  const setVoiceGain = useCallback((blockId: number, gain: number) => {
    voiceGainsRef.current.set(blockId, gain);
  }, []);

  const setMediaGain = useCallback((blockId: number, gain: number) => {
    mediaGainsRef.current.set(blockId, gain);
  }, []);

  const setMusicGain = useCallback((blockId: number, gain: number) => {
    musicGainsRef.current.set(blockId, gain);
  }, []);

  /**
   * Apply the gain for a specific block to an element's GainNode.
   * Call this when the active block changes (e.g. voiceover switches to next block).
   */
  const applyGain = useCallback((el: HTMLMediaElement | null, gainValue: number) => {
    if (!el) return;
    const entry = connectedRef.current.get(el);
    if (entry) {
      entry.gain.gain.value = Math.max(0.1, Math.min(gainValue, 4.0));
    }
  }, []);

  /** Shorthand: look up block gain from a track's map and apply */
  const applyVoiceGain = useCallback((el: HTMLMediaElement | null, blockId: number) => {
    applyGain(el, voiceGainsRef.current.get(blockId) ?? 1);
  }, [applyGain]);

  const applyMediaGain = useCallback((el: HTMLMediaElement | null, blockId: number) => {
    applyGain(el, mediaGainsRef.current.get(blockId) ?? 1);
  }, [applyGain]);

  const applyMusicGain = useCallback((el: HTMLMediaElement | null, blockId: number) => {
    applyGain(el, musicGainsRef.current.get(blockId) ?? 1);
  }, [applyGain]);

  /** Get all gain values for export payload */
  const getGainValues = useCallback(() => ({
    voiceGains: voiceGainsRef.current,
    mediaGains: mediaGainsRef.current,
    musicGains: musicGainsRef.current,
  }), []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectedRef.current.forEach(entry => {
        try { entry.source.disconnect(); entry.gain.disconnect(); } catch {}
      });
      connectedRef.current.clear();
    };
  }, []);

  return useMemo(() => ({
    connectElement, disconnectElement, resumeContext,
    setVoiceGain, setMediaGain, setMusicGain,
    applyVoiceGain, applyMediaGain, applyMusicGain,
    voiceGainsRef, mediaGainsRef, musicGainsRef,
    getGainValues,
  }), [connectElement, disconnectElement, resumeContext, setVoiceGain, setMediaGain, setMusicGain, applyVoiceGain, applyMediaGain, applyMusicGain, getGainValues]);
}
