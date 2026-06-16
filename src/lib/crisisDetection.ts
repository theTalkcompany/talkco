// Shared crisis-keyword + helpline detection used by Willow and Community Rooms.

export const CRISIS_KEYWORDS = [
  "kill myself", "kill me", "end my life", "want to die", "wanna die",
  "suicide", "suicidal", "self harm", "self-harm", "hurt myself",
  "cut myself", "don't want to be here", "dont want to be here",
  "no reason to live", "better off dead",
];

export type CrisisLine = { region: string; label: string; number: string; tel: string };

export const CRISIS_LINES: Record<string, CrisisLine> = {
  UK: { region: "UK", label: "Samaritans", number: "116 123", tel: "116123" },
  US: { region: "US", label: "Crisis Lifeline", number: "988", tel: "988" },
  CA: { region: "Canada", label: "Talk Suicide Canada", number: "1-833-456-4566", tel: "18334564566" },
  AU: { region: "Australia", label: "Lifeline", number: "13 11 14", tel: "131114" },
  IE: { region: "Ireland", label: "Samaritans", number: "116 123", tel: "116123" },
  NZ: { region: "NZ", label: "Lifeline Aotearoa", number: "0800 543 354", tel: "0800543354" },
};

export function detectCrisisLine(): CrisisLine {
  try {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("talkco_user_region") : null;
    if (stored && CRISIS_LINES[stored]) return CRISIS_LINES[stored];
    const lang = (typeof navigator !== "undefined" ? navigator.language : "en-GB").toUpperCase();
    const region = lang.split("-")[1] || "GB";
    const map: Record<string, string> = { GB: "UK", US: "US", CA: "CA", AU: "AU", IE: "IE", NZ: "NZ" };
    return CRISIS_LINES[map[region]] || CRISIS_LINES.UK;
  } catch {
    return CRISIS_LINES.UK;
  }
}

export function containsCrisisLanguage(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_KEYWORDS.some((k) => t.includes(k));
}

export const TOPIC_TAGS = [
  "general", "anxiety", "depression", "positivity", "sleep",
  "relationships", "school", "work", "identity", "grief", "recovery",
] as const;
export type TopicTag = (typeof TOPIC_TAGS)[number];
