import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeEmail, validateEmail } from "@/utils/inputSanitizer";
import "./auth-styles.css";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const clean = sanitizeEmail(email);
    if (!validateEmail(clean)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Couldn't send reset link", description: error.message, variant: "destructive" });
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Forgot password — Talk</title></Helmet>
      <div className="auth-login">
        <div className="auth-blob blob-1" aria-hidden="true" />
        <div className="auth-blob blob-2" aria-hidden="true" />
        <div className="auth-blob blob-3" aria-hidden="true" />
        <div className="auth-container" style={{ justifyContent: 'center' }}>
          <div className="auth-success-card" style={{ maxWidth: 440 }}>
            {sent ? (
              <>
                <h1 style={{ fontSize: 44, marginBottom: 12 }}>📬</h1>
                <h2 style={{ fontSize: 26, marginBottom: 12, color: 'hsl(222.2 84% 4.9%)', fontWeight: 700 }}>Check your inbox</h2>
                <p style={{ fontSize: 15, marginBottom: 24, color: 'hsl(215.4 16.3% 46.9%)' }}>
                  Check your inbox — we've sent a password reset link to your email.
                </p>
                <Link to="/auth" className="auth-btn" style={{ display: 'inline-block', width: 200, textDecoration: 'none', lineHeight: '46px' }}>
                  Back to login
                </Link>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 26, marginBottom: 8, color: 'hsl(222.2 84% 4.9%)', fontWeight: 700 }}>Forgot your password?</h2>
                <p style={{ fontSize: 14, marginBottom: 20, color: 'hsl(215.4 16.3% 46.9%)' }}>
                  Enter your email and we'll send you a link to set a new one.
                </p>
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="auth-input-box">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                  <p style={{ marginTop: 14, fontSize: 13, textAlign: 'center' }}>
                    <Link to="/auth" style={{ color: 'hsl(262 83% 58%)' }}>Back to login</Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
