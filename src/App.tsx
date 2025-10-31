import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { useEffect } from "react";
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
import Landing from "./pages/Landing";
import MainLayout from "./components/layout/MainLayout";
import { usePushNotifications } from "./hooks/usePushNotifications";

const queryClient = new QueryClient();

const AppContent = () => {
  usePushNotifications(); // Initialize push notifications
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="*" element={
        <MainLayout>
          <Routes>
            <Route path="/app" element={<Index />} />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      } />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelmetProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
