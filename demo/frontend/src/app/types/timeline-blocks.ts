export interface MediaBlock {
  id: number;
  startTime: number;
  duration: number;
  trimStart: number;  // seconds into source to start playing (0 = from beginning)
  naturalDuration: number;
  type: 'video' | 'image';
  src: string;
  thumbnailUrl: string;
  label: string;
}

export interface MusicBlock {
  id: number;
  startTime: number;
  duration: number;
  trimStart: number;  // seconds into source to start playing (0 = from beginning)
  naturalDuration: number;
  url: string;
  label: string;
  artist: string;
}
