import { NavLink } from "react-router-dom";
import { MessageCircle, FileText, HelpCircle, Home, User, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileBottomNav = () => {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/feed", label: "Feed", icon: FileText },
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/help", label: "Help", icon: HelpCircle },
    { to: "/profile", label: "Me", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[56px] py-1.5 px-2 rounded-lg transition-colors focus-ring ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
