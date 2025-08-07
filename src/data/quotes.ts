export type Quote = { text: string; author: string };

const QUOTES: Quote[] = [
  { text: "You are stronger than you think, braver than you feel.", author: "Unknown" },
  { text: "This too shall pass.", author: "Persian Proverb" },
  { text: "No storm, not even the one in your life, can last forever.", author: "Iyanla Vanzant" },
  { text: "Be gentle with yourself—you’re doing the best you can.", author: "Unknown" },
  { text: "One day at a time.", author: "Al-Anon" },
  { text: "You matter more than you know.", author: "Unknown" },
  { text: "Small steps still move you forward.", author: "Unknown" },
  { text: "Your feelings are valid. Your voice matters.", author: "Unknown" },
  { text: "Healing is not linear.", author: "Unknown" },
  { text: "You’ve survived 100% of your bad days so far.", author: "Unknown" },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

export function getDailyQuote(): Quote {
  const key = todayKey();
  const storedKey = localStorage.getItem("talk_quote_date");
  const stored = localStorage.getItem("talk_quote_text");
  if (storedKey === key && stored) {
    const found = QUOTES.find(q => q.text === stored);
    if (found) return found;
  }
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  localStorage.setItem("talk_quote_date", key);
  localStorage.setItem("talk_quote_text", q.text);
  return q;
}
