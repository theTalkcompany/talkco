import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId?: string;
  commentId?: string;
  reportedUserId: string;
  reportedContent: string;
  contentType: "post" | "comment";
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam or unwanted content" },
  { value: "harmful", label: "Self-harm or harmful content" },
  { value: "other", label: "Other violation" },
];

export const ReportDialog = ({
  open,
  onOpenChange,
  postId,
  commentId,
  reportedUserId,
  reportedContent,
  contentType,
}: ReportDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Select a reason",
        description: "Please select a reason for reporting this content.",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to report content.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const reportData = {
        reported_by_user_id: session.user.id,
        reported_user_id: reportedUserId,
        reason: selectedReason,
        status: "pending",
        message_content: reportedContent,
        ...(postId && { post_id: postId }),
        ...(commentId && { comment_id: commentId }),
      };

      const { error } = await supabase.from("reports").insert(reportData);

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: `Thank you for reporting this ${contentType}. We'll review it shortly.`,
      });

      setSelectedReason("");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Failed to submit report",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Report {contentType}
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
            This action is confidential.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground mb-1">Reported content:</p>
            <p className="text-sm">{reportedContent.slice(0, 100)}{reportedContent.length > 100 ? "..." : ""}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Why are you reporting this?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="text-sm cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedReason}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};