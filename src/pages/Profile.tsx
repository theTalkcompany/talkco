import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle } from "lucide-react";
import AvatarPicker from "@/components/profile/AvatarPicker";
import MyPosts from "@/components/profile/MyPosts";
import ReportsAdmin from "@/components/admin/ReportsAdmin";
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

const presetSeeds = [
  "Aurora","Milo","Nova","Zara","Leo","Ivy","Juno","Kai",
  "Luna","Nico","Orion","Piper","Quinn","Riley","Sage","Theo"
];

const presetAvatars = presetSeeds.map((s) => `/avatars/${s}.svg`);

export default function Profile() {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [showReports, setShowReports] = useState(false);
const [editing, setEditing] = useState({
  full_name: "",
  display_name: "",
  email: "",
  phone: "",
  address: "",
});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      if (!uid) {
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setUserId(uid);
      
      // Load profile
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, email, phone, address, avatar_url")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) {
        console.error(error);
        toast({ title: "Failed to load profile", description: error.message, variant: "destructive" });
      }
      if (mounted) {
        setProfile(data as ProfileRow | null);
        setEditing({
          full_name: (data?.full_name as string) || "",
          display_name: (data?.display_name as string) || "",
          email: (data?.email as string) || session?.user?.email || "",
          phone: (data?.phone as string) || "",
          address: (data?.address as string) || "",
        });
        setAvatarUrl((data?.avatar_url as string) || null);
        setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, [toast]);

  const handleSave = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (profile) {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: editing.full_name || null,
            display_name: editing.display_name || null,
            email: editing.email || null,
            phone: editing.phone || null,
            address: editing.address || null,
            avatar_url: avatarUrl || null,
          })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("profiles")
          .insert({
            user_id: userId,
            full_name: editing.full_name || null,
            display_name: editing.display_name || null,
            email: editing.email || null,
            phone: editing.phone || null,
            address: editing.address || null,
            avatar_url: avatarUrl || null,
          });
        if (error) throw error;
      }
      toast({ title: "Profile saved" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const publicUrl = publicData.publicUrl;
      setAvatarUrl(publicUrl);
      // Save immediately
      const { error: upError } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          avatar_url: publicUrl,
          full_name: editing.full_name || null,
          display_name: editing.display_name || null,
          email: editing.email || null,
          phone: editing.phone || null,
          address: editing.address || null,
        }, { onConflict: "user_id" } as any);
      if (upError) throw upError;
      toast({ title: "Avatar updated" });
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const choosePreset = async (url: string) => {
    if (!userId) return;
    try {
      setAvatarUrl(url);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          avatar_url: url,
          full_name: editing.full_name || null,
          display_name: editing.display_name || null,
          email: editing.email || null,
          phone: editing.phone || null,
          address: editing.address || null,
        }, { onConflict: "user_id" } as any);
      if (error) throw error;
      toast({ title: "Avatar selected" });
      setDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Failed to set avatar", description: err.message, variant: "destructive" });
    }
  };

  const canonical = useMemo(() => `${window.location.origin}/profile`, []);

  return (
    <>
      <Helmet>
        <title>Profile | Talk</title>
        <meta name="description" content="Manage your profile info and avatar. Upload a photo or choose from built-in avatars." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-3xl font-bold">User Profile</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button aria-label="Change avatar" className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || undefined} alt="User avatar" />
                      <AvatarFallback>{editing.full_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Update your avatar</DialogTitle>
                    <DialogDescription>Select a built-in style or upload your own image.</DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="upload">
                    <TabsList>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                      <TabsTrigger value="choose">Choose</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="space-y-4">
                      <p className="text-sm text-muted-foreground">Upload a square image for best results.</p>
                      <Input type="file" accept="image/*" onChange={onFileChange} />
                    </TabsContent>
                    <TabsContent value="choose" className="mt-4">
                      <AvatarPicker builtIn={presetAvatars} onSelect={choosePreset} />
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
              <p className="text-sm text-muted-foreground">Click the image to upload or choose an avatar.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={editing.full_name} onChange={(e) => setEditing((v) => ({ ...v, full_name: e.target.value }))} placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="display_name">Display name (optional)</Label>
                <Input id="display_name" value={editing.display_name} onChange={(e) => setEditing((v) => ({ ...v, display_name: e.target.value }))} placeholder="Shown instead of your name" />
                <p className="text-xs text-muted-foreground">Leave blank to appear as Anonymous in posts and chats.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editing.email} onChange={(e) => setEditing((v) => ({ ...v, email: e.target.value }))} placeholder="you@example.com" />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={editing.phone} onChange={(e) => setEditing((v) => ({ ...v, phone: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={editing.address} onChange={(e) => setEditing((v) => ({ ...v, address: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div>
                <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>My Posts & Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <MyPosts userId={userId} />
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Dialog open={showReports} onOpenChange={setShowReports}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    View User Reports
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>User Reports Management</DialogTitle>
                    <DialogDescription>
                      Review and manage reports submitted by community members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto">
                    <ReportsAdmin />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}
