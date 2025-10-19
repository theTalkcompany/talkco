import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportDialog } from "@/components/feed/ReportDialog";
import { useContentModeration } from "@/hooks/useContentModeration";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useHaptics } from "@/hooks/useHaptics";
import { Pencil, Trash2, Save, X, Flag, RefreshCw } from "lucide-react";

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

const Feed = () => {
  const { toast } = useToast();
  const { moderateContent, isChecking } = useContentModeration();
  const { impact } = useHaptics();
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commenting, setCommenting] = useState<Record<string, boolean>>({});
const [posts, setPosts] = useState<PostRow[]>([]);
const [newPost, setNewPost] = useState("");
const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
const [expanded, setExpanded] = useState<Record<string, boolean>>({});
const [nameMap, setNameMap] = useState<Record<string, string>>({});
const [reportDialog, setReportDialog] = useState<{
  open: boolean;
  postId?: string;
  commentId?: string;
  reportedUserId: string;
  reportedContent: string;
  contentType: "post" | "comment";
}>({
  open: false,
  postId: undefined,
  commentId: undefined,
  reportedUserId: "",
  reportedContent: "",
  contentType: "post",
});
const [editing, setEditing] = useState<{[key: string]: boolean}>({});
const [editingContent, setEditingContent] = useState<{[key: string]: string}>({});
const [deleting, setDeleting] = useState<{[key: string]: boolean}>({});

  const handleRefresh = async () => {
    await impact('light');
    await loadPosts();
    toast({ title: "Feed refreshed" });
  };

  const { containerRef, isRefreshing } = usePullToRefresh(handleRefresh);

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
  // Fetch posts and profiles in parallel for better performance
  const [postsResult, profilesResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, content, user_id, created_at, likes(id, user_id), comments(id, content, user_id, created_at)")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("user_id, display_name")
  ]);

  if (postsResult.error) {
    console.error(postsResult.error);
    toast({ title: "Couldn't load feed", description: postsResult.error.message, variant: "destructive" });
    return;
  }
  
  const postsData = postsResult.data as unknown as PostRow[];
  setPosts(postsData);

  // Build name map from profiles
  if (!profilesResult.error && profilesResult.data) {
    const map: Record<string, string> = {};
    profilesResult.data.forEach((pr: any) => {
      if (pr.display_name) map[pr.user_id] = pr.display_name as string;
    });
    setNameMap(map);
  }
};

  const canPost = useMemo(() => !!sessionUserId && newPost.trim().length > 0 && !posting, [sessionUserId, newPost, posting]);

  const handleCreatePost = async () => {
    if (!sessionUserId) {
      toast({ title: "Sign in required", description: "Please sign in to share a post." });
      return;
    }
    const content = newPost.trim();
    if (!content) return;
    
    await impact('medium');
    setPosting(true);
    
    // Create the post first
    const { data: newPostData, error } = await supabase
      .from("posts")
      .insert({ content, user_id: sessionUserId })
      .select()
      .single();
      
    if (error) {
      toast({ title: "Couldn't post", description: error.message, variant: "destructive" });
      setPosting(false);
      return;
    }
    
    // Then moderate the content
    await moderateContent(content, sessionUserId, 'post', newPostData.id);
    
    setNewPost("");
    toast({ title: "Posted", description: "Your post is now live." });
    await loadPosts();
    setPosting(false);
  };

  const toggleLike = async (post: PostRow) => {
    if (!sessionUserId) {
      toast({ title: "Sign in to like", description: "Sign in to support posts with a like." });
      return;
    }
    await impact('light');
    const liked = post.likes?.some((l) => l.user_id === sessionUserId);
    if (liked) {
      const { error } = await supabase.from("likes").delete().match({ post_id: post.id, user_id: sessionUserId });
      if (error) return toast({ title: "Couldn't unlike", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("likes").insert({ post_id: post.id, user_id: sessionUserId });
      if (error) return toast({ title: "Couldn't like", description: error.message, variant: "destructive" });
    }
    await loadPosts();
  };

  const handleAddComment = async (postId: string) => {
    if (!sessionUserId) {
      toast({ title: "Sign in to comment", description: "Please sign in to join the conversation." });
      return;
    }
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;
    
    setCommenting((s) => ({ ...s, [postId]: true }));
    
    // Create the comment first
    const { data: newCommentData, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, content: text, user_id: sessionUserId })
      .select()
      .single();
      
    if (error) {
      toast({ title: "Couldn't comment", description: error.message, variant: "destructive" });
      setCommenting((s) => ({ ...s, [postId]: false }));
      return;
    }
    
    // Then moderate the content
    await moderateContent(text, sessionUserId, 'comment', newCommentData.id);
    
    setCommentInputs((s) => ({ ...s, [postId]: "" }));
    await loadPosts();
    setCommenting((s) => ({ ...s, [postId]: false }));
  };

  const openReportDialog = (type: "post" | "comment", postId?: string, commentId?: string, reportedUserId?: string, content?: string) => {
    setReportDialog({
      open: true,
      postId,
      commentId,
      reportedUserId: reportedUserId || "",
      reportedContent: content || "",
      contentType: type,
    });
  };

  const handleEditPost = (postId: string, currentContent: string) => {
    setEditing(prev => ({ ...prev, [`post_${postId}`]: true }));
    setEditingContent(prev => ({ ...prev, [`post_${postId}`]: currentContent }));
  };

  const handleSavePostEdit = async (postId: string) => {
    if (!sessionUserId) return;
    
    const newContent = editingContent[`post_${postId}`];
    if (!newContent?.trim()) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", postId)
        .eq("user_id", sessionUserId);

      if (error) throw error;

      // Moderate the edited content
      await moderateContent(newContent.trim(), sessionUserId, 'post', postId);

      setEditing(prev => ({ ...prev, [`post_${postId}`]: false }));
      setEditingContent(prev => ({ ...prev, [`post_${postId}`]: "" }));
      await loadPosts();
      
      toast({ title: "Post updated", description: "Your post has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleCancelPostEdit = (postId: string) => {
    setEditing(prev => ({ ...prev, [`post_${postId}`]: false }));
    setEditingContent(prev => ({ ...prev, [`post_${postId}`]: "" }));
  };

  const handleDeletePost = async (postId: string) => {
    if (!sessionUserId) return;
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

    setDeleting(prev => ({ ...prev, [`post_${postId}`]: true }));

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", sessionUserId);

      if (error) throw error;

      await loadPosts();
      toast({ title: "Post deleted", description: "Your post has been deleted successfully." });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(prev => ({ ...prev, [`post_${postId}`]: false }));
    }
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditing(prev => ({ ...prev, [`comment_${commentId}`]: true }));
    setEditingContent(prev => ({ ...prev, [`comment_${commentId}`]: currentContent }));
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!sessionUserId) return;
    
    const newContent = editingContent[`comment_${commentId}`];
    if (!newContent?.trim()) return;

    try {
      const { error } = await supabase
        .from("comments")
        .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
        .eq("id", commentId)
        .eq("user_id", sessionUserId);

      if (error) throw error;

      // Moderate the edited content
      await moderateContent(newContent.trim(), sessionUserId, 'comment', commentId);

      setEditing(prev => ({ ...prev, [`comment_${commentId}`]: false }));
      setEditingContent(prev => ({ ...prev, [`comment_${commentId}`]: "" }));
      await loadPosts();
      
      toast({ title: "Comment updated", description: "Your comment has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const handleCancelCommentEdit = (commentId: string) => {
    setEditing(prev => ({ ...prev, [`comment_${commentId}`]: false }));
    setEditingContent(prev => ({ ...prev, [`comment_${commentId}`]: "" }));
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!sessionUserId) return;
    if (!confirm("Are you sure you want to delete this comment? This action cannot be undone.")) return;

    setDeleting(prev => ({ ...prev, [`comment_${commentId}`]: true }));

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", sessionUserId);

      if (error) throw error;

      await loadPosts();
      toast({ title: "Comment deleted", description: "Your comment has been deleted successfully." });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(prev => ({ ...prev, [`comment_${commentId}`]: false }));
    }
  };

  return (
    <>
      <Helmet>
        <title>Feed — Talk</title>
        <meta name="description" content="Share anonymously and support others in the Talk community feed." />
        <link rel="canonical" href="/feed" />
      </Helmet>

      <div ref={containerRef}>
        <section className="surface-card p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">Community Feed</h1>
              <p className="mt-2 text-muted-foreground">Post your thoughts anonymously and receive supportive comments.</p>
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {isRefreshing && (
            <div className="text-center text-sm text-muted-foreground mb-4">
              Refreshing...
            </div>
          )}

        {/* Composer */}
        <div className="mt-6 rounded-lg border bg-background p-4">
          {!sessionUserId ? (
            <p className="text-muted-foreground">Please sign in to post and comment. You can still read the feed.</p>
          ) : null}
          <Textarea
            placeholder="Share what's on your mind..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="mt-2"
          />
          <div className="mt-3 flex justify-end">
            <Button variant="hero" onClick={handleCreatePost} disabled={!canPost || isChecking} aria-label="Publish post">
              {posting || isChecking ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>

        {/* Posts List */}
        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading feed…</p>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground">No posts yet. Be the first to share something supportive.</p>
          ) : (
            posts.map((post) => {
              const likeCount = post.likes?.length ?? 0;
              const likedByMe = !!sessionUserId && post.likes?.some((l) => l.user_id === sessionUserId);
              const isOpen = !!expanded[post.id];
              const comments = post.comments || [];
              return (
                <article key={post.id} className="rounded-lg border bg-card p-4 hover-tilt">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-semibold">{nameMap[post.user_id] || "Anonymous"}</h2>
                    {sessionUserId === post.user_id && (
                      <div className="flex gap-1">
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          onClick={() => handleEditPost(post.id, post.content)}
                          title="Edit post"
                          disabled={editing[`post_${post.id}`]}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete post"
                          disabled={deleting[`post_${post.id}`]}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editing[`post_${post.id}`] ? (
                    <div className="mt-2">
                      <Textarea
                        value={editingContent[`post_${post.id}`] || ""}
                        onChange={(e) => setEditingContent(prev => ({ ...prev, [`post_${post.id}`]: e.target.value }))}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSavePostEdit(post.id)}
                          disabled={!editingContent[`post_${post.id}`]?.trim()}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelPostEdit(post.id)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-foreground/90 whitespace-pre-wrap">{post.content}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                    <button
                      className={`inline-flex items-center gap-1 transition-colors ${likedByMe ? "text-primary" : "hover:text-foreground"}`}
                      onClick={() => toggleLike(post)}
                      aria-pressed={likedByMe}
                    >
                      <span>♥</span>
                      <span>{likeCount}</span>
                      <span className="sr-only">likes</span>
                    </button>
                    <button
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => setExpanded((s) => ({ ...s, [post.id]: !s[post.id] }))}
                      aria-expanded={isOpen}
                    >
                      💬 <span>{comments.length}</span>
                      <span className="sr-only">comments</span>
                    </button>
                    {sessionUserId && sessionUserId !== post.user_id && (
                      <button
                        className="inline-flex items-center gap-1 hover:text-orange-600 transition-colors"
                        onClick={() => openReportDialog("post", post.id, undefined, post.user_id, post.content)}
                        title="Report this post"
                      >
                        <Flag className="h-3 w-3" />
                        <span className="sr-only">Report</span>
                      </button>
                    )}
                  </div>

                  {/* Comments */}
                  {isOpen && (
                    <div className="mt-4 rounded-md border bg-background p-3">
                      {comments.length === 0 ? (
                        <p className="text-muted-foreground">No comments yet. Be the first to respond with support.</p>
                      ) : (
                        <ul className="space-y-3">
                           {comments.map((c) => (
                            <li key={c.id} className="rounded bg-card p-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  {editing[`comment_${c.id}`] ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editingContent[`comment_${c.id}`] || ""}
                                        onChange={(e) => setEditingContent(prev => ({ ...prev, [`comment_${c.id}`]: e.target.value }))}
                                        className="text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveCommentEdit(c.id)}
                                          disabled={!editingContent[`comment_${c.id}`]?.trim()}
                                        >
                                          <Save className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCancelCommentEdit(c.id)}
                                        >
                                          <X className="h-3 w-3 mr-1" />
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm">{c.content}</p>
                                      <div className="mt-1 text-xs text-muted-foreground">{nameMap[c.user_id] || "Anonymous"} • {new Date(c.created_at).toLocaleString()}</div>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  {sessionUserId === c.user_id && (
                                    <>
                                      <button
                                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                        onClick={() => handleEditComment(c.id, c.content)}
                                        title="Edit comment"
                                        disabled={editing[`comment_${c.id}`]}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </button>
                                      <button
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                        onClick={() => handleDeleteComment(c.id)}
                                        title="Delete comment"
                                        disabled={deleting[`comment_${c.id}`]}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                  {sessionUserId && sessionUserId !== c.user_id && (
                                    <button
                                      className="text-muted-foreground hover:text-orange-600 transition-colors p-1"
                                      onClick={() => openReportDialog("comment", post.id, c.id, c.user_id, c.content)}
                                      title="Report this comment"
                                    >
                                      <Flag className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3">
                        <Textarea
                          placeholder="Write a supportive reply..."
                          value={commentInputs[post.id] || ""}
                          onChange={(e) => setCommentInputs((s) => ({ ...s, [post.id]: e.target.value }))}
                        />
                        <div className="mt-2 flex justify-end">
                          <Button
                            variant="secondary"
                            onClick={() => handleAddComment(post.id)}
                            disabled={commenting[post.id] || !(commentInputs[post.id] || "").trim() || isChecking}
                            aria-label="Add comment"
                          >
                            {commenting[post.id] || isChecking ? "Sending…" : "Reply"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
      </div>

      <ReportDialog
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog((prev) => ({ ...prev, open }))}
        postId={reportDialog.postId}
        commentId={reportDialog.commentId}
        reportedUserId={reportDialog.reportedUserId}
        reportedContent={reportDialog.reportedContent}
        contentType={reportDialog.contentType}
      />
    </>
  );
};

export default Feed;