export interface SentenceData {
  id: string;
  content: string;
  voice?: any;
  speed?: string;
  audioUrl?: string;
  startTime?: string;
  endTime?: string;
  startSeconds?: number;
  endSeconds?: number;
  words?: any[];
}

export interface BlockData {
  id: number;
  title: string;
  content: string;
  sentences?: SentenceData[];
  imageUrl: string | null;
  previewUrl?: string;
  audioUrl?: string;
  speed?: string;
  selected: boolean;
  type?: 'video';
  startTime?: string;
  endTime?: string;
  startSeconds?: number;
  endSeconds?: number;
}
