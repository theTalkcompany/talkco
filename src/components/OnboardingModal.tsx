import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Lock, ArrowRight, Check } from "lucide-react";

const STORAGE_KEY_PREFIX = "talkco_onboarding_done_";

const steps = [
  {
    icon: Heart,
    title: "Welcome to Talk",
    body: "Talk is a safe, judgment-free space to share what you're feeling, hear from others, and breathe a little easier. There's no right or wrong way to be here.",
  },
  {
    icon: Sparkles,
    title: "Meet Willow",
    body: "Willow is your private AI companion — kind, calm and always available. Whether you need to vent, work through something, or just feel less alone, Willow is here to listen.",
  },
  {
    icon: Lock,
    title: "Your privacy comes first",
    body: "Posts can stay anonymous. Conversations with Willow are private. We never share or sell your data, and you control what you put into the app.",
  },
];

export const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid || !mounted) return;
      setUserId(uid);
      const seen = localStorage.getItem(STORAGE_KEY_PREFIX + uid);
      if (!seen) setOpen(true);
    };
    check();
    return () => { mounted = false; };
  }, []);

  const complete = () => {
    if (userId) localStorage.setItem(STORAGE_KEY_PREFIX + userId, "1");
    setOpen(false);
    setStep(0);
  };

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else complete();
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) complete(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary shadow-glow animate-scale-in">
            <Icon className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-2xl">{current.title}</DialogTitle>
          <DialogDescription className="text-center text-base leading-relaxed pt-2">
            {current.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-8 bg-primary" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={complete} className="text-muted-foreground">
            Skip
          </Button>
          <Button onClick={next} className="min-w-[140px]" variant="hero">
            {step === steps.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Let's begin
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
