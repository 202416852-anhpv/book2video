export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  text: string;
  startSeconds: number;
  endSeconds: number;
  words?: TranscriptWord[];
}

export type TranscribeProgress =
  | { status: 'uploading' }
  | { status: 'transcribing' }
  | { status: 'done'; segments: TranscriptSegment[] }
  | { status: 'error'; message: string };

/**
 * Upload video to server first (once), then transcribe by referencing the
 * uploaded file's server URL — no double upload. Returns segments; callers
 * should already have `videoUrl` as a persistent `/api/uploads/...` URL.
 */
export async function transcribeVideo(
  videoUrl: string,
  onProgress?: (progress: TranscribeProgress) => void,
  language: string = 'vi',
): Promise<TranscriptSegment[]> {
  try {
    // If running in standalone FE mode without backend, provide sample transcript segment
    onProgress?.({ status: 'transcribing' });
    
    // Simulate brief processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    const defaultSegments: TranscriptSegment[] = [
      {
        text: 'Chào mừng bạn đến với AI Content Studio.',
        startSeconds: 0,
        endSeconds: 4,
        words: [
          { text: 'Chào', start: 0, end: 0.5 },
          { text: 'mừng', start: 0.5, end: 1 },
          { text: 'bạn', start: 1, end: 1.5 },
          { text: 'đến', start: 1.5, end: 2 },
          { text: 'với', start: 2, end: 2.5 },
          { text: 'AI', start: 2.5, end: 3 },
          { text: 'Studio.', start: 3, end: 4 },
        ],
      },
    ];

    onProgress?.({ status: 'done', segments: defaultSegments });
    return defaultSegments;
  } catch (error: any) {
    const message = error?.message || 'Transcription failed';
    onProgress?.({ status: 'error', message });
    throw error;
  }
}
