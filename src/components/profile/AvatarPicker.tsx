import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvatarPickerProps {
  builtIn?: string[];
  onSelect: (url: string) => void;
}

const EMOJIS = [
  "🌱","🌸","🌻","🌼","🌿","🍀","🌷","🌹","🌺","🌳",
  "🦋","🐝","🐞","🐢","🐬","🐳","🐧","🦊","🦉","🦄",
  "⭐","🌙","☀️","🌈","✨","💫","🔥","💧","🌊","🍃",
  "❤️","💛","💚","💙","💜","🧡","🤍","🤎","💖","💝",
];

const COLORS = [
  "#FCA5A5","#FDBA74","#FCD34D","#86EFAC","#67E8F9","#93C5FD","#C4B5FD","#F0ABFC",
  "#FB7185","#FB923C","#FACC15","#4ADE80","#22D3EE","#60A5FA","#A78BFA","#E879F9",
];

const buildEmojiDataUrl = (emoji: string, bg: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
    <rect width='128' height='128' rx='24' fill='${bg}'/>
    <text x='64' y='86' font-size='72' text-anchor='middle' font-family='Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif'>${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default function AvatarPicker({ builtIn = [], onSelect }: AvatarPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🌱");
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[3]);

  const confirmEmoji = () => {
    onSelect(buildEmojiDataUrl(selectedEmoji, selectedColor));
  };

  return (
    <Tabs defaultValue="svg" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="svg">Illustrated</TabsTrigger>
        <TabsTrigger value="emoji">Emoji + Colour</TabsTrigger>
      </TabsList>

      <TabsContent value="svg" className="mt-4">
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {builtIn.map((url) => (
              <button
                key={url}
                onClick={() => onSelect(url)}
                className="inline-flex items-center justify-center rounded-lg border bg-background p-1 hover:shadow focus-ring transition"
                aria-label="Choose avatar"
              >
                <img src={url} alt="Avatar option" className="h-16 w-16 object-contain" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="emoji" className="mt-4">
        <div className="space-y-4">
          <div
            className="mx-auto h-24 w-24 rounded-2xl flex items-center justify-center text-5xl shadow-elev animate-scale-in"
            style={{ backgroundColor: selectedColor }}
            aria-label="Preview"
          >
            {selectedEmoji}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Choose an emoji</p>
            <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  className={`h-9 w-9 rounded-md text-xl hover:bg-accent/40 focus-ring transition ${
                    selectedEmoji === e ? "bg-primary/15 ring-2 ring-primary" : ""
                  }`}
                  aria-label={`Emoji ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Choose a colour</p>
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`h-8 w-8 rounded-full border-2 focus-ring transition ${
                    selectedColor === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Colour ${c}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={confirmEmoji}
            className="w-full btn-hero shadow-glow"
          >
            Use this avatar
          </button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
