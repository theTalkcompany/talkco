import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getDailyQuote, type Quote } from "@/data/quotes";
import { supabase } from "@/integrations/supabase/client";
import { X, Quote as QuoteIcon, Bell, BellOff } from "lucide-react";
import { useLocalNotifications } from "@/hooks/useLocalNotifications";
import { useHaptics } from "@/hooks/useHaptics";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DailyQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DailyQuoteModal = ({ open, onOpenChange }: DailyQuoteModalProps) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { scheduleDailyQuoteNotification, cancelDailyQuoteNotification, checkNotificationStatus } = useLocalNotifications();
  const { impact, notification } = useHaptics();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadQuote();
      checkNotifications();
    }
  }, [open]);

  const checkNotifications = async () => {
    const status = await checkNotificationStatus();
    setNotificationsEnabled(status);
  };

  const handleNotificationToggle = async (checked: boolean) => {
    await impact('medium');
    
    if (checked) {
      const success = await scheduleDailyQuoteNotification();
      if (success) {
        setNotificationsEnabled(true);
        toast({
          title: "Daily reminders enabled",
          description: "You'll receive a notification at 9 AM every day with your daily quote.",
        });
        await notification('success');
      } else {
        toast({
          title: "Permission needed",
          description: "Please enable notifications in your device settings.",
          variant: "destructive",
        });
        await notification('error');
      }
    } else {
      await cancelDailyQuoteNotification();
      setNotificationsEnabled(false);
      toast({
        title: "Daily reminders disabled",
        description: "You won't receive daily quote notifications anymore.",
      });
    }
  };

  const loadQuote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dailyQuote = await getDailyQuote(user?.id);
      setQuote(dailyQuote);
    } catch (error) {
      console.error("Failed to load quote:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <QuoteIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            Your Daily Quote
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="py-6">
          {loading ? (
            <div className="space-y-3">
              <div className="loading-skeleton h-4 w-full"></div>
              <div className="loading-skeleton h-4 w-3/4"></div>
              <div className="loading-skeleton h-3 w-1/2"></div>
            </div>
          ) : quote ? (
            <div className="text-center space-y-4">
              <blockquote className="text-lg leading-relaxed italic text-foreground">
                "{quote.text}"
              </blockquote>
              <cite className="block text-sm text-muted-foreground font-medium">
                — {quote.author}
              </cite>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              Unable to load today's quote. Please try again later.
            </p>
          )}
        </div>
        
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              {notificationsEnabled ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="notifications" className="text-sm cursor-pointer">
                Daily reminder at 9 AM
              </Label>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
          
          <div className="flex justify-center">
            <Button 
              onClick={() => onOpenChange(false)}
              className="min-w-[120px]"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};