import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Lock, Globe, Archive, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TOPIC_TAGS } from "@/lib/crisisDetection";
import RoomChat from "./RoomChat";

interface Room {
  id: string;
  name: string;
  description: string;
  created_by?: string | null;
  age_min: number;
  age_max: number;
  age_band: "teen" | "adult" | "all";
  topic_tag: string;
  rules: string;
  privacy: "open" | "approval";
  is_archived: boolean;
  last_activity_at: string;
  participant_count?: number;
  recent_count?: number;
  reports_24h?: number;
  pending_request?: boolean;
}

const AGE_BAND_LABEL: Record<Room["age_band"], string> = {
  teen: "13–17",
  adult: "18+",
  all: "All ages",
};

const safetyFromReports = (n: number) => {
  if (n >= 3) return { color: "bg-red-500", label: "Recent reports" };
  if (n >= 1) return { color: "bg-amber-500", label: "Some reports" };
  return { color: "bg-emerald-500", label: "Safe" };
};

const formatRelative = (iso: string): string => {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const CommunityRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joinTarget, setJoinTarget] = useState<Room | null>(null);
  const [joinAgreed, setJoinAgreed] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Create-room form
  const [form, setForm] = useState({
    name: "",
    description: "",
    topic_tag: "general",
    age_band: "all" as Room["age_band"],
    rules: "",
    privacy: "open" as Room["privacy"],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data: roomsData, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_archived", false)
        .order("last_activity_at", { ascending: false });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const since10m = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const enriched: Room[] = await Promise.all(
        (roomsData || []).map(async (r: any) => {
          const [{ count: pc }, { count: rc }, { count: reports }, pending] = await Promise.all([
            supabase.from("room_participants").select("*", { count: "exact", head: true }).eq("room_id", r.id),
            supabase.from("room_messages").select("*", { count: "exact", head: true }).eq("room_id", r.id).gte("created_at", since10m),
            supabase.from("room_message_reports").select("*", { count: "exact", head: true }).eq("room_id", r.id).gte("created_at", since24h),
            user
              ? supabase.from("room_join_requests").select("status").eq("room_id", r.id).eq("user_id", user.id).eq("status", "pending").maybeSingle()
              : Promise.resolve({ data: null }),
          ]);
          return {
            ...r,
            participant_count: pc || 0,
            recent_count: rc || 0,
            reports_24h: reports || 0,
            pending_request: !!(pending as any)?.data,
          };
        })
      );
      setRooms(enriched);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load rooms", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const ageRange = form.age_band === "teen"
        ? { age_min: 13, age_max: 17 }
        : form.age_band === "adult"
        ? { age_min: 18, age_max: 99 }
        : { age_min: 13, age_max: 99 };

      const { error } = await supabase.from("rooms").insert({
        name: form.name.trim(),
        description: form.description.trim(),
        created_by: user.id,
        topic_tag: form.topic_tag,
        age_band: form.age_band,
        rules: form.rules.trim(),
        privacy: form.privacy,
        ...ageRange,
      } as any);
      if (error) throw error;

      toast({ title: "Room created", description: "You're the room admin 👑" });
      setShowCreate(false);
      setForm({ name: "", description: "", topic_tag: "general", age_band: "all", rules: "", privacy: "open" });
      fetchRooms();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to create room", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (room: Room) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    // Check ban
    const { data: ban } = await supabase
      .from("room_bans").select("id").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
    if (ban) {
      toast({ title: "Access denied", description: "You're banned from this room.", variant: "destructive" });
      return;
    }

    // Check existing membership
    const { data: existing } = await supabase
      .from("room_participants").select("id").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();

    if (existing) {
      setSelectedRoom(room);
      return;
    }

    if (room.privacy === "open") {
      const { error } = await supabase.from("room_participants").insert({
        room_id: room.id, user_id: user.id, role: "member",
      } as any);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setSelectedRoom(room);
    } else {
      // Approval required — send a request
      const { error } = await supabase.from("room_join_requests").insert({
        room_id: room.id, user_id: user.id, status: "pending",
      } as any);
      if (error && !error.message.includes("duplicate")) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Request sent", description: "The room admin will review your request." });
      fetchRooms();
    }
  };

  if (selectedRoom) {
    return <RoomChat roomId={selectedRoom.id} onLeave={() => { setSelectedRoom(null); fetchRooms(); }} />;
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading rooms…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Community Rooms</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Plus className="h-4 w-4 mr-2" />Create Room</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a Room</DialogTitle>
              <DialogDescription>You'll become the room admin and set the rules.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Room name</Label>
                <Input value={form.name} maxLength={50} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. quiet-evenings" />
              </div>
              <div>
                <Label>Short description</Label>
                <Textarea value={form.description} maxLength={200} rows={2} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Topic</Label>
                  <Select value={form.topic_tag} onValueChange={(v) => setForm({ ...form, topic_tag: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TOPIC_TAGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Age range</Label>
                  <Select value={form.age_band} onValueChange={(v: any) => setForm({ ...form, age_band: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teen">13–17</SelectItem>
                      <SelectItem value="adult">18+</SelectItem>
                      <SelectItem value="all">All ages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Room rules</Label>
                <Textarea
                  value={form.rules} rows={3} maxLength={500}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  placeholder="Be kind. No personal contact info. No medical advice."
                />
              </div>
              <div>
                <Label>Privacy</Label>
                <Select value={form.privacy} onValueChange={(v: any) => setForm({ ...form, privacy: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open — anyone can join</SelectItem>
                    <SelectItem value="approval">Approval required — you accept requests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={createRoom} disabled={creating} className="flex-1">
                  {creating ? "Creating…" : "Create Room"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const safety = safetyFromReports(room.reports_24h || 0);
          const active = (room.recent_count || 0) > 0;
          const isMine = currentUserId && room.created_by === currentUserId;
          return (
            <Card key={room.id} className="hover:shadow-md transition-shadow animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2.5 w-2.5 rounded-full ${safety.color} flex-shrink-0`} title={safety.label} />
                    <CardTitle className="text-lg truncate">#{room.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                    <Users className="h-3 w-3" />
                    {room.participant_count}
                  </Badge>
                </div>
                <CardDescription className="space-y-2">
                  <div>{room.description}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">#{room.topic_tag}</Badge>
                    <Badge variant="outline" className="text-xs">{AGE_BAND_LABEL[room.age_band]}</Badge>
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {room.privacy === "open" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {room.privacy === "open" ? "Open" : "Approval"}
                    </Badge>
                    {isMine && <Badge variant="outline" className="text-xs">👑 Yours</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {active ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Active now · {room.recent_count} {room.recent_count === 1 ? "msg" : "msgs"}
                      </span>
                    ) : (
                      <span>Last active {formatRelative(room.last_activity_at)}</span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleJoin(room)}
                  disabled={room.pending_request}
                  className="w-full min-h-[44px]"
                  variant={room.pending_request ? "outline" : "default"}
                >
                  {room.pending_request
                    ? "Request pending…"
                    : room.privacy === "approval"
                    ? "Request to join"
                    : "Join room"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No rooms yet. Be the first to create one.
        </div>
      )}
    </div>
  );
};

export default CommunityRooms;
