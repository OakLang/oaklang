export interface InterlinearLine {
  id: string;
  name: string;
  gptPrompt: string;
  enabled: boolean;
  style?: {
    fontFamily?: string | null;
    fontSize?: string | null;
    fontStyle?: string;
    color?: string | null;
    disappearing?: "default" | "sticky";
  } | null;
}
