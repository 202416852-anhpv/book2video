export type TemplateLayoutType =
  | "vocab-card"
  | "classroom-modern"
  | "dialogue-split"
  | "minimal-clean";

export interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  badge: string;
  accentColor: string;
  slots: string[];
  previewLayout: TemplateLayoutType;
}

export type LessonAssetType = "character" | "object";
export type LessonAssetStatus = "pending" | "approved" | "regenerating";

export interface LessonAsset {
  id: string;
  type: LessonAssetType;
  title: string;
  subtitle?: string; // e.g. IPA /həˈləʊ/
  meaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  templateSlot: string;
  prompt: string;
  status: LessonAssetStatus;
  visualEmoji: string;
  visualBg: string;
  imageUrl?: string;
  section: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  lang: "vi" | "en";
  gender: "female" | "male";
  accent: string;
  style: string;
}

export interface NarrationSegment {
  id: string;
  voiceId: string;
  text: string;
  lang: "vi" | "en";
  speed: number;
  pauseAfterSec: number;
  durationSec: number;
}

export type SlideLayoutType =
  | "title"
  | "objectives"
  | "look-and-say"
  | "vocab-card"
  | "exercise"
  | "closing";

export interface SlideDialogueItem {
  speaker: string;
  avatarEmoji: string;
  en: string;
  vi: string;
}

export interface SlideExerciseItem {
  no: number;
  left: string;
  right: string;
}

export interface LessonSlideContent {
  word?: string;
  ipa?: string;
  meaning?: string;
  exampleEn?: string;
  exampleVi?: string;
  bullets?: string[];
  dialogues?: SlideDialogueItem[];
  exerciseInstruction?: string;
  exerciseItems?: SlideExerciseItem[];
  assetId?: string;
  note?: string;
}

export interface LessonSlide {
  id: string;
  index: number;
  section: string;
  layout: SlideLayoutType;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  content: LessonSlideContent;
  narrations: NarrationSegment[];
}

export interface SourceSkillSection {
  skill: string;
  label: string;
  title: string;
  section?: string;
  start_hms: string;
  end_hms: string;
}

export interface LessonProject {
  id: string;
  title: string;
  subject: "Tiếng Anh";
  level: string;
  sbFileName: string;
  tbFileName: string;
  templateId: string;
  slideCount: number;
  assetCount: number;
  textPreview: string;
  createdAt: string;
  author: string;
  status?: "draft" | "ready";
  accentColor?: string;
  thumbnailUrl?: string;
}
