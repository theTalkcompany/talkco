import { supabase } from "@/integrations/supabase/client";

export type Quote = { text: string; author: string };

// Admin user ID - replace with your actual user ID after creating account
const ADMIN_USER_ID = "admin"; // You'll need to replace this with your actual user ID

export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  // For now, check if user email contains "admin" - you can make this more secure later
  return user?.email?.includes("admin") || false;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getUserSeed(userId: string, date: string): number {
  // Create a simple hash from userId and date for consistent randomization
  let hash = 0;
  const str = userId + date;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export async function getDailyQuote(userId?: string): Promise<Quote> {
  const key = todayKey();
  const storageKey = `talk_quote_${userId || 'anonymous'}_${key}`;
  
  // Check if we already have today's quote cached
  const cached = localStorage.getItem(storageKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // If parsing fails, we'll fetch a new quote
    }
  }

  // Fetch all quotes from database
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('text, author');

  if (error || !quotes || quotes.length === 0) {
    // Fallback to default quote if database is empty
    const fallback = { text: "You are stronger than you think, braver than you feel.", author: "Unknown" };
    localStorage.setItem(storageKey, JSON.stringify(fallback));
    return fallback;
  }

  // Use user-specific seed for consistent daily quote selection
  const seed = getUserSeed(userId || 'anonymous', key);
  const selectedQuote = quotes[seed % quotes.length];
  
  // Cache the quote for today
  localStorage.setItem(storageKey, JSON.stringify(selectedQuote));
  
  return selectedQuote;
}

export async function addQuote(text: string, author: string): Promise<boolean> {
  const { error } = await supabase
    .from('quotes')
    .insert([{ text, author }]);
  
  return !error;
}

export async function getAllQuotes(): Promise<Quote[]> {
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('text, author')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
  
  return quotes || [];
}

export async function deleteQuote(text: string): Promise<boolean> {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('text', text);
  
  return !error;
}