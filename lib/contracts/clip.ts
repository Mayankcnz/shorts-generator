export const STORY_TYPES = [
  "story",
  "reflection",
  "lesson",
  "comedy",
  "conflict",
  "transformation",
  "opinion",
  "educational",
] as const;

export type StoryType = (typeof STORY_TYPES)[number];

export type ClipSuggestion = {
  title: string;
  start: number;
  end: number;
  score: number;
  hook: string;
  whyItWorks: string;
  storyType: StoryType;
};

export function isStoryType(value: unknown): value is StoryType {
  return typeof value === "string" && STORY_TYPES.includes(value as StoryType);
}
