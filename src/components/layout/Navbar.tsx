import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/branding/Logo";

const Navbar = () => {
  const { toast } = useToast();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged out", description: "See you soon." });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <nav className="container mx-auto flex items-center justify-between py-3">
        <Link to="/" aria-label="Talk home" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="sr-only">Talk</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <NavLink to="/feed" className={({isActive}) => isActive ? "text-primary" : "text-foreground/80 hover:text-foreground"}>Feed</NavLink>
          <NavLink to="/chat" className={({isActive}) => isActive ? "text-primary" : "text-foreground/80 hover:text-foreground"}>Chat</NavLink>
          <NavLink to="/help" className={({isActive}) => isActive ? "text-primary" : "text-foreground/80 hover:text-foreground"}>Get Help</NavLink>
          <NavLink to="/quotes" className={({isActive}) => isActive ? "text-primary" : "text-foreground/80 hover:text-foreground"}>Quotes</NavLink>
        </div>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Button variant="ghost" onClick={handleLogout}>Log out</Button>
              <Button variant="hero" asChild>
                <Link to="/chat" aria-label="Start a Talk">Start a Talk</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth" aria-label="Login">Log in</Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth" aria-label="Create account">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
