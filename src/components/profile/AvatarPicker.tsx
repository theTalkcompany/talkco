import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvatarPickerProps {
  builtIn?: string[];
  onSelect: (url: string) => void;
}

const SEEDS = [
  "Alex","Bailey","Cameron","Dakota","Elliot","Finley","Gray","Harper",
  "Indie","Jordan","Kendall","Logan","Morgan","Peyton","Quinn","River",
  "Skyler","Taylor","Avery","Charlie","Rowan","Reese","Sam","Tatum",
  "Blake","Casey","Drew","Emerson","Hayden","Jamie","Kai","London",
];

// DiceBear v9 styles selection (broad variety)
const DICEBEAR_STYLES = [
  { key: "adventurer", label: "Adventurer" },
  { key: "big-smile", label: "Big Smile" },
  { key: "bottts", label: "Bottts" },
  { key: "fun-emoji", label: "Fun Emoji" },
  { key: "micah", label: "Micah" },
  { key: "open-peeps", label: "Open Peeps" },
  { key: "personas", label: "Personas" },
  { key: "pixel-art", label: "Pixel Art" },
  { key: "croodles", label: "Croodles" },
  { key: "adventurer-neutral", label: "Adventurer Neutral" },
];

const buildDicebearUrl = (style: string, seed: string, size = 128) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundType=gradientLinear,solid`;

export default function AvatarPicker({ builtIn = [], onSelect }: AvatarPickerProps) {
  const categories: { key: string; label: string; type: "built-in" | "dicebear"; style?: string }[] = [];

  if (builtIn.length > 0) {
    categories.push({ key: "built-in", label: "Built‑in", type: "built-in" });
  }

  DICEBEAR_STYLES.forEach((s) => categories.push({ key: s.key, label: s.label, type: "dicebear", style: s.key }));

  const defaultTab = categories[0]?.key ?? "built-in";

  return (
    <div className="space-y-4">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="whitespace-nowrap">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-4">
            {c.type === "built-in" ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {builtIn.map((url) => (
                  <button
                    key={url}
                    onClick={() => onSelect(url)}
                    className="rounded-lg border hover:shadow focus:outline-none focus:ring-2 focus:ring-ring p-2"
                    aria-label={`Select built-in avatar`}
                  >
                    <img
                      src={url}
                      alt="Built-in avatar option"
                      loading="lazy"
                      className="h-16 w-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {SEEDS.map((seed) => {
                  const url = buildDicebearUrl(c.style!, seed);
                  return (
                    <button
                      key={`${c.key}-${seed}`}
                      onClick={() => onSelect(url)}
                      className="rounded-lg border hover:shadow focus:outline-none focus:ring-2 focus:ring-ring p-2"
                      aria-label={`Select ${c.label} avatar for ${seed}`}
                    >
                      <img
                        src={url}
                        alt={`${c.label} avatar, seed ${seed}`}
                        loading="lazy"
                        className="h-16 w-16 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
