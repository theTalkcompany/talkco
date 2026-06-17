import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Mail, Check, AlertTriangle } from "lucide-react";

type Status = "approved" | "removed" | "already" | "invalid" | "error";

const config: Record<Status, { title: string; message: string; icon: JSX.Element; tone: "purple" | "red" }> = {
  approved: {
    title: "Letter approved 💌",
    message: "It will find its way to someone who needs it.",
    icon: <Mail className="w-8 h-8" />,
    tone: "purple",
  },
  removed: {
    title: "Letter removed ✓",
    message: "Thank you for keeping the community safe.",
    icon: <Check className="w-8 h-8" />,
    tone: "purple",
  },
  already: {
    title: "This letter has already been reviewed ✓",
    message: "No further action needed.",
    icon: <Check className="w-8 h-8" />,
    tone: "purple",
  },
  invalid: {
    title: "Invalid link",
    message: "This moderation link is not valid or has expired.",
    icon: <AlertTriangle className="w-8 h-8" />,
    tone: "red",
  },
  error: {
    title: "Something went wrong",
    message: "We couldn't process this request. Please try again.",
    icon: <AlertTriangle className="w-8 h-8" />,
    tone: "red",
  },
};

const LetterModerated = () => {
  const [params] = useSearchParams();
  const status = (params.get("status") as Status) || "invalid";
  const { title, message, icon, tone } = config[status] ?? config.invalid;

  const accent =
    tone === "purple"
      ? "bg-primary/10 text-primary"
      : "bg-destructive/10 text-destructive";

  return (
    <>
      <Helmet>
        <title>{title} — Talk</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="min-h-[80vh] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md bg-card border border-border/50 rounded-2xl p-10 text-center shadow-elev">
          <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center ${accent}`}>
            {icon}
          </div>
          <h1 className="text-2xl font-bold mb-3 text-foreground">{title}</h1>
          {message && <p className="text-muted-foreground leading-relaxed">{message}</p>}
          <Link
            to="/letters"
            className="inline-block mt-8 text-sm font-semibold text-primary hover:underline"
          >
            Back to Letters
          </Link>
        </div>
      </main>
    </>
  );
};

export default LetterModerated;
