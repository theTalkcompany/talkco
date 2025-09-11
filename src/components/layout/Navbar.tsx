import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/branding/Logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
const Navbar = () => {
  const {
    toast
  } = useToast();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => setLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Logged out",
        description: "See you soon."
      });
    }
  };
  const navItems = [{
    to: "/feed",
    label: "Feed"
  }, {
    to: "/chat",
    label: "Chat"
  }, {
    to: "/help",
    label: "Get Help"
  }, {
    to: "/quotes",
    label: "Quotes"
  }, {
    to: "/profile",
    label: "Profile"
  }];
  return <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md shadow-sm">
      <nav className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" aria-label="Talk home" className="flex items-center gap-2 focus-ring rounded-md">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-xl text-primary">
        </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map(item => <NavLink key={item.to} to={item.to} className={({
          isActive
        }) => `text-sm font-medium transition-colors focus-ring rounded-md px-3 py-2 ${isActive ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-accent/50"}`}>
              {item.label}
            </NavLink>)}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? <>
              <Button variant="ghost" onClick={handleLogout} className="focus-ring">
                Log out
              </Button>
              <Button variant="hero" asChild>
                <Link to="/chat" aria-label="Start a Talk" className="focus-ring">
                  Start a Talk
                </Link>
              </Button>
            </> : <>
              <Button variant="ghost" asChild>
                <Link to="/auth" aria-label="Login" className="focus-ring">
                  Log in
                </Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth" aria-label="Create account" className="focus-ring">
                  Get Started
                </Link>
              </Button>
            </>}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="focus-ring">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="font-bold text-lg text-primary">Talk</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <nav className="flex flex-col gap-2">
                {navItems.map(item => <NavLink key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)} className={({
                isActive
              }) => `text-left px-4 py-3 rounded-lg font-medium transition-colors focus-ring ${isActive ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-accent/50"}`}>
                    {item.label}
                  </NavLink>)}
                
                <div className="border-t pt-4 mt-4 space-y-2">
                  {loggedIn ? <>
                      <Button variant="ghost" onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }} className="w-full justify-start focus-ring">
                        Log out
                      </Button>
                      <Button variant="hero" asChild className="w-full">
                        <Link to="/chat" onClick={() => setIsMenuOpen(false)} className="focus-ring">
                          Start a Talk
                        </Link>
                      </Button>
                    </> : <>
                      <Button variant="ghost" asChild className="w-full justify-start">
                        <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="focus-ring">
                          Log in
                        </Link>
                      </Button>
                      <Button variant="hero" asChild className="w-full">
                        <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="focus-ring">
                          Get Started
                        </Link>
                      </Button>
                    </>}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>;
};
export default Navbar;