import { NavLink } from "react-router-dom";
import { MessageCircle, FileText, HelpCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHaptics } from "@/hooks/useHaptics";

const MobileBottomNav = () => {
  const isMobile = useIsMobile();
  const { impact } = useHaptics();

  if (!isMobile) return null;

  const handleNavClick = () => {
    impact('light');
  };

  const navItems = [
    {
      to: "/feed",
      label: "Feed",
      icon: FileText,
    },
    {
      to: "/chat",
      label: "Chat",
      icon: MessageCircle,
    },
    {
      to: "/help",
      label: "Get Help",
      icon: HelpCircle,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors focus-ring ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`
              }
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;