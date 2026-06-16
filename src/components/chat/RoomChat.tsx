import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft, Send, Users, Shield, MoreVertical, Crown, Flag, ChevronDown,
  Pin, Megaphone, AlertTriangle, X, Check, BookOpen, Trash2, AlertCircle, UserMinus, Ban,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { containsCrisisLanguage, detectCrisisLine } from "@/lib/crisisDetection";
import { Link } from "react-router-dom";

interface Props { roomId: string; onLeave: () => void; }

interface Room {
  id: string;
  name: string;
  description: string;
  rules: string;
  topic_tag: string;
  age_band: string;
  privacy: "open" | "approval";
  pinned_announcement: string | null;
  created_by: string | null;
  is_archived: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  role: "admin" | "co_admin" | "member";
  joined_at: string;
  agreed_to_guidelines: boolean;
  profile?: { display_name?: string; full_name?: string; email?: string; avatar_url?: string; mood?: string };
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_hidden: boolean;
  hidden_reason: string | null;
  profile?: { display_name?: string; full_name?: string; email?: string; avatar_url?: string };
}

interface JoinRequest {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  profile?: { display_name?: string; full_name?: string; mood?: string };
}

interface Report {
  id: string;
  message_id: string;
  reported_by: string;
  reason: string;
  status: string;
  created_at: string;
}

