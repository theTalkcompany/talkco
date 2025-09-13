import { ReactNode, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "./Navbar";
import Footer from "./Footer";

const MainLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionExists, setSessionExists] = useState<boolean | null>(null);

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
    if (sessionExists === null) return; // not ready yet
    // Protect all routes except /auth
    if (!sessionExists && location.pathname !== "/auth") {
      navigate("/auth");
    }
    if (sessionExists && location.pathname === "/auth") {
      navigate("/");
    }
  }, [sessionExists, location.pathname, navigate]);

  const showFooter = location.pathname !== "/feed";

  return (
    <div className="min-h-screen flex flex-col glow-field" onMouseMove={onMouseMove}>
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;
