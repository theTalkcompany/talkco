import { ReactNode, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { useIsMobile } from "@/hooks/use-mobile";
import { WelcomePopup } from "@/components/WelcomePopup";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);
  const isMobile = useIsMobile();
  
  // Initialize session security monitoring
  useSessionSecurity();

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty("--x", `${x}%`);
    target.style.setProperty("--y", `${y}%`);
  }, []);

  useEffect(() => {
    // Quick initial session check
    supabase.auth.getSession().then(({ data: { session } }) => setSessionExists(!!session));
    
    // Set up listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionExists(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionExists === null) return; // not ready yet
    
    const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service", "/contact", "/app-store-compliance", "/landing"];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    
    // Protect routes except public ones
    if (!sessionExists && !isPublicRoute) {
      navigate("/auth");
    }
    if (sessionExists && location.pathname === "/auth") {
      navigate("/");
    }
  }, [sessionExists, location.pathname, navigate]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showFooter = location.pathname !== "/feed";

  return (
    <div className="min-h-screen flex flex-col glow-field overflow-x-hidden" onMouseMove={onMouseMove}>
      <SecurityMonitor />
      <WelcomePopup />
      <Navbar />
      <main className={`flex-grow container mx-auto px-4 py-8 ${isMobile ? 'pb-20' : ''} w-full`}>
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
