import { ReactNode, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { SecurityMonitor } from "@/components/security/SecurityMonitor";
import { useIsMobile } from "@/hooks/use-mobile";
import { WelcomePopup } from "@/components/WelcomePopup";
import OnboardingModal from "@/components/OnboardingModal";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);
  const isMobile = useIsMobile();

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionExists(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setSessionExists(!!session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionExists === null) return;
    const publicRoutes = ["/", "/auth", "/privacy-policy", "/terms-of-service", "/contact", "/app-store-compliance"];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    if (!sessionExists && !isPublicRoute) navigate("/auth");
    if (sessionExists && location.pathname === "/auth") navigate("/");
  }, [sessionExists, location.pathname, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const showFooter = location.pathname !== "/feed" && location.pathname !== "/chat";
  const immersive = location.pathname === "/letters/open";

  if (immersive) {
    return (
      <div className="min-h-screen">
        <SecurityMonitor />
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col glow-field overflow-x-hidden" onMouseMove={onMouseMove}>
      <SecurityMonitor />
      <WelcomePopup />
      <OnboardingModal />
      <Navbar />
      <main
        key={location.pathname}
        className={`flex-grow container mx-auto px-3 sm:px-4 py-4 sm:py-8 ${isMobile ? 'pb-24' : ''} w-full animate-fade-in`}
      >
        {children}
      </main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
