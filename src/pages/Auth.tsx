import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeEmail, sanitizeText, validateEmail, createRateLimiter } from "@/utils/inputSanitizer";
import "./auth-styles.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const calcAge = (y: number, m: number, d: number) => {
  const today = new Date();
  let age = today.getFullYear() - y;
  const md = (today.getMonth() + 1) - m;
  if (md < 0 || (md === 0 && today.getDate() < d)) age--;
  return age;
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginRateLimiter = useMemo(() => createRateLimiter(5, 15 * 60 * 1000), []);
  const signupRateLimiter = useMemo(() => createRateLimiter(3, 60 * 60 * 1000), []);

  const [active, setActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Display name availability state
  const [displayNameStatus, setDisplayNameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
  }, [navigate]);

  // Debounced display-name availability check
  useEffect(() => {
    const name = displayName.trim();
    if (!active) return;
    if (name.length === 0) { setDisplayNameStatus("idle"); return; }
    if (name.length < 3 || name.length > 30 || !/^[a-zA-Z0-9_.\- ]+$/.test(name)) {
      setDisplayNameStatus("invalid");
      return;
    }
    setDisplayNameStatus("checking");
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc("is_display_name_available", { _name: name });
      if (error) { setDisplayNameStatus("idle"); return; }
      setDisplayNameStatus(data ? "available" : "taken");
    }, 450);
    return () => clearTimeout(handle);
  }, [displayName, active]);

  const redirectUrl = useMemo(() => `${window.location.origin}/`, []);

  // Password rule checks
  const pwLen = password.length >= 8;
  const pwNum = /\d/.test(password);
  const pwCap = /[A-Z]/.test(password);
  const pwSpecial = /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(password);
  const pwScore = [pwLen, pwNum, pwCap, pwSpecial].filter(Boolean).length;
  const pwStrength = pwScore === 0 ? null : pwScore <= 2 ? "weak" : pwScore === 3 ? "good" : "strong";
  const pwValid = pwLen && pwNum && pwCap && pwSpecial;
  const pwMatch = password.length > 0 && password === confirmPassword;

  const dobValid = dobDay && dobMonth && dobYear;
  const age = dobValid ? calcAge(Number(dobYear), Number(dobMonth), Number(dobDay)) : null;
  const ageOk = age !== null && age >= 13;

  const emailValid = validateEmail(email.trim());
  const formValid =
    emailValid &&
    pwValid &&
    pwMatch &&
    displayNameStatus === "available" &&
    ageOk &&
    termsAccepted &&
    privacyAccepted;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const clientId = `login_${email.trim().toLowerCase()}`;
    if (!loginRateLimiter(clientId)) {
      toast({ title: "Too many attempts", description: "Please wait 15 minutes before trying again", variant: "destructive" });
      return;
    }
    if (!email.trim() || !password.trim()) {
      toast({ title: "Login failed", description: "Email and password are required", variant: "destructive" });
      return;
    }
    if (!validateEmail(email.trim())) {
      toast({ title: "Login failed", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email: sanitizeEmail(email), password });
      if (error) {
        try {
          await supabase.from('security_events').insert({
            event_type: 'failed_login', user_id: null, ip_address: null, user_agent: navigator.userAgent,
            details: { email: sanitizeEmail(email), error_message: error.message, timestamp: new Date().toISOString() }
          });
        } catch {}
        let msg = "Invalid email or password";
        if (error.message.includes("too many requests")) msg = "Too many login attempts. Please try again later.";
        toast({ title: "Login failed", description: msg, variant: "destructive" });
        return;
      }
      if (data.user) {
        try {
          await supabase.from('security_events').insert({
            event_type: 'successful_login', user_id: data.user.id, ip_address: null,
            user_agent: navigator.userAgent, details: { timestamp: new Date().toISOString() }
          });
        } catch {}
      }
      toast({ title: "Logged in", description: "Welcome back." });
    } catch {
      toast({ title: "Login failed", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !formValid) return;

    const signupClientId = `signup_${email.trim().toLowerCase()}`;
    if (!signupRateLimiter(signupClientId)) {
      toast({ title: "Too many attempts", description: "Please wait 1 hour before trying again", variant: "destructive" });
      return;
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedFullName = sanitizeText(fullName, 100);
    const sanitizedDisplayName = sanitizeText(displayName, 30);
    const dobIso = `${dobYear}-${String(dobMonth).padStart(2, "0")}-${String(dobDay).padStart(2, "0")}`;

    setLoading(true);
    try {
      // Re-check display name right before submission
      const { data: stillAvailable } = await supabase.rpc("is_display_name_available", { _name: sanitizedDisplayName });
      if (!stillAvailable) {
        toast({ title: "Display name taken", description: "Please choose a different display name.", variant: "destructive" });
        setDisplayNameStatus("taken");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) {
        let msg = error.message;
        if (error.message.includes("already registered")) msg = "An account with this email already exists. Please try logging in instead.";
        toast({ title: "Sign up failed", description: msg, variant: "destructive" });
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          user_id: data.user.id,
          email: data.user.email ?? sanitizedEmail,
          full_name: sanitizedFullName || null,
          display_name: sanitizedDisplayName,
          date_of_birth: dobIso,
        }, { onConflict: "user_id" });
        if (profileError) {
          console.error('Profile creation error:', profileError);
          toast({ title: "Profile creation failed", description: "Your account was created but profile setup failed. You can update your profile later.", variant: "destructive" });
        }
      }

      try {
        await supabase.functions.invoke("send-welcome-email", {
          body: { email: sanitizedEmail, name: sanitizedDisplayName || sanitizedFullName || undefined },
        });
      } catch (err) { console.error("Failed to send welcome email", err); }

      setShowSuccess(true);
      toast({
        title: data.session ? "Welcome!" : "Account created!",
        description: data.session ? "Your account has been created and you're logged in." : "You can now log in with your credentials.",
      });
    } catch {
      toast({ title: "Sign up failed", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <>
        <Helmet><title>Welcome to Talk!</title></Helmet>
        <div className="auth-login">
          <div className="auth-blob blob-1" aria-hidden="true" />
          <div className="auth-blob blob-2" aria-hidden="true" />
          <div className="auth-blob blob-3" aria-hidden="true" />
          <div className="auth-container" style={{ justifyContent: 'center' }}>
            <div className="auth-success-card">
              <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</h1>
              <h2 style={{ fontSize: '32px', marginBottom: '12px', color: 'hsl(222.2 84% 4.9%)', fontWeight: 700 }}>Thank You!</h2>
              <p style={{ fontSize: '16px', marginBottom: '16px', color: 'hsl(215.4 16.3% 46.9%)' }}>Your account has been created successfully.</p>
              <p style={{ fontSize: '15px', marginBottom: '32px', color: 'hsl(215.4 16.3% 46.9%)' }}>You can now log in with your credentials.</p>
              <button
                className="auth-btn"
                onClick={() => {
                  setShowSuccess(false); setActive(false);
                  setEmail(""); setPassword(""); setConfirmPassword("");
                  setFullName(""); setDisplayName("");
                  setDobDay(""); setDobMonth(""); setDobYear("");
                  setTermsAccepted(false); setPrivacyAccepted(false);
                }}
                style={{ width: '200px' }}
              >Go to Login</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - 13 - i);
  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  const strengthColor = pwStrength === "weak" ? "#ef4444" : pwStrength === "good" ? "#f59e0b" : pwStrength === "strong" ? "#10b981" : "transparent";
  const strengthLabel = pwStrength ? pwStrength.charAt(0).toUpperCase() + pwStrength.slice(1) : "";

  const reqStyle = (ok: boolean): React.CSSProperties => ({
    color: ok ? "#10b981" : "hsl(215.4 16.3% 46.9%)",
  });

  const dobSelectStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    padding: "0 10px",
    background: "hsl(210 40% 96.1%)",
    borderRadius: 10,
    border: "1px solid hsl(214.3 31.8% 91.4%)",
    fontSize: 13,
    fontFamily: "Poppins, sans-serif",
    color: "hsl(222.2 84% 4.9%)",
  };

  return (
    <>
      <Helmet>
        <title>Login & Sign Up — Talk</title>
        <meta name="description" content="Beautiful login and signup for Talk, secured by Supabase with profiles and RLS." />
        <link rel="canonical" href="/auth" />
      </Helmet>

      <div className="auth-login">
        <div className="auth-blob blob-1" aria-hidden="true" />
        <div className="auth-blob blob-2" aria-hidden="true" />
        <div className="auth-blob blob-3" aria-hidden="true" />

        <div className="auth-container">
          <div className="auth-welcome-panel" aria-live="polite">
            {active ? (
              <>
                <h1>Welcome Back!</h1>
                <p>To keep connected, please log in with your personal info.</p>
                <button type="button" className="auth-btn auth-btn-ghost" onClick={() => setActive(false)}>Log in</button>
              </>
            ) : (
              <>
                <h1>Hello, Friend!</h1>
                <p>Enter your details and start a journey of healing.</p>
                <button type="button" className="auth-btn auth-btn-ghost" onClick={() => setActive(true)}>Sign up</button>
              </>
            )}
          </div>

          <div className="auth-card">
            <div className={`auth-card-track ${active ? "active" : ""}`}>
              {/* Login panel */}
              <div className="auth-form-panel">
                <h1>Good to see you again 💜</h1>
                <p>Log in to continue your conversation.</p>
                <form className="auth-form" onSubmit={handleSignIn}>
                  <div className="auth-input-box">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div className="auth-input-box">
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
                  </div>
                  <div className="forgot-link"><Link to="#">Forgot your password?</Link></div>
                  <button type="submit" className="auth-btn" disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
                  <p style={{ marginTop: 16, fontSize: 13, textAlign: 'center' }}>
                    New here?{' '}
                    <button type="button" onClick={() => setActive(true)} style={{ color: "hsl(262 83% 58%)", background: "transparent", border: 0, cursor: "pointer" }}>Create an account</button>
                  </p>
                  <p style={{ marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                    <Link to="/" style={{ color: "hsl(215.4 16.3% 46.9%)" }}>Back Home</Link>
                  </p>
                </form>
              </div>

              {/* Sign up panel */}
              <div className="auth-form-panel">
                <h1>Create account</h1>
                <p>A safe space, just for you. No judgement, ever.</p>

                <form className="auth-form" onSubmit={handleSignUp}>
                  <div className="auth-input-box">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    {email.length > 0 && !emailValid && (
                      <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Please enter a valid email</p>
                    )}
                  </div>

                  <div className="auth-input-box">
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
                    {password.length > 0 && (
                      <div className="pw-strength-wrap" tabIndex={0}>
                        <div className="pw-strength-bar">
                          <span style={{ width: `${(pwScore / 3) * 100}%`, background: strengthColor }} />
                        </div>
                        <div className="pw-strength-label" style={{ color: strengthColor }}>{strengthLabel}</div>
                        <div className="pw-requirements">
                          <div className="pw-req" style={reqStyle(pwLen)}>{pwLen ? "✓" : "✗"} 8+ characters</div>
                          <div className="pw-req" style={reqStyle(pwNum)}>{pwNum ? "✓" : "✗"} One number</div>
                          <div className="pw-req" style={reqStyle(pwCap)}>{pwCap ? "✓" : "✗"} One capital letter</div>
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="auth-input-box">
                    <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                    {confirmPassword.length > 0 && !pwMatch && (
                      <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>Passwords don't match</p>
                    )}
                  </div>

                  <div className="auth-input-box">
                    <input
                      placeholder="Display name (shown to other users)"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      required
                      maxLength={30}
                      autoComplete="username"
                    />
                    {displayName.length > 0 && (
                      <p style={{
                        fontSize: 12, marginTop: 4,
                        color: displayNameStatus === "available" ? "#10b981"
                          : displayNameStatus === "taken" || displayNameStatus === "invalid" ? "#ef4444"
                          : "hsl(215.4 16.3% 46.9%)"
                      }}>
                        {displayNameStatus === "checking" && "Checking availability…"}
                        {displayNameStatus === "available" && "✓ Available"}
                        {displayNameStatus === "taken" && "✗ Already taken"}
                        {displayNameStatus === "invalid" && "3–30 chars, letters/numbers/._- only"}
                      </p>
                    )}
                  </div>

                  <div className="auth-input-box">
                    <input
                      placeholder="Full name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      autoComplete="name"
                    />
                    <label style={{ fontSize: 11, color: 'hsl(215.4 16.3% 46.9%)', marginTop: 4, display: 'block' }}>
                      Full Name (optional — never shown publicly)
                    </label>
                  </div>

                  <div style={{ margin: "4px 0 12px" }}>
                    <label style={{ fontSize: 12, color: 'hsl(215.4 16.3% 46.9%)', display: 'block', marginBottom: 4 }}>Date of birth</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: 8 }}>
                      <select className="auth-select" value={dobDay} onChange={e => setDobDay(e.target.value)} required style={dobSelectStyle}>
                        <option value="">Day</option>
                        {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select className="auth-select" value={dobMonth} onChange={e => setDobMonth(e.target.value)} required style={dobSelectStyle}>
                        <option value="">Month</option>
                        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                      <select className="auth-select" value={dobYear} onChange={e => setDobYear(e.target.value)} required style={dobSelectStyle}>
                        <option value="">Year</option>
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    {dobValid && !ageOk && (
                      <p style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>You must be 13 or older to use Talk</p>
                    )}
                  </div>

                  <div style={{ margin: '14px 0 18px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <input type="checkbox" id="terms-checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="auth-checkbox" required />
                      <label htmlFor="terms-checkbox" style={{ fontSize: 13, color: 'hsl(215.4 16.3% 46.9%)', cursor: 'pointer', lineHeight: 1.3 }}>
                        I agree to the{' '}
                        <Link to="/terms-of-service" target="_blank" style={{ color: 'hsl(262 83% 58%)', textDecoration: 'underline' }}>Terms of Service</Link>
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <input type="checkbox" id="privacy-checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)} className="auth-checkbox" required />
                      <label htmlFor="privacy-checkbox" style={{ fontSize: 13, color: 'hsl(215.4 16.3% 46.9%)', cursor: 'pointer', lineHeight: 1.3 }}>
                        I agree to the{' '}
                        <Link to="/privacy-policy" target="_blank" style={{ color: 'hsl(262 83% 58%)', textDecoration: 'underline' }}>Privacy Policy</Link>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-btn"
                    disabled={loading || !formValid}
                    style={{ marginTop: 4, marginBottom: 8, fontSize: 16, fontWeight: 600, height: 50 }}
                  >
                    {loading ? "Creating Account…" : "Create Account"}
                  </button>

                  <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => setActive(false)} style={{ color: "hsl(262 83% 58%)", background: "transparent", border: 0, cursor: "pointer", textDecoration: 'underline' }}>Log in</button>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