const REPORT_REASONS = [
  { value: "harmful", label: "Harmful content" },
  { value: "bullying", label: "Bullying or harassment" },
  { value: "crisis", label: "Crisis concern" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

const displayName = (p?: { display_name?: string; full_name?: string; email?: string }) => {
  if (!p) return "Anonymous";
  return p.display_name || p.full_name || p.email?.split("@")[0] || "Anonymous";
};

const RoomChat = ({ roomId, onLeave }: Props) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [room, setRoom] = useState<Room | null>(null);
  const [me, setMe] = useState<{ id: string } | null>(null);
  const [myParticipant, setMyParticipant] = useState<Participant | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [crisisInRoom, setCrisisInRoom] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [reportTarget, setReportTarget] = useState<Message | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [memberAction, setMemberAction] = useState<{ p: Participant; type: "remove" | "ban" } | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const crisisLine = useMemo(() => detectCrisisLine(), []);
  const isAdmin = !!myParticipant && (myParticipant.role === "admin" || myParticipant.role === "co_admin");
  const isOwner = !!me && room?.created_by === me.id;

  // ---- Loaders ----
  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMe({ id: user.id });

    const { data: r } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
    if (r) setRoom(r as any);

    await Promise.all([loadMessages(), loadParticipants(user.id), loadRequests(), loadReports()]);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("room_messages").select("*").eq("room_id", roomId)
      .order("created_at", { ascending: true }).limit(200);
    const withProfiles = await Promise.all(
      (data || []).map(async (m: any) => {
        const { data: p } = await supabase.from("profiles")
          .select("display_name, full_name, email, avatar_url").eq("user_id", m.user_id).maybeSingle();
        return { ...m, profile: p } as Message;
      })
    );
    setMessages(withProfiles);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadParticipants = async (userId?: string) => {
    const { data } = await supabase.from("room_participants").select("*").eq("room_id", roomId);
    const withProfiles = await Promise.all(
      (data || []).map(async (pp: any) => {
        const { data: p } = await supabase.from("profiles")
          .select("display_name, full_name, email, avatar_url, mood").eq("user_id", pp.user_id).maybeSingle();
        return { ...pp, profile: p } as Participant;
      })
    );
    setParticipants(withProfiles);
    const uid = userId || me?.id;
    if (uid) {
      const mine = withProfiles.find((p) => p.user_id === uid) || null;
      setMyParticipant(mine);
    }
  };

  const loadRequests = async () => {
    const { data } = await supabase.from("room_join_requests")
      .select("*").eq("room_id", roomId).eq("status", "pending").order("created_at");
    const withProfiles = await Promise.all(
      (data || []).map(async (r: any) => {
        const { data: p } = await supabase.from("profiles")
          .select("display_name, full_name, mood").eq("user_id", r.user_id).maybeSingle();
        return { ...r, profile: p } as JoinRequest;
      })
    );
    setJoinRequests(withProfiles);
  };

  const loadReports = async () => {
    const { data } = await supabase.from("room_message_reports")
      .select("*").eq("room_id", roomId).eq("status", "pending").order("created_at", { ascending: false });
    setReports((data || []) as any);
  };

  // ---- Effects ----
  useEffect(() => {
    loadAll();

    const ch = supabase
      .channel(`room_${roomId}_${Math.random().toString(36).slice(2, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        () => loadMessages())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` },
        () => loadParticipants())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_join_requests", filter: `room_id=eq.${roomId}` },
        () => loadRequests())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_message_reports", filter: `room_id=eq.${roomId}` },
        () => loadReports())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ---- Actions ----
  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !me || sending) return;
    if (myParticipant && !myParticipant.agreed_to_guidelines) {
      setShowGuidelines(true);
      return;
    }
    setSending(true);
    try {
      const crisis = containsCrisisLanguage(text);
      if (crisis) setCrisisInRoom(true);

      const { error } = await supabase.from("room_messages").insert({
        room_id: roomId, user_id: me.id, content: text,
        is_hidden: crisis,
        hidden_reason: crisis ? "auto_crisis_review" : null,
      } as any);
      if (error) throw error;

      if (crisis) {
        toast({
          title: "Held for review",
          description: "Your message has been held for review as it may contain sensitive content. A room admin will review it shortly.",
        });
      }
      setNewMessage("");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to send", variant: "destructive" });
    } finally { setSending(false); }
  };

  const acceptGuidelines = async () => {
    if (!myParticipant) return;
    const { error } = await supabase.from("room_participants")
      .update({ agreed_to_guidelines: true, agreed_at: new Date().toISOString() } as any)
      .eq("id", myParticipant.id);
    if (!error) {
      setShowGuidelines(false);
      loadParticipants();
    }
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason || !me) return;
    const { error } = await supabase.from("room_message_reports").insert({
      room_id: roomId,
      message_id: reportTarget.id,
      reported_by: me.id,
      reason: reportReason,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (reportReason === "crisis") setCrisisInRoom(true);
    toast({ title: "Report submitted", description: "Thanks for helping keep this room safe." });
    setReportTarget(null);
    setReportReason("");
  };

  const removeMember = async (p: Participant, ban = false) => {
    if (!isAdmin) return;
    if (ban) {
      await supabase.from("room_bans").insert({
        room_id: roomId, user_id: p.user_id, banned_by: me?.id,
      } as any);
    }
    await supabase.from("room_participants").delete().eq("id", p.id);
    toast({ title: ban ? "Member banned" : "Member removed" });
    setMemberAction(null);
  };

  const promoteToCoAdmin = async (p: Participant) => {
    await supabase.from("room_participants").update({ role: "co_admin" } as any).eq("id", p.id);
    toast({ title: "Promoted to co-admin" });
  };

  const decideRequest = async (req: JoinRequest, accept: boolean) => {
    await supabase.from("room_join_requests").update({
      status: accept ? "accepted" : "declined",
      decided_by: me?.id, decided_at: new Date().toISOString(),
    } as any).eq("id", req.id);
    if (accept) {
      await supabase.from("room_participants").insert({
        room_id: roomId, user_id: req.user_id, role: "member",
      } as any);
    }
    toast({ title: accept ? "Request accepted" : "Request declined" });
  };

  const resolveReport = async (reportId: string, hideMessage: boolean, messageId: string) => {
    await supabase.from("room_message_reports").update({ status: "reviewed" } as any).eq("id", reportId);
    if (hideMessage) {
      await supabase.from("room_messages").update({ is_hidden: true, hidden_reason: "admin_review" } as any).eq("id", messageId);
    }
    toast({ title: "Report resolved" });
  };

  const restoreMessage = async (messageId: string) => {
    await supabase.from("room_messages").update({ is_hidden: false, hidden_reason: null } as any).eq("id", messageId);
    toast({ title: "Message restored" });
  };

  const savePinned = async (text: string) => {
    await supabase.from("rooms").update({ pinned_announcement: text || null } as any).eq("id", roomId);
    setRoom((r) => r ? { ...r, pinned_announcement: text || null } : r);
    toast({ title: "Announcement updated" });
  };

  const warnMember = async (userId: string) => {
    const target = participants.find((p) => p.user_id === userId);
    const name = displayName(target?.profile);
    await supabase.from("room_messages").insert({
      room_id: roomId, user_id: me!.id,
      content: `⚠️ Warning to ${name} from a room admin — please review the room rules. Repeated issues may lead to removal or a ban.`,
    } as any);
    toast({ title: "Warning posted", description: `${name} has been warned in the room.` });
  };

  const removeMessage = async (messageId: string) => {
    await supabase.from("room_messages").delete().eq("id", messageId);
    toast({ title: "Message removed" });
    loadMessages();
  };

  const archiveRoom = async () => {
    await supabase.from("rooms").update({ is_archived: true } as any).eq("id", roomId);
    toast({ title: "Room archived" });
    onLeave();
  };

  const saveRoomEdits = async (patch: Partial<Room>) => {
    await supabase.from("rooms").update(patch as any).eq("id", roomId);
    setRoom((r) => r ? { ...r, ...patch } as Room : r);
    toast({ title: "Room updated" });
  };

  const leaveRoom = async () => {
    if (myParticipant) {
      await supabase.from("room_participants").delete().eq("id", myParticipant.id);
    }
    onLeave();
  };

  // ---- Render helpers ----
  const visibleMessages = messages.filter((m) => !m.is_hidden || m.user_id === me?.id || isAdmin);

  if (!room) {
    return <div className="p-6 text-center text-muted-foreground">Loading room…</div>;
  }

  return (
    <div className="flex flex-col fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" onClick={leaveRoom}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold truncate">#{room.name}</h2>
              {isAdmin && <Crown className="h-4 w-4 text-amber-500" aria-label="You are an admin" />}
            </div>
            <p className="text-sm text-muted-foreground truncate">{room.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Users className="h-4 w-4" /> <span className="text-xs">{participants.length}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader><SheetTitle>Members</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-2 overflow-y-auto max-h-[80vh]">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm font-medium truncate">
                        {p.role === "admin" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        {p.role === "co_admin" && <Shield className="h-3.5 w-3.5 text-primary" />}
                        <span className="truncate">{displayName(p.profile)}</span>
                      </div>
                      {p.profile?.mood && <div className="text-xs text-muted-foreground">{p.profile.mood}</div>}
                      <div className="text-[10px] text-muted-foreground capitalize">{p.role.replace("_", "-")}</div>
                    </div>
                    {isAdmin && p.user_id !== me?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {p.role === "member" && (
                            <DropdownMenuItem onClick={() => promoteToCoAdmin(p)}>
                              Promote to co-admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setMemberAction({ p, type: "remove" })}>
                            Remove from room
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setMemberAction({ p, type: "ban" })}
                          >
                            Ban permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {isAdmin && (
            <Button variant="ghost" size="sm" onClick={() => setShowAdminPanel(true)} aria-label="Admin panel">
              🛡️
              {(joinRequests.length + reports.length) > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {joinRequests.length + reports.length}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Pinned announcement */}
      {room.pinned_announcement && (
        <div className="px-4 py-2 bg-primary/10 border-b flex items-start gap-2 text-sm">
          <Pin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div className="whitespace-pre-wrap">{room.pinned_announcement}</div>
        </div>
      )}

      {/* Crisis banner */}
      {crisisInRoom && (
        <div className="px-4 py-3 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-rose-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-rose-900 dark:text-rose-200">If you or someone here is in crisis, please reach out now.</p>
              <a href={`tel:${crisisLine.tel}`} className="inline-flex items-center font-semibold text-rose-700 dark:text-rose-300 underline">
                📞 {crisisLine.region}: {crisisLine.number} — {crisisLine.label}
              </a>
              <div><Link to="/help" className="text-xs underline text-rose-700 dark:text-rose-300">Open Get Help →</Link></div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setCrisisInRoom(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.map((m) => {
          const mine = m.user_id === me?.id;
          const author = participants.find((p) => p.user_id === m.user_id);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="flex items-start gap-1 max-w-[85%]">
                <div className={`rounded-lg p-3 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"} ${m.is_hidden ? "opacity-60 italic" : ""}`}>
                  {!mine && (
                    <div className="text-xs font-medium mb-1 flex items-center gap-1">
                      {author?.role === "admin" && <Crown className="h-3 w-3 text-amber-500" />}
                      {author?.role === "co_admin" && <Shield className="h-3 w-3" />}
                      {displayName(m.profile)}
                    </div>
                  )}
                  {m.is_hidden && (
                    <div className="text-[10px] uppercase tracking-wide mb-1 opacity-70">Held for review</div>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                  <div className="text-xs mt-1 opacity-70">{format(new Date(m.created_at), "HH:mm")}</div>
                </div>
                {!mine && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => setReportTarget(m)}>
                        <Flag className="h-3.5 w-3.5 mr-2" /> Report message
                      </DropdownMenuItem>
                      {isAdmin && m.is_hidden && (
                        <DropdownMenuItem onClick={() => restoreMessage(m.id)}>Restore message</DropdownMenuItem>
                      )}
                      {isAdmin && !m.is_hidden && (
                        <DropdownMenuItem onClick={() => supabase.from("room_messages").update({ is_hidden: true, hidden_reason: "admin_hide" } as any).eq("id", m.id).then(() => loadMessages())}>
                          Hide message
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t bg-background shrink-0 ${isMobile ? "pb-20" : "pb-4"}`}>
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={myParticipant?.agreed_to_guidelines ? "Type your message…" : "Tap send to agree to the room guidelines first"}
            className="min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Guidelines Modal */}
      <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>#{room.name} — Community guidelines</DialogTitle>
            <DialogDescription>One-time agreement before your first message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-md bg-muted">
              <div className="font-medium mb-1">General</div>
              <p className="text-muted-foreground">Be kind. No bullying, harassment, or harmful advice. No personal contact info. Crisis situations: please use Get Help and call the local helpline.</p>
            </div>
            {room.rules && (
              <div className="p-3 rounded-md bg-primary/10">
                <div className="font-medium mb-1">Room rules from the admin</div>
                <p className="whitespace-pre-wrap">{room.rules}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGuidelines(false)}>Cancel</Button>
            <Button onClick={acceptGuidelines}>I agree to the community guidelines</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(o) => { if (!o) { setReportTarget(null); setReportReason(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report message</DialogTitle>
            <DialogDescription>This will be sent to the room admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-muted text-sm">{reportTarget?.content}</div>
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button onClick={submitReport} disabled={!reportReason} variant="destructive">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member action confirmation */}
      <AlertDialog open={!!memberAction} onOpenChange={(o) => { if (!o) setMemberAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberAction?.type === "ban" ? "Ban this member permanently?" : "Remove this member from the room?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberAction?.type === "ban"
                ? "They won't be able to rejoin this room."
                : "They can request to join again later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={memberAction?.type === "ban" ? "bg-destructive hover:bg-destructive/90" : ""}
              onClick={() => memberAction && removeMember(memberAction.p, memberAction.type === "ban")}
            >
              {memberAction?.type === "ban" ? "Ban" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Panel Sheet */}
      <Sheet open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle className="flex items-center gap-2">🛡️ Admin panel — #{room.name}</SheetTitle></SheetHeader>
          <Tabs defaultValue="requests" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="requests">
                Requests {joinRequests.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{joinRequests.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="reports">
                Reports {reports.length > 0 && <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">{reports.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-2 mt-4">
              {joinRequests.length === 0 && <p className="text-sm text-muted-foreground">No pending requests.</p>}
              {joinRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <div className="font-medium text-sm">{displayName(req.profile)}</div>
                    {req.profile?.mood && <div className="text-xs text-muted-foreground">Vibe: {req.profile.mood}</div>}
                    <div className="text-[10px] text-muted-foreground">{format(new Date(req.created_at), "PPp")}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => decideRequest(req, true)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => decideRequest(req, false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="reports" className="space-y-2 mt-4">
              {reports.length === 0 && <p className="text-sm text-muted-foreground">No pending reports.</p>}
              {reports.map((rep) => {
                const msg = messages.find((m) => m.id === rep.message_id);
                return (
                  <div key={rep.id} className="p-3 rounded-md border space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs capitalize">{rep.reason}</Badge>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(rep.created_at), "PPp")}</span>
                    </div>
                    <div className="text-sm p-2 bg-muted rounded">{msg?.content || "(message deleted)"}</div>
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="outline" onClick={() => resolveReport(rep.id, false, rep.message_id)}>Dismiss</Button>
                      <Button size="sm" variant="destructive" onClick={() => resolveReport(rep.id, true, rep.message_id)}>Hide message</Button>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="members" className="space-y-2 mt-4">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 font-medium">
                      {p.role === "admin" && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      {p.role === "co_admin" && <Shield className="h-3.5 w-3.5" />}
                      {displayName(p.profile)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Joined {format(new Date(p.joined_at), "PP")} · {p.role.replace("_", "-")}
                    </div>
                  </div>
                  {p.user_id !== me?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {p.role === "member" && (
                          <DropdownMenuItem onClick={() => promoteToCoAdmin(p)}>Promote to co-admin</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setMemberAction({ p, type: "remove" })}>Remove</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setMemberAction({ p, type: "ban" })}>Ban</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <AdminSettingsForm
                room={room}
                onSave={saveRoomEdits}
                onSaveAnnouncement={savePinned}
                onArchive={archiveRoom}
                isOwner={isOwner}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const AdminSettingsForm = ({
  room, onSave, onSaveAnnouncement, onArchive, isOwner,
}: {
  room: Room;
  onSave: (patch: Partial<Room>) => Promise<void>;
  onSaveAnnouncement: (text: string) => Promise<void>;
  onArchive: () => Promise<void>;
  isOwner: boolean;
}) => {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [rules, setRules] = useState(room.rules);
  const [announcement, setAnnouncement] = useState(room.pinned_announcement || "");

  return (
    <div className="space-y-4">
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
          <Megaphone className="h-4 w-4" /> Pinned announcement <ChevronDown className="h-3.5 w-3.5" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          <Textarea value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3} placeholder="Post a pinned message at the top of the room…" />
          <Button size="sm" onClick={() => onSaveAnnouncement(announcement)}>Save announcement</Button>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2">
        <Label>Room name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={200} />
        <Label>Rules</Label>
        <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} maxLength={500} />
        <Button size="sm" onClick={() => onSave({ name, description, rules })}>Save changes</Button>
      </div>

      {isOwner && (
        <div className="border-t pt-4">
          <Button variant="destructive" size="sm" onClick={onArchive}>
            Close / archive room
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoomChat;
