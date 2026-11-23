export interface BlockData {
  id: number;
  title: string;
  content: string;
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
