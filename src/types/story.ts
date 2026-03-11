export interface StoryLine {
  speaker: string; // 角色ID 或“你”或“旁白”
  text: string;
}

export interface StoryOption {
  text: string;
  effect?: {
    favor?: number;
    popularity?: number;
    money?: number;
  };
  followUp?: {
    scene?: string;
    lines: StoryLine[];
  };
  stageFollowUp?: Partial<Record<"陌生" | "熟悉" | "暧昧" | "心动", StoryLine[]>> &
    Record<string, StoryLine[] | undefined>;
  isCustomInput?: boolean;
}

export interface StoryNode {
  id: string;
  scene: string;
  lines: StoryLine[];
  options: StoryOption[];
}

export type StoryEffect = NonNullable<StoryOption["effect"]>;
export type StoryType = "encounter" | "special" | null;
