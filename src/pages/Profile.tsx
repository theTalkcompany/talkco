import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, AlertTriangle, Heart, MessageCircle, Pencil, Lock, LayoutGrid, Rows3, Pin, Sparkles, Check,
  Flame, Lock as LockIcon, ChevronDown, Download, Mail, Key, Trash2, Bot, ArrowRight, Info,
} from "lucide-react";
import AvatarPicker from "@/components/profile/AvatarPicker";
import ReportsAdmin from "@/components/admin/ReportsAdmin";
import WillowAdmin from "@/components/admin/WillowAdmin";
import { useUserRole } from "@/hooks/useUserRole";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
}

interface PostRow {
  id: string;
  content: string;
  created_at: string;
  likes: { id: string }[];
  comments: { id: string }[];
}

const presetSeeds = ["Aurora","Milo","Nova","Zara","Leo","Ivy","Juno","Kai","Luna","Nico","Orion","Piper","Quinn","Riley","Sage","Theo"];
const presetAvatars = presetSeeds.map((s) => `/avatars/${s}.svg`);

const BANNER_PRESETS = [
  { id: "purple", label: "Lilac",  css: "linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#5b21b6 100%)" },
  { id: "sunset", label: "Sunset", css: "linear-gradient(135deg,#f9a8d4 0%,#a78bfa 60%,#6366f1 100%)" },
  { id: "ocean",  label: "Ocean",  css: "linear-gradient(135deg,#a5b4fc 0%,#818cf8 50%,#4f46e5 100%)" },
  { id: "mint",   label: "Mint",   css: "linear-gradient(135deg,#a7f3d0 0%,#a5b4fc 60%,#7c3aed 100%)" },
  { id: "peach",  label: "Peach",  css: "linear-gradient(135deg,#fed7aa 0%,#fda4af 50%,#a78bfa 100%)" },
  { id: "dots",   label: "Dotted", css: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0) 0 0/16px 16px, linear-gradient(135deg,#7c3aed,#a78bfa)" },
];

const RING_COLORS = ["#a78bfa","#f472b6","#60a5fa","#34d399","#fbbf24","#fb7185","#94a3b8","#7c3aed"];

const VIBES = [
  { emoji: "😔", label: "Struggling" },
  { emoji: "😐", label: "Getting by" },
  { emoji: "🙂", label: "Doing okay" },
  { emoji: "😊", label: "Good day" },
  { emoji: "💪", label: "Thriving" },
];

const META_RE = /^\[META:({.*?})\]\s*/;
function parsePost(raw: string): { meta: any; content: string } {
  const m = raw.match(META_RE);
  if (!m) return { meta: {}, content: raw };
  try { return { meta: JSON.parse(m[1]), content: raw.replace(META_RE, "") }; }
  catch { return { meta: {}, content: raw }; }
}

const DAY_LABELS = ["S","M","T","W","T","F","S"];

const DEFAULT_PREFS = {
  publicStreak: true,
  allowReplies: true,
  notifyReplies: true,
  publicTopics: true,
  anonByDefault: true,
};
type Prefs = typeof DEFAULT_PREFS;

export default function Profile() {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [showReports, setShowReports] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState({ full_name: "", display_name: "", email: "", phone: "", address: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [commentDates, setCommentDates] = useState<string[]>([]);
  const [view, setView] = useState<"feed" | "grid">("feed");
  const [bannerId, setBannerId] = useState<string>("purple");
  const [ringColor, setRingColor] = useState<string>(RING_COLORS[0]);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [vibe, setVibe] = useState<{ emoji: string; label: string } | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [willowSessions, setWillowSessions] = useState(0);

  const banner = BANNER_PRESETS.find(b => b.id === bannerId) || BANNER_PRESETS[0];

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      if (!uid) { setLoading(false); return; }
      if (!mounted) return;
      setUserId(uid);
      setAccountCreatedAt(session?.user?.created_at ?? null);

      setBio(localStorage.getItem(`talkco_bio_${uid}`) || "");
      setBannerId(localStorage.getItem(`talkco_banner_${uid}`) || "purple");
      setRingColor(localStorage.getItem(`talkco_ring_${uid}`) || RING_COLORS[0]);
      setPinnedId(localStorage.getItem(`talkco_pinned_${uid}`));
      try {
        const v = localStorage.getItem(`talkco_vibe_${uid}`);
        if (v) setVibe(JSON.parse(v));
        const p = localStorage.getItem(`talkco_prefs_${uid}`);
        if (p) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(p) });
      } catch {}
      setWillowSessions(Number(localStorage.getItem(`talkco_willow_sessions_${uid}`) || 0));

      const [profileRes, postsRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, display_name, email, phone, address, avatar_url").eq("user_id", uid).maybeSingle(),
        supabase.from("posts").select("id, content, created_at, likes(id), comments(id)").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("comments").select("id, created_at").eq("user_id", uid),
      ]);

      if (!mounted) return;
      const data = profileRes.data;
      if (profileRes.error) toast({ title: "Failed to load profile", description: profileRes.error.message, variant: "destructive" });
      setProfile(data as ProfileRow | null);
      setEditing({
        full_name: (data?.full_name as string) || "",
        display_name: (data?.display_name as string) || "",
        email: (data?.email as string) || session?.user?.email || "",
        phone: (data?.phone as string) || "",
        address: (data?.address as string) || "",
      });
      setAvatarUrl((data?.avatar_url as string) || null);
      setPosts((postsRes.data as PostRow[]) || []);
      setCommentCount(commentsRes.data?.length || 0);
      setCommentDates((commentsRes.data || []).map((c: any) => c.created_at));
      setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, [toast]);

  const displayName = editing.display_name || "Anonymous";
  const initial = (editing.display_name?.[0] || editing.full_name?.[0] || "U").toUpperCase();

  const daysWithTalk = useMemo(() => {
    if (!accountCreatedAt) return 1;
    return Math.max(1, Math.floor((Date.now() - new Date(accountCreatedAt).getTime()) / 86400000));
  }, [accountCreatedAt]);

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach(p => {
      const tag = parsePost(p.content).meta?.tag;
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
  }, [posts]);

  // Active day set (timestamps at midnight)
  const activeDaySet = useMemo(() => {
    const set = new Set<number>();
    [...posts.map(p => p.created_at), ...commentDates].forEach(d => {
      const dt = new Date(d); dt.setHours(0, 0, 0, 0); set.add(dt.getTime());
    });
    return set;
  }, [posts, commentDates]);

  const weekStreak = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today); start.setDate(today.getDate() - today.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i);
      return { label: DAY_LABELS[i], active: activeDaySet.has(d.getTime()), isToday: d.getTime() === today.getTime() };
    });
  }, [activeDaySet]);

  const currentStreak = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let count = 0;
    const d = new Date(today);
    // If today not active, start counting from yesterday (so streak doesn't break mid-day)
    if (!activeDaySet.has(d.getTime())) d.setDate(d.getDate() - 1);
    while (activeDaySet.has(d.getTime())) { count++; d.setDate(d.getDate() - 1); }
    return count;
  }, [activeDaySet]);

  const pinnedPost = useMemo(() => posts.find(p => p.id === pinnedId) || null, [posts, pinnedId]);
  const otherPosts = useMemo(() => posts.filter(p => p.id !== pinnedId), [posts, pinnedId]);

  const badges = useMemo(() => [
    { id: "first_post",   label: "First Post",      emoji: "🌱", unlocked: posts.length >= 1 },
    { id: "first_reply",  label: "First Reply",     emoji: "💬", unlocked: commentCount >= 1 },
    { id: "streak_7",     label: "7-Day Streak",    emoji: "🔥", unlocked: currentStreak >= 7 },
    { id: "helpful_5",    label: "Helpful Member",  emoji: "🤝", unlocked: commentCount >= 5 },
    { id: "week_one",     label: "Week One",        emoji: "💜", unlocked: daysWithTalk >= 7 },
  ], [posts.length, commentCount, currentStreak, daysWithTalk]);

  // Badge unlock toasts (compare against previously seen unlocks)
  useEffect(() => {
    if (!userId || loading) return;
    const key = `talkco_badges_seen_${userId}`;
    let seen: string[] = [];
    try { seen = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
    const newlyUnlocked = badges.filter(b => b.unlocked && !seen.includes(b.id));
    if (newlyUnlocked.length === 0) return;
    newlyUnlocked.forEach((b, i) => {
      setTimeout(() => toast({ title: `🎉 Badge unlocked: ${b.label}!`, description: "Keep going — every step matters." }), i * 600);
    });
    localStorage.setItem(key, JSON.stringify([...seen, ...newlyUnlocked.map(b => b.id)]));
  }, [badges, userId, loading, toast]);

  // Live-refresh Willow session count when the user returns to this tab
  useEffect(() => {
    if (!userId) return;
    const refresh = () => setWillowSessions(Number(localStorage.getItem(`talkco_willow_sessions_${userId}`) || 0));
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [userId]);

  const togglePin = (id: string) => {
    if (!userId) return;
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    if (next) localStorage.setItem(`talkco_pinned_${userId}`, next);
    else localStorage.removeItem(`talkco_pinned_${userId}`);
    toast({ title: next ? "Pinned to profile" : "Unpinned" });
  };

  const updateVibe = (v: { emoji: string; label: string } | null) => {
    setVibe(v);
    if (!userId) return;
    if (v) localStorage.setItem(`talkco_vibe_${userId}`, JSON.stringify(v));
    else localStorage.removeItem(`talkco_vibe_${userId}`);
  };

  const updatePref = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (userId) localStorage.setItem(`talkco_prefs_${userId}`, JSON.stringify(next));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        full_name: editing.full_name || null,
        display_name: editing.display_name || null,
        email: editing.email || null,
        phone: editing.phone || null,
        address: editing.address || null,
        avatar_url: avatarUrl || null,
      };
      const { error } = profile
        ? await supabase.from("profiles").update(payload).eq("user_id", userId)
        : await supabase.from("profiles").insert(payload);
      if (error) throw error;
      localStorage.setItem(`talkco_bio_${userId}`, bio);
      localStorage.setItem(`talkco_banner_${userId}`, bannerId);
      localStorage.setItem(`talkco_ring_${userId}`, ringColor);
      setProfile(payload as ProfileRow);
      toast({ title: "Profile saved" });
      setEditOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const choosePreset = async (url: string) => {
    if (!userId) return;
    try {
      setAvatarUrl(url);
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId, avatar_url: url,
        full_name: editing.full_name || null, display_name: editing.display_name || null,
        email: editing.email || null, phone: editing.phone || null, address: editing.address || null,
      }, { onConflict: "user_id" } as any);
      if (error) throw error;
      toast({ title: "Avatar updated" });
      setAvatarOpen(false);
    } catch (err: any) {
      toast({ title: "Failed to set avatar", description: err.message, variant: "destructive" });
    }
  };

  const handleDownloadData = async () => {
    if (!userId) return;
    const blob = new Blob([JSON.stringify({ profile, posts, commentCount, prefs, vibe, bio, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `talkco-data-${userId}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download started" });
  };

  const handlePasswordReset = async () => {
    if (!editing.email || editing.email.endsWith("@talkco.app")) {
      return toast({ title: "Connect your email to enable password reset", description: "Add a real email in Edit Profile → Advanced." });
    }
    const { error } = await supabase.auth.resetPasswordForEmail(editing.email);
    if (error) toast({ title: "Couldn't send reset", description: error.message, variant: "destructive" });
    else toast({ title: "Reset email sent", description: "Check your inbox to set a new password." });
  };

  const handleDeleteAccount = () => setDeleteOpen(true);

  const confirmDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) {
        toast({ title: "Couldn't delete account", description: error.message, variant: "destructive" });
        setDeleting(false);
        return;
      }
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your account and data have been permanently removed." });
      window.location.href = "/auth";
    } catch (e: any) {
      toast({ title: "Couldn't delete account", description: e?.message ?? "Unexpected error", variant: "destructive" });
      setDeleting(false);
    }
  };

  const canonical = useMemo(() => `${window.location.origin}/profile`, []);

  const PostCard = ({ post, pinned }: { post: PostRow; pinned?: boolean }) => {
    const { meta, content } = parsePost(post.content);
    const tag = meta?.tag as string | undefined;
    const snippet = content.length > 140 ? content.slice(0, 140).trimEnd() + "…" : content;
    return (
      <article className={`rounded-xl border p-4 transition-shadow hover:shadow-sm animate-fade-in ${pinned ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
        <header className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs">
            {pinned && <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-primary font-medium"><Pin className="h-3 w-3" /> Pinned</span>}
            {tag && <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-primary">#{tag}</span>}
            <span className="text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <button onClick={() => togglePin(post.id)} className={`p-1 rounded transition-colors ${pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title={pinned ? "Unpin" : "Pin to profile"}>
            <Pin className="h-3.5 w-3.5" />
          </button>
        </header>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{snippet}</p>
        <footer className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likes?.length || 0}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.comments?.length || 0}</span>
        </footer>
      </article>
    );
  };

  const GridTile = ({ post }: { post: PostRow }) => {
    const { meta, content } = parsePost(post.content);
    return (
      <button onClick={() => togglePin(post.id)} className={`relative aspect-square rounded-lg border bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-left overflow-hidden hover:shadow-sm transition ${pinnedId === post.id ? "ring-2 ring-primary" : ""}`} title="Tap to pin/unpin">
        {pinnedId === post.id && <Pin className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />}
        {meta?.tag && <div className="text-[10px] font-medium text-primary mb-1">#{meta.tag}</div>}
        <p className="text-xs text-foreground/80 line-clamp-5 leading-snug">{content}</p>
        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes?.length || 0}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments?.length || 0}</span>
        </div>
      </button>
    );
  };

  return (
    <>
      <Helmet>
        <title>Profile | Talk</title>
        <meta name="description" content="Your Talk profile — your space, anonymous by default." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Banner + identity */}
      <section className="animate-fade-in">
        <div className="relative rounded-2xl overflow-hidden shadow-elev" style={{ background: banner.css, minHeight: 160 }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)} className="absolute top-3 right-3 bg-white/90 hover:bg-white text-primary border-0 shadow-sm">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit Profile
          </Button>
        </div>

        <div className="relative px-2 sm:px-4 -mt-12 sm:-mt-10 flex items-end gap-4">
          <button
            onClick={() => setAvatarOpen(true)}
            className="flex-shrink-0 rounded-full bg-background transition hover:scale-105 p-1"
            style={{ boxShadow: `0 0 0 3px ${ringColor}, 0 0 0 6px hsl(var(--background))` }}
            aria-label="Change avatar"
          >
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={avatarUrl || undefined} alt="Your avatar" />
              <AvatarFallback className="text-2xl bg-primary/15 text-primary">{initial}</AvatarFallback>
            </Avatar>
          </button>
          <div className="pb-1 sm:pb-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{displayName}</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition hover:bg-muted ${vibe ? "bg-primary/10 border-primary/30 text-primary" : "text-muted-foreground"}`}>
                    {vibe ? <><span>{vibe.emoji}</span><span>{vibe.label}</span></> : <><Sparkles className="h-3 w-3" /> Set vibe</>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Current vibe</p>
                  <div className="grid gap-1">
                    {VIBES.map(v => (
                      <button key={v.label} onClick={() => updateVibe(v)} className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted text-left ${vibe?.label === v.label ? "bg-primary/10 text-primary" : ""}`}>
                        <span className="text-lg">{v.emoji}</span><span>{v.label}</span>
                      </button>
                    ))}
                    {vibe && <button onClick={() => updateVibe(null)} className="text-xs text-muted-foreground px-2 py-1 hover:text-foreground text-left">Clear vibe</button>}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" /> Your profile is only visible to Talk members</p>
            {bio && <p className="mt-1 text-sm text-foreground/80 line-clamp-2">{bio}</p>}
          </div>
        </div>

        {prefs.publicTopics && topTags.length > 0 && (
          <div className="mt-3 px-2 sm:px-4 flex flex-wrap gap-1.5">
            {topTags.map(t => <span key={t} className="rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5">#{t}</span>)}
          </div>
        )}
      </section>

      {/* Stats bar */}
      {userId && (
        <section className="mt-5 grid grid-cols-3 rounded-xl border bg-card divide-x animate-fade-in">
          <div className="text-center py-4"><p className="text-2xl font-bold">{posts.length}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">Posts</p></div>
          <div className="text-center py-4"><p className="text-2xl font-bold">{commentCount}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">Supportive Replies</p></div>
          <div className="text-center py-4"><p className="text-2xl font-bold">{daysWithTalk}</p><p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">Days with Talk</p></div>
        </section>
      )}

      {/* Streak */}
      {userId && prefs.publicStreak && (
        <section className="mt-4 rounded-xl border bg-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Your Check-in Streak 🔥</h2>
            </div>
            <p className="text-lg font-bold text-primary">{currentStreak} day{currentStreak === 1 ? "" : "s"} streak!</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3 inline-flex items-center gap-1"><Info className="h-3 w-3" /> A day counts when you post, reply, or chat with Willow.</p>
          <div className="flex items-center justify-between gap-1">
            {weekStreak.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-medium transition-all
                    ${d.active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"}
                    ${d.isToday && !d.active ? "ring-2 ring-primary/40" : ""}`}>
                  {d.active ? <Flame className="h-4 w-4" /> : d.label}
                </div>
                <span className={`text-[10px] ${d.isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Badges */}
      {userId && (
        <section className="mt-4 rounded-xl border bg-card p-4 animate-fade-in">
          <h2 className="text-sm font-semibold mb-3">Your Badges</h2>
          <div className="grid grid-cols-5 gap-2">
            {badges.map(b => (
              <div key={b.id} className={`relative flex flex-col items-center gap-1 rounded-lg p-2 text-center transition ${b.unlocked ? "bg-primary/5" : "bg-muted/40 opacity-60"}`} title={b.label}>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${b.unlocked ? "bg-gradient-to-br from-primary/20 to-primary/5" : "bg-background grayscale"}`}>
                  {b.unlocked ? b.emoji : <LockIcon className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-[10px] font-medium leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Willow sessions */}
      {userId && (
        <section className="mt-4 rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm font-semibold">Your Willow Sessions</p>
                <p className="text-xs text-muted-foreground">{willowSessions} conversation{willowSessions === 1 ? "" : "s"} so far</p>
              </div>
            </div>
            <Button asChild size="sm" variant="hero"><Link to="/chat">Continue <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link></Button>
          </div>
        </section>
      )}

      {/* Posts toggle + list */}
      {userId && (
        <section className="mt-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Your posts</h2>
            <div className="inline-flex rounded-md border overflow-hidden">
              <button onClick={() => setView("feed")} className={`p-2 ${view === "feed" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`} aria-label="Feed view"><Rows3 className="h-4 w-4" /></button>
              <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`} aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></button>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/50 p-6 text-center">
              <p className="text-sm font-medium">No posts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Share your first thought in the feed — it might help someone else.</p>
            </div>
          ) : view === "feed" ? (
            <div className="space-y-3">
              {pinnedPost && <PostCard post={pinnedPost} pinned />}
              {otherPosts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(pinnedPost ? [pinnedPost, ...otherPosts] : posts).map(p => <GridTile key={p.id} post={p} />)}
            </div>
          )}
        </section>
      )}



      {/* Admin */}
      {isAdmin && (
        <section className="mt-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> System Settings</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                <Dialog open={showSystemSettings} onOpenChange={setShowSystemSettings}>
                  <DialogTrigger asChild><Button variant="outline" className="flex items-center gap-2"><Shield className="h-4 w-4" /> System Settings</Button></DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>System Settings</DialogTitle><DialogDescription>Manage configuration, privacy policy, and user roles</DialogDescription></DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-2"><WillowAdmin /></div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showReports} onOpenChange={setShowReports}>
                  <DialogTrigger asChild><Button variant="outline" className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> View User Reports</Button></DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader><DialogTitle>User Reports Management</DialogTitle><DialogDescription>Review and manage reports submitted by community members</DialogDescription></DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0 pr-2"><ReportsAdmin /></div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Account / Danger zone */}
      {userId && (
        <section className="mt-6 mb-10 rounded-xl border bg-muted/30 animate-fade-in">
          <button onClick={() => setAccountOpen(o => !o)} className="w-full flex items-center justify-between gap-2 p-4 text-left">
            <span className="text-sm font-semibold text-muted-foreground">Account</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${accountOpen ? "rotate-180" : ""}`} />
          </button>
          {accountOpen && (
            <div className="border-t p-4 grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="justify-start" onClick={() => setEditOpen(true)}><Mail className="h-4 w-4 mr-2" /> Change email</Button>
              <Button variant="outline" className="justify-start" onClick={handlePasswordReset}><Key className="h-4 w-4 mr-2" /> Change password</Button>
              <Button variant="outline" className="justify-start" onClick={handleDownloadData}><Download className="h-4 w-4 mr-2" /> Download my data</Button>
              <Button variant="outline" className="justify-start text-destructive hover:text-destructive" onClick={handleDeleteAccount}><Trash2 className="h-4 w-4 mr-2" /> Delete account</Button>
            </div>
          )}
        </section>
      )}

      {/* Edit profile modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription>Customise how you appear in Talk. Your details stay private.</DialogDescription></DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="prefs">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label>Banner style</Label>
                <div className="grid grid-cols-3 gap-2">
                  {BANNER_PRESETS.map(b => (
                    <button key={b.id} onClick={() => setBannerId(b.id)} className={`relative h-14 rounded-lg overflow-hidden ring-offset-2 transition ${bannerId === b.id ? "ring-2 ring-primary" : "ring-1 ring-border"}`} style={{ background: b.css }} aria-label={b.label}>
                      {bannerId === b.id && <Check className="absolute bottom-1 right-1 h-3.5 w-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Avatar ring colour</Label>
                <div className="flex flex-wrap gap-2">
                  {RING_COLORS.map(c => (
                    <button key={c} onClick={() => setRingColor(c)} className={`h-8 w-8 rounded-full border-2 transition ${ringColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} aria-label={`Ring ${c}`} />
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_name">Display name</Label>
                <Input id="display_name" value={editing.display_name} onChange={(e) => setEditing(v => ({ ...v, display_name: e.target.value }))} placeholder="How others will see you" className="text-base min-h-[44px]" />
                <p className="text-xs text-muted-foreground">Leave blank to appear as Anonymous.</p>
              </div>

              <div className="grid gap-2">
                <Label>Current vibe</Label>
                <Select value={vibe?.label || "__none"} onValueChange={(val) => updateVibe(val === "__none" ? null : VIBES.find(v => v.label === val) || null)}>
                  <SelectTrigger><SelectValue placeholder="How are you feeling this week?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No vibe set</SelectItem>
                    {VIBES.map(v => (
                      <SelectItem key={v.label} value={v.label}>{v.emoji} {v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Short bio</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, 160))} placeholder="A sentence or two about yourself…" rows={3} className="text-base" />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Advanced (private — only you see these)</summary>
                <div className="mt-3 grid gap-3">
                  <div className="grid gap-2"><Label htmlFor="full_name">Full name</Label><Input id="full_name" value={editing.full_name} onChange={(e) => setEditing(v => ({ ...v, full_name: e.target.value }))} placeholder="Your name" /></div>
                  <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={editing.email} onChange={(e) => setEditing(v => ({ ...v, email: e.target.value }))} placeholder="you@example.com" /></div>
                </div>
              </details>
            </TabsContent>

            <TabsContent value="prefs" className="mt-4">
              <div className="divide-y">
                {[
                  { key: "publicStreak" as const, label: "Show my streak publicly", desc: "Display your check-in streak on your profile." },
                  { key: "allowReplies" as const, label: "Allow others to reply to my posts", desc: "Turn off to disable replies on new posts." },
                  { key: "notifyReplies" as const, label: "Receive supportive reply notifications", desc: "Get notified when someone responds." },
                  { key: "publicTopics" as const, label: "Show my topic badges publicly", desc: "Display the topics you post about most." },
                  { key: "anonByDefault" as const, label: "Anonymous mode by default on all posts", desc: "Start every new post anonymous." },
                ].map(row => (
                  <div key={row.key} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.desc}</p>
                    </div>
                    <Switch checked={prefs[row.key]} onCheckedChange={(v) => updatePref(row.key, v)} />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Avatar picker */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Choose your avatar</DialogTitle><DialogDescription>Photos are optional — emoji and illustrated avatars keep you anonymous.</DialogDescription></DialogHeader>
          <AvatarPicker builtIn={presetAvatars} onSelect={choosePreset} />
        </DialogContent>
      </Dialog>
    </>
  );
}
