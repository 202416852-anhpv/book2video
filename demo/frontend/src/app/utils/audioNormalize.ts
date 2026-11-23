/**
 * Measure RMS loudness of an audio source and return a gain factor
 * that normalizes it to a target level (≈ -16 LUFS).
 *
 * Uses OfflineAudioContext — no live context needed, no user gesture required,
 * doesn't count toward browser's AudioContext limit.
 */

// ≈ -16.5 dB RMS (linear 0.15). This is an *approximation* of the server-side
// TARGET_LUFS = -16.0 dB (ITU-R BS.1770 K-weighted, via ffmpeg loudnorm).
// RMS and LUFS differ by ~0.3-1 dB depending on frequency content, but for
// TTS (the primary client-side use case) the consistent spectral profile keeps
// the mismatch negligible. Media/music loudness uses the server endpoint.
const TARGET_RMS = 0.15;

/**
 * Measure gain for small audio files (TTS blobs, short clips).
 * Decodes entire file via OfflineAudioContext — safe for files < ~20MB.
 */
export async function measureGain(audioUrl: string): Promise<number> {
  try {
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 20 * 1024 * 1024) return 1;

    // Use OfflineAudioContext to decode without a live context
    const tmpCtx = new OfflineAudioContext(1, 1, 44100);
    const audioBuffer = await tmpCtx.decodeAudioData(arrayBuffer);

    let sumSquares = 0;
    let totalSamples = 0;
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const data = audioBuffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++) {
        sumSquares += data[i] * data[i];
      }
      totalSamples += data.length;
    }
    const rms = Math.sqrt(sumSquares / totalSamples);
    if (rms < 0.001) return 1;
    const gain = TARGET_RMS / rms;
    return Math.max(0.1, Math.min(gain, 4.0));
  } catch {
    return 1;
  }
}

/**
 * Measure gain via server (ffmpeg loudnorm).
 * For large files (video, CDN music) where client-side decode is impractical.
 */
export async function measureGainServer(url: string): Promise<number> {
  try {
    const { authFetch } = await import('./auth');
    const res = await authFetch(`/api/loudness?url=${encodeURIComponent(url)}`);
    if (!res.ok) return 1;
    const data = await res.json();
    return Math.max(0.1, Math.min(data.gain ?? 1, 4.0));
  } catch {
    return 1;
  }
}
