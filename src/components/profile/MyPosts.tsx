import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

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

export default function MyPosts({ userId }: { userId: string | null }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [reply, setReply] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, user_id, created_at, likes(id, user_id), comments(id, content, user_id, created_at)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Couldn’t load your posts", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const items = (data as unknown as PostRow[]) || [];
    setPosts(items);

    // Build name map for commenters
    const ids = new Set<string>();
    items.forEach((p) => p.comments?.forEach((c) => ids.add(c.user_id)));
    if (ids.size) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", Array.from(ids));
      const map: Record<string, string> = {};
      (profiles as any[] | null)?.forEach((pr) => { if (pr.display_name) map[pr.user_id] = pr.display_name; });
      setNameMap(map);
    }
    setLoading(false);
  };

  const addReply = async (postId: string) => {
    const text = (reply[postId] || "").trim();
    if (!text) return;
    setSending((s) => ({ ...s, [postId]: true }));
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) {
      toast({ title: "Sign in to reply" });
      setSending((s) => ({ ...s, [postId]: false }));
      return;
    }
    const { error } = await supabase.from("comments").insert({ post_id: postId, content: text, user_id: uid });
    if (error) {
      toast({ title: "Couldn’t add reply", description: error.message, variant: "destructive" });
    } else {
      setReply((r) => ({ ...r, [postId]: "" }));
      await load();
    }
    setSending((s) => ({ ...s, [postId]: false }));
  };

  if (!userId) return <p className="text-muted-foreground">Sign in to view your posts.</p>;

  if (loading) return <p className="text-muted-foreground">Loading your posts…</p>;

  if (posts.length === 0) return (
    <div className="text-muted-foreground">You haven’t posted yet. Your posts will show here.</div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={load} aria-label="Refresh posts">Refresh</Button>
      </div>
      {posts.map((post) => {
        const likeCount = post.likes?.length ?? 0;
        const comments = post.comments || [];
        const open = !!expanded[post.id];
        return (
          <article key={post.id} className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">You</h3>
            <p className="mt-2 whitespace-pre-wrap text-foreground/90">{post.content}</p>
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-4">
              <span>♥ {likeCount}</span>
              <button
                className="hover:text-foreground"
                onClick={() => setExpanded((s) => ({ ...s, [post.id]: !s[post.id] }))}
                aria-expanded={open}
              >
                💬 {comments.length} comments
              </button>
            </div>

            {open && (
              <div className="mt-3 rounded-md border bg-background p-3">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground">No comments yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <li key={c.id} className="rounded bg-card p-2">
                        <p className="text-sm">{c.content}</p>
                        <div className="mt-1 text-xs text-muted-foreground">{nameMap[c.user_id] || "Anonymous"} • {new Date(c.created_at).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3">
                  <Textarea
                    placeholder="Reply with support…"
                    value={reply[post.id] || ""}
                    onChange={(e) => setReply((r) => ({ ...r, [post.id]: e.target.value }))}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => addReply(post.id)}
                      disabled={sending[post.id] || !(reply[post.id] || "").trim()}
                    >
                      {sending[post.id] ? "Sending…" : "Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
