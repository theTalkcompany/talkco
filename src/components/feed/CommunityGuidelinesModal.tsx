import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Users } from "lucide-react";

interface Props {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const rules = [
  { icon: Heart, title: "Be kind", body: "Treat everyone with warmth and respect. We're all here for support." },
  { icon: ShieldCheck, title: "No harmful advice", body: "Don't recommend anything dangerous or pretend to be a professional." },
  { icon: Users, title: "You are not alone", body: "Whatever you're going through, this community is on your side." },
];

export const CommunityGuidelinesModal = ({ open, onAccept, onCancel }: Props) => (
  <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-center text-2xl">Community guidelines</DialogTitle>
        <DialogDescription className="text-center">
          A quick read before your first post — let's keep Talk a safe place for everyone.
        </DialogDescription>
      </DialogHeader>

      <ul className="space-y-3 my-4">
        {rules.map((r) => (
          <li key={r.title} className="flex gap-3 items-start rounded-lg border bg-card/50 p-3 animate-fade-in">
            <div className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <r.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{r.title}</p>
              <p className="text-sm text-muted-foreground">{r.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
        <Button variant="ghost" onClick={onCancel}>Not now</Button>
        <Button variant="hero" onClick={onAccept}>I agree — post my first message</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default CommunityGuidelinesModal;
