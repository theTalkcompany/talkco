import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/branding/Logo";

const Navbar = () => {
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
          <Button variant="ghost" asChild>
            <Link to="/auth" aria-label="Login">Log in</Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/chat" aria-label="Start a Talk">Start a Talk</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
