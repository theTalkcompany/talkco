import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import "./auth-styles.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase auto-processes the recovery token in the URL hash.
    // We listen for PASSWORD_RECOVERY or an existing session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setHasRecoverySession(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasRecoverySession(true);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const pwLen = password.length >= 8;
  const pwCap = /[A-Z]/.test(password);
  const pwNum = /\d/.test(password);
  const pwSpecial = /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(password);
  const pwScore = [pwLen, pwCap, pwNum, pwSpecial].filter(Boolean).length;
  const pwValid = pwLen && pwCap && pwNum && pwSpecial;
  const pwMatch = password.length > 0 && password === confirmPassword;

  const strengthColor = useMemo(() => {
    if (pwScore === 0) return "transparent";
    if (pwScore <= 2) return "#ef4444";
    if (pwScore === 3) return "#f59e0b";
    return "#10b981";
  }, [pwScore]);
  const strengthLabel = pwScore === 0 ? "" : pwScore <= 2 ? "Weak" : pwScore === 3 ? "Good" : "Strong";

  const reqStyle = (ok: boolean): React.CSSProperties => ({ color: ok ? "#10b981" : "hsl(215.4 16.3% 46.9%)" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!pwValid) {
      toast({
        title: "Password too weak",
        description: "Your password must be at least 8 characters and include a capital letter, a number, and a special character (like ! or @).",
        variant: "destructive",
      });
      return;
    }
    if (!pwMatch) {
      toast({ title: "Passwords don't match", description: "Please re-enter the same password in both fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const lower = error.message.toLowerCase();
        const friendly = (lower.includes("password") || lower.includes("pwned") || lower.includes("leaked") || lower.includes("weak"))
          ? "Your password must be at least 8 characters and include a capital letter, a number, and a special character (like ! or @)."
          : error.message;
        toast({ title: "Couldn't update password", description: friendly, variant: "destructive" });
        return;
      }
      setDone(true);
      toast({ title: "Password updated", description: "You can now log in with your new password." });
      setTimeout(() => { navigate("/auth"); }, 1800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Reset password — Talk</title></Helmet>
      <div className="auth-login">
        <div className="auth-blob blob-1" aria-hidden="true" />
        <div className="auth-blob blob-2" aria-hidden="true" />
        <div className="auth-blob blob-3" aria-hidden="true" />
        <div className="auth-container" style={{ justifyContent: 'center' }}>
          <div className="auth-success-card" style={{ maxWidth: 460 }}>
            {done ? (
              <>
                <h1 style={{ fontSize: 44, marginBottom: 12 }}>✅</h1>
                <h2 style={{ fontSize: 26, marginBottom: 12, color: 'hsl(222.2 84% 4.9%)', fontWeight: 700 }}>Password updated</h2>
                <p style={{ fontSize: 15, color: 'hsl(215.4 16.3% 46.9%)' }}>Redirecting you to login…</p>
              </>
            ) : !hasRecoverySession ? (
              <>
                <h2 style={{ fontSize: 22, marginBottom: 8, color: 'hsl(222.2 84% 4.9%)', fontWeight: 700 }}>Reset link invalid or expired</h2>
                <p style={{ fontSize: 14, marginBottom: 20, color: 'hsl(215.4 16.3% 46.9%)' }}>
                  Please request a new password reset link.
                </p>
                <Link to="/forgot-password" className="auth-btn" style={{ display: 'inline-block', width: 220, textDecoration: 'none', lineHeight: '46px' }}>
                  Request new link
                </Link>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 26, marginBottom: 8, color: 'hsl(222.2 84% 4.9%)', fontWeight: 700 }}>Set a new password</h2>
                <p style={{ fontSize: 14, marginBottom: 20, color: 'hsl(215.4 16.3% 46.9%)' }}>
                  Choose a strong password you haven't used before.
                </p>
                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="auth-input-box">
                    <input
                      type="password"
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      autoFocus
                    />
                    {password.length > 0 && (
                      <div className="pw-strength-wrap" tabIndex={0}>
                        <div className="pw-strength-bar">
                          <span style={{ width: `${(pwScore / 4) * 100}%`, background: strengthColor }} />
                        </div>
                        <div className="pw-strength-label" style={{ color: strengthColor }}>{strengthLabel}</div>
                        <div className="pw-requirements">
                          <div className="pw-req" style={reqStyle(pwLen)}>{pwLen ? "✓" : "✗"} 8+ characters</div>
                          <div className="pw-req" style={reqStyle(pwCap)}>{pwCap ? "✓" : "✗"} One capital letter</div>
                          <div className="pw-req" style={reqStyle(pwNum)}>{pwNum ? "✓" : "✗"} One number</div>
                          <div className="pw-req" style={reqStyle(pwSpecial)}>{pwSpecial ? "✓" : "✗"} One special character (! @ # …)</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="auth-input-box">
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    {confirmPassword.length > 0 && !pwMatch && (
                      <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Passwords don't match</p>
                    )}
                  </div>
                  <button type="submit" className="auth-btn" disabled={loading || !pwValid || !pwMatch}>
                    {loading ? "Updating…" : "Update password"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
