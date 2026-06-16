export type LibraryQuote = { text: string; author: string };

export const QUOTE_LIBRARY: LibraryQuote[] = [
  { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
  { text: "There is hope, even when your brain tells you there isn't.", author: "John Green" },
  { text: "Mental health…is not a destination, but a process. It's about how you drive, not where you're going.", author: "Noam Shpancer" },
  { text: "You are not alone. You are seen. I am with you. You are not alone.", author: "Shonda Rhimes" },
  { text: "Healing takes time, and asking for help is a courageous step.", author: "Mariska Hargitay" },
  { text: "Self-care is how you take your power back.", author: "Lalah Delia" },
  { text: "Vulnerability sounds like truth and feels like courage.", author: "Brené Brown" },
  { text: "What mental health needs is more sunlight, more candor, and more unashamed conversation.", author: "Glenn Close" },
  { text: "You, yourself, as much as anybody in the entire universe, deserve your love and affection.", author: "Buddha" },
  { text: "The strongest people are those who win battles we know nothing about.", author: "Jonathan Harnisch" },
  { text: "Be patient and tough; someday this pain will be useful to you.", author: "Ovid" },
  { text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.", author: "Khalil Gibran" },
  { text: "You are allowed to be both a masterpiece and a work in progress, simultaneously.", author: "Sophia Bush" },
  { text: "Sometimes the people around you won't understand your journey. They don't need to, it's not for them.", author: "Joubert Botha" },
  { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
  { text: "Promise me you'll always remember: you're braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "Just when the caterpillar thought the world was over, it became a butterfly.", author: "Proverb" },
  { text: "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared, or anxious. Having feelings doesn't make you a negative person. It makes you human.", author: "Lori Deschene" },
  { text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit. Then get back to work.", author: "Ralph Marston" },
  { text: "Nothing diminishes anxiety faster than action.", author: "Walter Anderson" },
  { text: "Recovery is hard. Regret is harder.", author: "Brittany Burgunder" },
  { text: "There is a crack in everything. That's how the light gets in.", author: "Leonard Cohen" },
  { text: "It's okay to not be okay — as long as you don't stay that way alone.", author: "Unknown" },
  { text: "Feelings are much like waves, we can't stop them from coming but we can choose which one to surf.", author: "Jonatan Mårtensson" },
];

export const PASTEL_BGS = [
  "bg-rose-100/70 dark:bg-rose-950/30",
  "bg-amber-100/70 dark:bg-amber-950/30",
  "bg-emerald-100/70 dark:bg-emerald-950/30",
  "bg-sky-100/70 dark:bg-sky-950/30",
  "bg-violet-100/70 dark:bg-violet-950/30",
  "bg-pink-100/70 dark:bg-pink-950/30",
  "bg-teal-100/70 dark:bg-teal-950/30",
  "bg-orange-100/70 dark:bg-orange-950/30",
];

export function getDailyLibraryQuote(): LibraryQuote {
  const d = new Date();
  const dayOfYear = Math.floor(
    (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTE_LIBRARY[dayOfYear % QUOTE_LIBRARY.length];
}
