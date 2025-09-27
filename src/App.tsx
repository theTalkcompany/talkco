import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Help from "./pages/Help";
import Quotes from "./pages/Quotes";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import AppStoreCompliance from "./pages/AppStoreCompliance";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Add native-app class for mobile-only pink theme testing
    if (Capacitor.isNativePlatform()) {
      document.body.classList.add('native-app');
      console.log('🔥 NATIVE APP DETECTED - PINK THEME ACTIVATED FOR SYNC TEST 🔥');
    } else {
      document.body.classList.remove('native-app');
      console.log('🌐 Web browser - normal theme');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelmetProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/help" element={<Help />} />
                <Route path="/quotes" element={<Quotes />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/app-store-compliance" element={<AppStoreCompliance />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
