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

// Robohash (robots/monsters/cats)
const buildRobohashUrl = (seed: string, set: string = "set1", size = 128) =>
  `https://robohash.org/${encodeURIComponent(seed)}.png?set=${set}&size=${size}x${size}`;

// OpenMoji (animals, vehicles)
const OPENMOJI_VERSION = "14.0.0";
const OPENMOJI_ANIMALS = [
  "1F436","1F431","1F98A","1F43B","1F430","1F43C","1F42E","1F437","1F438","1F439","1F435","1F981","1F42F","1F992","1F418","1F98D","1F984","1F99A","1F99C","1F41F","1F420","1F421","1F422","1F433","1F40B"
];
const OPENMOJI_VEHICLES = [
  "1F697","1F695","1F693","1F692","1F691","1F690","1F69A","1F69B","1F69C","1F6B2","1F3CE","1F6F4","1F6F5","1F6E9","1F6EB","1F685","1F686","1F68A","1F6A2","1F680"
];
const buildOpenmojiUrl = (code: string) =>
  `https://cdn.jsdelivr.net/npm/openmoji@${OPENMOJI_VERSION}/color/svg/${code}.svg`;

export default function AvatarPicker({ builtIn = [], onSelect }: AvatarPickerProps) {
  const categories: { key: string; label: string; type: "built-in" | "dicebear" | "robohash" | "openmoji"; style?: string }[] = [];

  if (builtIn.length > 0) {
    categories.push({ key: "built-in", label: "Built‑in", type: "built-in" });
  }

  DICEBEAR_STYLES.forEach((s) => categories.push({ key: s.key, label: s.label, type: "dicebear", style: s.key }));

  // Robohash categories
  categories.push({ key: "robo-robots", label: "Robohash: Robots", type: "robohash", style: "set1" });
  categories.push({ key: "robo-monsters", label: "Robohash: Monsters", type: "robohash", style: "set2" });
  categories.push({ key: "robo-cats", label: "Robohash: Cats", type: "robohash", style: "set4" });

  // OpenMoji categories
  categories.push({ key: "om-animals", label: "Animals", type: "openmoji", style: "animals" });
  categories.push({ key: "om-vehicles", label: "Vehicles", type: "openmoji", style: "vehicles" });

  const defaultTab = categories[0]?.key ?? "built-in";

  const Grid = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 pt-2">
      {children}
    </div>
  );

  const Cell = ({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="group inline-flex items-center justify-center rounded-lg border bg-background shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-ring transition"
    >
      <div className="h-20 w-20 aspect-square rounded-md overflow-hidden bg-background">
        {children}
      </div>
    </button>
  );

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="border rounded-lg flex flex-wrap gap-2 p-2 mb-10 sm:mb-12 bg-background shadow-sm">
          {categories.map((c) => (
            <TabsTrigger key={c.key} value={c.key} className="whitespace-nowrap">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-4 relative z-0">
            {c.type === "built-in" ? (
              <Grid>
                {builtIn.map((url) => (
                  <Cell key={url} onClick={() => onSelect(url)} label={`Select built-in avatar`}>
                    <img
                      src={url}
                      alt="Built-in avatar option"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </Cell>
                ))}
              </Grid>
            ) : c.type === "dicebear" ? (
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
                        className="h-full w-full object-contain"
                      />
                    </Cell>
                  );
                })}
              </Grid>
            ) : c.type === "robohash" ? (
              <Grid>
                {SEEDS.map((seed) => {
                  const url = buildRobohashUrl(seed, c.style!);
                  return (
                    <Cell key={`${c.key}-${seed}`} onClick={() => onSelect(url)} label={`Select ${c.label} avatar for ${seed}`}>
                      <img
                        src={url}
                        alt={`${c.label} avatar, seed ${seed}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain"
                      />
                    </Cell>
                  );
                })}
              </Grid>
            ) : (
              <Grid>
                {(c.style === "animals" ? OPENMOJI_ANIMALS : OPENMOJI_VEHICLES).map((code) => (
                  <Cell key={`${c.key}-${code}`} onClick={() => onSelect(buildOpenmojiUrl(code))} label={`Select ${c.label} ${code}`}>
                    <img
                      src={buildOpenmojiUrl(code)}
                      alt={`${c.label} ${code}`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </Cell>
                ))}
              </Grid>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
