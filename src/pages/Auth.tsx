import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(async () => {
          try {
            // Ensure a profile row exists for this user
            await supabase.from("profiles").upsert({
              user_id: session.user.id,
              email: session.user.email ?? undefined,
              full_name: fullName || undefined,
              phone: phone || undefined,
              address: address || undefined,
            }, { onConflict: "user_id" });
          } catch (e) {
            console.error(e);
          } finally {
            navigate("/");
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
      setInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, [navigate, fullName, phone, address]);

  const redirectUrl = useMemo(() => `${window.location.origin}/`, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    if (!data.session) {
      toast({ title: "Check your email", description: "Confirm your email to finish sign up." });
    } else {
      toast({ title: "Welcome!", description: "Your account has been created." });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Logged in", description: "Welcome back." });
  };

  return (
    <>
      <Helmet>
        <title>Login & Sign Up — Talk</title>
        <meta name="description" content="Log in or create your Talk account to post, chat, and save your profile securely." />
        <link rel="canonical" href="/auth" />
      </Helmet>

      <section className="surface-card p-6 max-w-xl mx-auto">
        <h1 className="text-3xl font-bold">Login or Create your account</h1>
        <p className="mt-2 text-muted-foreground">Your info is private and stored securely with row‑level security.</p>

        <Tabs defaultValue="login" className="mt-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="hero" disabled={loading}>{loading ? "Logging in…" : "Log in"}</Button>
                <Button variant="outline" asChild><Link to="/">Back Home</Link></Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
              </div>
              <div>
                <Label htmlFor="fullName">Full name (optional)</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="address">Address (optional)</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="hero" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
                <Button variant="outline" asChild><Link to="/">Back Home</Link></Button>
              </div>
              <p className="text-xs text-muted-foreground">We’ll send a confirmation email. Make sure the redirect URL is allowed in Supabase Auth settings.</p>
            </form>
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
};

export default Auth;
