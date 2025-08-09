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

  const Grid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
      {children}
    </div>
  );

  const Cell = ({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="group inline-flex items-center justify-center rounded-lg border bg-background hover:shadow focus:outline-none focus:ring-2 focus:ring-ring transition"
    >
      <div className="h-20 w-20 rounded-md overflow-hidden">
        {children}
      </div>
    </button>
  );

  return (
    <div className="space-y-4">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="flex flex-wrap gap-2 bg-background z-10">
          {categories.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="whitespace-nowrap">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-4">
            {c.type === "built-in" ? (
              <Grid>
                {builtIn.map((url) => (
                  <Cell key={url} onClick={() => onSelect(url)} label={`Select built-in avatar`}>
                    <img
                      src={url}
                      alt="Built-in avatar option"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </Cell>
                ))}
              </Grid>
            ) : (
              <Grid>
                {SEEDS.map((seed) => {
                  const url = buildDicebearUrl(c.style!, seed);
                  return (
                    <Cell key={`${c.key}-${seed}`} onClick={() => onSelect(url)} label={`Select ${c.label} avatar for ${seed}`}>
                      <img
                        src={url}
                        alt={`${c.label} avatar, seed ${seed}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </Cell>
                  );
                })}
              </Grid>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
