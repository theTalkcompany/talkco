import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportDialog } from "@/components/feed/ReportDialog";
import { useContentModeration } from "@/hooks/useContentModeration";
import { Pencil, Trash2, Save, X, Flag, AlertTriangle, Eye, Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import CommunityGuidelinesModal from "@/components/feed/CommunityGuidelinesModal";
import { getDailyLibraryQuote } from "@/data/quoteLibrary";

interface LikeRow { id: string; user_id: string }
interface CommentRow { id: string; content: string; user_id: string; created_at: string }
interface PostRow {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes?: LikeRow[];
  comments?: CommentRow[];
}

const TAGS = [
  { id: "Anxiety", label: "#Anxiety", soft: true },
  { id: "LowMood", label: "#LowMood", soft: true },
  { id: "Loneliness", label: "#Loneliness", soft: true },
  { id: "Relationships", label: "#Relationships" },
  { id: "SleepStruggles", label: "#SleepStruggles" },
  { id: "JustVenting", label: "#JustVenting" },
  { id: "WinToday", label: "#WinToday", positive: true },
];

const SOFT_TAGS = new Set(["Anxiety", "LowMood", "Loneliness"]);
const ANON_EMOJIS = ["🌙", "⭐", "🌿", "🌊", "🔥", "🌸", "🍃", "☁️", "🌻", "🦋", "🐚", "🌈"];
const ANON_COLORS = ["#FCA5A5", "#FCD34D", "#86EFAC", "#7DD3FC", "#C4B5FD", "#F9A8D4", "#FDBA74", "#A5B4FC"];

const META_RE = /^\[META:({.*?})\]\s*/;

function encodeMeta(meta: Record<string, any>, content: string) {
  return `[META:${JSON.stringify(meta)}] ${content}`;
}
function parsePost(raw: string): { meta: any; content: string } {
  const m = raw.match(META_RE);
  if (!m) return { meta: {}, content: raw };
  try {
    const meta = JSON.parse(m[1]);
    return { meta, content: raw.replace(META_RE, "") };
  } catch {
    return { meta: {}, content: raw };
  }
}
function anonAvatar(seed: string) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const e = ANON_EMOJIS[Math.abs(h) % ANON_EMOJIS.length];
  const c = ANON_COLORS[Math.abs(h >> 4) % ANON_COLORS.length];
  return { emoji: e, color: c };
}
function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const Feed = () => {
  const { toast } = useToast();
  const { moderateContent, isChecking } = useContentModeration();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState<Record<string, boolean>>({});
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [readMore, setReadMore] = useState<Record<string, boolean>>({});
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [reportDialog, setReportDialog] = useState<{
    open: boolean; postId?: string; commentId?: string;
    reportedUserId: string; reportedContent: string; contentType: "post" | "comment";
  }>({ open: false, reportedUserId: "", reportedContent: "", contentType: "post" });
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [composeTag, setComposeTag] = useState<string>("JustVenting");
  const [postAnon, setPostAnon] = useState(true);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [pendingPost, setPendingPost] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [filterChipsOpen, setFilterChipsOpen] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionUserId(session?.user?.id ?? null);
      await loadPosts();
    };
    init().finally(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSessionUserId(s?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadPosts = async () => {
    const [postsResult, profilesResult] = await Promise.all([
      supabase.from("posts").select("id, content, user_id, created_at, likes(id, user_id), comments(id, content, user_id, created_at)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, display_name"),
    ]);
    if (postsResult.error) {
      toast({ title: "Couldn't load feed", description: postsResult.error.message, variant: "destructive" });
      return;
    }
    setPosts(postsResult.data as unknown as PostRow[]);
    if (!profilesResult.error && profilesResult.data) {
      const map: Record<string, string> = {};
      profilesResult.data.forEach((pr: any) => { if (pr.display_name) map[pr.user_id] = pr.display_name; });
      setNameMap(map);
    }
  };

  const canPost = useMemo(() => !!sessionUserId && newPost.trim().length > 0 && !posting && !!composeTag, [sessionUserId, newPost, posting, composeTag]);
  const guidelinesKey = useMemo(() => sessionUserId ? `talkco_feed_guidelines_${sessionUserId}` : "", [sessionUserId]);

  const handleCreatePost = async () => {
    if (!sessionUserId) { toast({ title: "Sign in required", description: "Please sign in to share a post." }); return; }
    if (!composeTag) { toast({ title: "Pick a tag", description: "Choose a topic to help others find your post." }); return; }
    const content = newPost.trim();
    if (!content) return;
    if (guidelinesKey && !localStorage.getItem(guidelinesKey)) {
      setPendingPost(true); setGuidelinesOpen(true); return;
    }
    await actuallyPost(content);
  };

  const actuallyPost = async (content: string) => {
    if (!sessionUserId) return;
    setPosting(true);
    const meta: any = { tag: composeTag, anon: postAnon };
    const finalContent = encodeMeta(meta, content);
    const { data: newPostData, error } = await supabase.from("posts").insert({ content: finalContent, user_id: sessionUserId }).select().single();
    if (error) { toast({ title: "Couldn't post", description: error.message, variant: "destructive" }); setPosting(false); return; }
    await moderateContent(content, sessionUserId, 'post', newPostData.id);
    setNewPost(""); setComposeTag("JustVenting"); setPostAnon(true);
    toast({ title: "Posted", description: "Your post is now live." });
    await loadPosts();
    setPosting(false);
  };

  const acceptGuidelines = async () => {
    if (guidelinesKey) localStorage.setItem(guidelinesKey, "1");
    setGuidelinesOpen(false);
    if (pendingPost) { setPendingPost(false); await actuallyPost(newPost.trim()); }
  };
  const cancelGuidelines = () => { setGuidelinesOpen(false); setPendingPost(false); };

  const toggleLike = async (post: PostRow) => {
    if (!sessionUserId) { toast({ title: "Sign in to react", description: "Sign in to support posts." }); return; }
    const liked = post.likes?.some((l) => l.user_id === sessionUserId);
    if (liked) {
      const { error } = await supabase.from("likes").delete().match({ post_id: post.id, user_id: sessionUserId });
      if (error) return toast({ title: "Couldn't undo", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("likes").insert({ post_id: post.id, user_id: sessionUserId });
      if (error) return toast({ title: "Couldn't react", description: error.message, variant: "destructive" });
    }
    await loadPosts();
  };

  const handleAddComment = async (postId: string) => {
    if (!sessionUserId) { toast({ title: "Sign in to reply" }); return; }
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    setCommenting((s) => ({ ...s, [postId]: true }));
    const { data, error } = await supabase.from("comments").insert({ post_id: postId, content: text, user_id: sessionUserId }).select().single();
    if (error) { toast({ title: "Couldn't reply", description: error.message, variant: "destructive" }); setCommenting((s) => ({ ...s, [postId]: false })); return; }
    await moderateContent(text, sessionUserId, 'comment', data.id);
    setCommentInputs((s) => ({ ...s, [postId]: "" }));
    await loadPosts();
    setCommenting((s) => ({ ...s, [postId]: false }));
  };

  const openReportDialog = (type: "post" | "comment", postId?: string, commentId?: string, reportedUserId?: string, content?: string) => {
    setReportDialog({ open: true, postId, commentId, reportedUserId: reportedUserId || "", reportedContent: content || "", contentType: type });
  };

  const handleEditPost = (postId: string, currentContent: string) => {
    const { content } = parsePost(currentContent);
    setEditing(p => ({ ...p, [`post_${postId}`]: true }));
    setEditingContent(p => ({ ...p, [`post_${postId}`]: content }));
  };
  const handleSavePostEdit = async (postId: string) => {
    if (!sessionUserId) return;
    const newContent = editingContent[`post_${postId}`];
    if (!newContent?.trim()) return;
    const original = posts.find(p => p.id === postId);
    const { meta } = original ? parsePost(original.content) : { meta: {} };
    const final = encodeMeta(meta, newContent.trim());
    try {
      const { error } = await supabase.from("posts").update({ content: final, updated_at: new Date().toISOString() }).eq("id", postId).eq("user_id", sessionUserId);
      if (error) throw error;
      await moderateContent(newContent.trim(), sessionUserId, 'post', postId);
      setEditing(p => ({ ...p, [`post_${postId}`]: false }));
      await loadPosts();
      toast({ title: "Post updated" });
    } catch (e: any) { toast({ title: "Update failed", description: e.message, variant: "destructive" }); }
  };
  const handleCancelPostEdit = (postId: string) => setEditing(p => ({ ...p, [`post_${postId}`]: false }));
  const handleDeletePost = async (postId: string) => {
    if (!sessionUserId || !confirm("Delete this post?")) return;
    setDeleting(p => ({ ...p, [`post_${postId}`]: true }));
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", sessionUserId);
      if (error) throw error;
      await loadPosts(); toast({ title: "Post deleted" });
    } catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
    finally { setDeleting(p => ({ ...p, [`post_${postId}`]: false })); }
  };

  const handleEditComment = (id: string, content: string) => {
    setEditing(p => ({ ...p, [`comment_${id}`]: true }));
    setEditingContent(p => ({ ...p, [`comment_${id}`]: content }));
  };
  const handleSaveCommentEdit = async (id: string) => {
    if (!sessionUserId) return;
    const newContent = editingContent[`comment_${id}`];
    if (!newContent?.trim()) return;
    try {
      const { error } = await supabase.from("comments").update({ content: newContent.trim(), updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", sessionUserId);
      if (error) throw error;
      await moderateContent(newContent.trim(), sessionUserId, 'comment', id);
      setEditing(p => ({ ...p, [`comment_${id}`]: false }));
      await loadPosts();
    } catch (e: any) { toast({ title: "Update failed", description: e.message, variant: "destructive" }); }
  };
  const handleCancelCommentEdit = (id: string) => setEditing(p => ({ ...p, [`comment_${id}`]: false }));
  const handleDeleteComment = async (id: string) => {
    if (!sessionUserId || !confirm("Delete this comment?")) return;
    setDeleting(p => ({ ...p, [`comment_${id}`]: true }));
    try {
      const { error } = await supabase.from("comments").delete().eq("id", id).eq("user_id", sessionUserId);
      if (error) throw error;
      await loadPosts();
    } catch (e: any) { toast({ title: "Delete failed", description: e.message, variant: "destructive" }); }
    finally { setDeleting(p => ({ ...p, [`comment_${id}`]: false })); }
  };

  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter(p => parsePost(p.content).meta?.tag === selectedTag);
  }, [posts, selectedTag]);

  const renderPost = (post: PostRow, isPreview = false) => {
    const { meta, content } = parsePost(post.content);
    const tag = meta.tag as string | undefined;
    const isAnon = !!meta.anon;
    const isSoft = tag && SOFT_TAGS.has(tag);
    const isRevealed = !!revealed[post.id];
    const showMore = !!readMore[post.id];
    const lines = content.split("\n");
    const isLong = content.length > 220 || lines.length > 3;
    const truncated = !showMore && isLong ? content.slice(0, 220).trimEnd() + "…" : content;

    const displayName = isAnon ? "Anonymous" : (nameMap[post.user_id] || "Someone");
    const avatar = isAnon
      ? anonAvatar(post.id)
      : { emoji: (nameMap[post.user_id] || "S").slice(0, 1).toUpperCase(), color: "#C7D2FE" };

    const likeCount = post.likes?.length ?? 0;
    const likedByMe = !!sessionUserId && post.likes?.some(l => l.user_id === sessionUserId);
    const comments = post.comments || [];
    const isOpen = !!expanded[post.id];
    const isEditing = editing[`post_${post.id}`];

    return (
      <article key={post.id} className="rounded-xl border bg-card p-4 animate-fade-in transition-shadow hover:shadow-sm">
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
              style={{ backgroundColor: avatar.color, color: "#1f2937" }}
              aria-hidden
            >
              {avatar.emoji}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">{displayName}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {tag && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${tag === "WinToday" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-primary/10 text-primary"}`}>
                    #{tag}
                  </span>
                )}
                <span>{timeAgo(post.created_at)}</span>
              </div>
            </div>
          </div>
          {sessionUserId === post.user_id && !isPreview && (
            <div className="flex gap-1">
              <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => handleEditPost(post.id, post.content)} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
              <button className="text-muted-foreground hover:text-destructive p-1" onClick={() => handleDeletePost(post.id)} title="Delete" disabled={deleting[`post_${post.id}`]}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </header>

        {isEditing ? (
          <div className="mt-3">
            <Textarea value={editingContent[`post_${post.id}`] || ""} onChange={(e) => setEditingContent(p => ({ ...p, [`post_${post.id}`]: e.target.value }))} className="mb-2" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSavePostEdit(post.id)}><Save className="h-3 w-3 mr-1" />Save</Button>
              <Button size="sm" variant="outline" onClick={() => handleCancelPostEdit(post.id)}><X className="h-3 w-3 mr-1" />Cancel</Button>
            </div>
          </div>
        ) : isSoft && !isRevealed ? (
          <div className="mt-3 rounded-lg border border-dashed bg-muted/40 p-4 text-center">
            <p className="text-sm font-medium text-foreground/80 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              This post discusses difficult feelings
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setRevealed(r => ({ ...r, [post.id]: true }))}>
              <Eye className="h-3 w-3 mr-1" /> Show post
            </Button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{truncated}</p>
            {isLong && (
              <button onClick={() => setReadMore(r => ({ ...r, [post.id]: !showMore }))} className="mt-1 text-xs font-medium text-primary hover:underline">
                {showMore ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {!isPreview && (
          <footer className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <button className={`inline-flex items-center gap-1.5 transition-colors ${likedByMe ? "text-rose-500" : "hover:text-foreground"}`} onClick={() => toggleLike(post)} aria-pressed={likedByMe} aria-label="React with heart">
              <Heart className={`h-4 w-4 ${likedByMe ? "fill-current" : ""}`} />
              {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
            </button>
            <button className="inline-flex items-center gap-1.5 hover:text-foreground" onClick={() => setExpanded(s => ({ ...s, [post.id]: !s[post.id] }))} aria-expanded={isOpen}>
              <MessageCircle className="h-4 w-4" />
              <span>Reply{comments.length > 0 ? ` · ${comments.length}` : ""}</span>
            </button>
            {sessionUserId && sessionUserId !== post.user_id && (
              <button className="ml-auto inline-flex items-center gap-1 hover:text-orange-600" onClick={() => openReportDialog("post", post.id, undefined, post.user_id, content)} title="Report">
                <Flag className="h-3.5 w-3.5" />
              </button>
            )}
          </footer>
        )}

        {isOpen && !isPreview && (
          <div className="mt-4 rounded-lg border bg-background p-3">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet. Be the first to respond with kindness.</p>
            ) : (
              <ul className="space-y-3">
                {comments.map((c) => (
                  <li key={c.id} className="rounded bg-card p-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        {editing[`comment_${c.id}`] ? (
                          <div className="space-y-2">
                            <Textarea value={editingContent[`comment_${c.id}`] || ""} onChange={(e) => setEditingContent(p => ({ ...p, [`comment_${c.id}`]: e.target.value }))} className="text-sm" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveCommentEdit(c.id)}><Save className="h-3 w-3 mr-1" />Save</Button>
                              <Button size="sm" variant="outline" onClick={() => handleCancelCommentEdit(c.id)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm">{c.content}</p>
                            <div className="mt-1 text-xs text-muted-foreground">{nameMap[c.user_id] || "Anonymous"} · {timeAgo(c.created_at)}</div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {sessionUserId === c.user_id && (
                          <>
                            <button className="text-muted-foreground hover:text-foreground p-1" onClick={() => handleEditComment(c.id, c.content)}><Pencil className="h-3 w-3" /></button>
                            <button className="text-muted-foreground hover:text-destructive p-1" onClick={() => handleDeleteComment(c.id)}><Trash2 className="h-3 w-3" /></button>
                          </>
                        )}
                        {sessionUserId && sessionUserId !== c.user_id && (
                          <button className="text-muted-foreground hover:text-orange-600 p-1" onClick={() => openReportDialog("comment", post.id, c.id, c.user_id, c.content)}><Flag className="h-3 w-3" /></button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Textarea placeholder="Write a kind reply..." value={commentInputs[post.id] || ""} onChange={(e) => setCommentInputs(s => ({ ...s, [post.id]: e.target.value }))} />
              <div className="mt-2 flex justify-end">
                <Button variant="secondary" onClick={() => handleAddComment(post.id)} disabled={commenting[post.id] || !(commentInputs[post.id] || "").trim() || isChecking}>
                  {commenting[post.id] || isChecking ? "Sending…" : "Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <>
      <Helmet>
        <title>Feed — Talk</title>
        <meta name="description" content="Share anonymously and support others in the Talk community feed." />
        <link rel="canonical" href="/feed" />
      </Helmet>

      <section className="surface-card p-4 sm:p-6">
        {/* Daily quote banner */}
        {(() => {
          const dq = getDailyLibraryQuote();
          return (
            <Link
              to="/quotes"
              className="block rounded-xl border bg-gradient-to-br from-violet-100/80 via-pink-100/70 to-amber-100/70 dark:from-violet-950/40 dark:via-pink-950/30 dark:to-amber-950/30 p-4 mb-4 hover:shadow-sm transition-shadow animate-fade-in"
            >
              <p className="text-[11px] uppercase tracking-wide font-semibold text-primary mb-1">
                ✨ Quote of the day
              </p>
              <blockquote className="text-sm sm:text-base leading-relaxed text-foreground/90">
                "{dq.text}"
              </blockquote>
              <cite className="block mt-1 text-xs text-muted-foreground not-italic">— {dq.author}</cite>
            </Link>
          );
        })()}

        {/* Guidelines banner */}
        <div className="flex items-center gap-3 rounded-lg border bg-primary/5 px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="flex-1 text-foreground/80">
            This is a safe space — be kind, be honest, be supportive.{" "}
            <button onClick={() => setGuidelinesOpen(true)} className="font-medium text-primary hover:underline">Read guidelines</button>
          </p>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-bold">Community Feed</h1>
        <p className="mt-1 text-muted-foreground text-sm">A place to share what's on your mind — anonymously by default.</p>


        {/* Composer */}
        <div className="mt-5 rounded-xl border bg-background p-3 sm:p-4">
          {!sessionUserId && (
            <p className="text-sm text-muted-foreground mb-2">Sign in to share a post. You can still read the feed.</p>
          )}
          <Textarea
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="text-base"
            rows={3}
          />

          {/* Tag selector */}
          <div className="mt-3">
            <div className="text-xs font-medium text-muted-foreground mb-2">Choose a topic <span className="text-rose-500">*</span></div>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => {
                const active = composeTag === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setComposeTag(t.id)}
                    className={`rounded-full px-3 py-1 text-xs transition-colors border ${active ? (t.positive ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300" : "bg-primary/15 border-primary/40 text-primary") : "border-border hover:bg-muted"}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={postAnon}
                onChange={(e) => setPostAnon(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-muted-foreground">Post anonymously</span>
              {postAnon && <span className="text-xs text-muted-foreground/80">(recommended)</span>}
            </label>
            <Button variant="hero" size="lg" onClick={handleCreatePost} disabled={!canPost || isChecking} className="min-h-[44px]">
              {posting || isChecking ? "Posting..." : "Share"}
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter by topic</h2>
            {selectedTag && (
              <button onClick={() => setSelectedTag(null)} className="text-xs text-primary hover:underline">Clear</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${!selectedTag ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              All
            </button>
            {TAGS.map((t) => {
              const active = selectedTag === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTag(active ? null : t.id)}
                  className={`rounded-full px-3 py-1 text-xs border transition-colors ${active ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts */}
        <div className="mt-5 space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading feed…</p>
          ) : filteredPosts.length === 0 ? (
            posts.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/50 p-6 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 font-medium">You're not alone here.</p>
                <p className="text-sm text-muted-foreground">Be the first to share — your story might help someone else.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-dashed bg-card/50 p-6 text-center">
                  <Sparkles className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-2 font-medium">You're not alone here.</p>
                  <p className="text-sm text-muted-foreground">Here's what the community is talking about today.</p>
                </div>
                {posts.slice(0, 3).map((p) => renderPost(p, true))}
              </>
            )
          ) : (
            filteredPosts.map((p) => renderPost(p))
          )}
        </div>
      </section>

      <ReportDialog
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog((p) => ({ ...p, open }))}
        postId={reportDialog.postId}
        commentId={reportDialog.commentId}
        reportedUserId={reportDialog.reportedUserId}
        reportedContent={reportDialog.reportedContent}
        contentType={reportDialog.contentType}
      />

      <CommunityGuidelinesModal open={guidelinesOpen} onAccept={acceptGuidelines} onCancel={cancelGuidelines} />
    </>
  );
};

export default Feed;
