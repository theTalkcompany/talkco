import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const WelcomePopup = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) return;

        // Check if user has completed first login
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_login_completed')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking first login status:', error);
          return;
        }

        // Show popup if this is their first login
        if (profile && !profile.first_login_completed) {
          setShowWelcome(true);
        }
      } catch (error) {
        console.error('Error in checkFirstLogin:', error);
      }
    };

    checkFirstLogin();
  }, []);

  const handleWelcomeComplete = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;

      // Mark first login as completed
      const { error } = await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating first login status:', error);
        toast({
          title: "Error",
          description: "Failed to update welcome status",
          variant: "destructive"
        });
        return;
      }

      setShowWelcome(false);
      toast({
        title: "Welcome to Talk!",
        description: "Enjoy connecting with our supportive community."
      });
    } catch (error) {
      console.error('Error in handleWelcomeComplete:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={showWelcome}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-xl font-semibold text-primary">
            Welcome to Talk! 🌟
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4 text-sm leading-relaxed">
            <p className="font-medium text-foreground">
              This is a safe space to help, grow, and share advice with others.
            </p>
            
            <p>
              Talk is built on <strong>kindness, respect, and support</strong>. We do not tolerate:
            </p>
            
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>• Judgmental behavior</li>
              <li>• Rude or disrespectful comments</li>
              <li>• Bullying or harassment</li>
              <li>• Threatening behavior</li>
            </ul>
            
            <p className="text-foreground">
              Users who engage in inappropriate behavior will be <strong>permanently banned</strong> from the platform.
            </p>
            
            <p className="text-primary font-medium">
              Let's build a supportive community together! ✨
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleWelcomeComplete}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Getting started..." : "I understand, let's begin!"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};