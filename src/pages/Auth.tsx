
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import "./auth-styles.css";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // UI state for toggle animation
  const [active, setActive] = useState(false); // false = login, true = signup
  const [showSuccess, setShowSuccess] = useState(false); // New state for success message

  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Keep session listener and create profile on first auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setTimeout(async () => {
            try {
              await supabase.from("profiles").upsert(
                {
                  user_id: session.user.id,
                  email: session.user.email ?? undefined,
                  full_name: fullName || undefined,
                  phone: phone || undefined,
                  address: address || undefined,
                  date_of_birth: dateOfBirth || undefined,
                },
                { onConflict: "user_id" }
              );
          } catch (e) {
            console.error(e);
          } finally {
            navigate("/");
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
    // We intentionally omit deps like fullName to avoid re-subscribing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const redirectUrl = useMemo(() => `${window.location.origin}/`, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Logged in", description: "Welcome back." });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Check if terms and privacy policy are accepted
    if (!termsAccepted) {
      toast({ title: "Terms of Service required", description: "Please accept the Terms of Service to continue.", variant: "destructive" });
      return;
    }
    
    if (!privacyAccepted) {
      toast({ title: "Privacy Policy required", description: "Please accept the Privacy Policy to continue.", variant: "destructive" });
      return;
    }
    
    // Validate date of birth
    if (!dateOfBirth) {
      toast({ title: "Date of birth required", description: "Please enter your date of birth to continue.", variant: "destructive" });
      return;
    }
    
    // Check if user is at least 13 years old
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      toast({ title: "Age requirement", description: "You must be at least 13 years old to create an account.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }

    try {
      await supabase.functions.invoke("send-welcome-email", {
        body: { email, name: fullName || undefined },
      });
    } catch (err) {
      console.error("Failed to send welcome email", err);
    }

    // Show success message regardless of whether email confirmation is required
    setShowSuccess(true);
    
    if (!data.session) {
      toast({ title: "Account created!", description: "You can now log in with your credentials." });
    } else {
      toast({ title: "Welcome!", description: "Your account has been created and you're logged in." });
    }
  };

  // Success screen component
  if (showSuccess) {
    return (
      <>
        <Helmet>
          <title>Welcome to Talk!</title>
        </Helmet>
        <div className="auth-login">
          <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#7494ec' }}>🎉</h1>
              <h1 style={{ fontSize: '36px', marginBottom: '16px', color: '#333' }}>Thank You!</h1>
              <p style={{ fontSize: '18px', marginBottom: '24px', color: '#666' }}>
                Your account has been created successfully.
              </p>
              <p style={{ fontSize: '16px', marginBottom: '32px', color: '#666' }}>
                You can now log in with your credentials.
              </p>
              <button 
                className="auth-btn" 
                onClick={() => {
                  setShowSuccess(false);
                  setActive(false); // Switch to login form
                  setEmail("");
                  setPassword("");
                  setFullName("");
                  setPhone("");
                  setAddress("");
                  setDateOfBirth("");
                  setTermsAccepted(false);
                  setPrivacyAccepted(false);
                }}
                style={{ width: '200px' }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login & Sign Up — Talk</title>
        <meta name="description" content="Beautiful login and signup for Talk, secured by Supabase with profiles and RLS." />
        <link rel="canonical" href="/auth" />
      </Helmet>

      <div className="auth-login">
        <div className={`auth-container ${active ? "active" : ""}`}>
          {/* Forms panel */}
          <div className="auth-form-box login">
            <div style={{ width: "100%" }}>
              <h1>Welcome back</h1>
              <p>Log in to continue your conversation.</p>
              <form className="auth-form" onSubmit={handleSignIn}>
                <div className="auth-input-box">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="forgot-link">
                  <Link to="#">Forgot your password?</Link>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Logging in…" : "Log in"}
                </button>
                <p style={{ marginTop: 16, fontSize: 13 }}>
                  New here? <button type="button" onClick={() => setActive(true)} style={{ color: "#7494ec", background: "transparent", border: 0, cursor: "pointer" }}>Create an account</button>
                </p>
                <p style={{ marginTop: 8, fontSize: 12 }}>
                  <Link to="/" style={{ color: "#333" }}>Back Home</Link>
                </p>
              </form>
            </div>
          </div>

          <div className="auth-form-box register">
            <div style={{ width: "100%" }}>
              <h1>Create account</h1>
              <p>Join Talk and keep your info private.</p>
              <form className="auth-form" onSubmit={handleSignUp}>
                <div className="auth-input-box">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    placeholder="Full name (optional)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    type="date"
                    placeholder="Date of Birth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <label style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Date of Birth (Required)
                  </label>
                </div>
                <div className="auth-input-box">
                  <input
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="auth-input-box">
                  <input
                    placeholder="Address (optional)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                
                {/* Terms and Privacy Agreement */}
                <div className="auth-input-box" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      id="terms-checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                      required
                    />
                    <label htmlFor="terms-checkbox" style={{ fontSize: '13px', color: '#666', cursor: 'pointer', lineHeight: '1.4' }}>
                      I agree to the{' '}
                      <Link to="/terms-of-service" target="_blank" style={{ color: '#7494ec', textDecoration: 'underline' }}>
                        Terms of Service
                      </Link>
                    </label>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="privacy-checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                      required
                    />
                    <label htmlFor="privacy-checkbox" style={{ fontSize: '13px', color: '#666', cursor: 'pointer', lineHeight: '1.4' }}>
                      I agree to the{' '}
                      <Link to="/privacy-policy" target="_blank" style={{ color: '#7494ec', textDecoration: 'underline' }}>
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
                
                <button type="submit" className="auth-btn" disabled={loading || !termsAccepted || !privacyAccepted}>
                  {loading ? "Creating…" : "Create account"}
                </button>
                <p style={{ marginTop: 16, fontSize: 13 }}>
                  Already have an account? <button type="button" onClick={() => setActive(false)} style={{ color: "#7494ec", background: "transparent", border: 0, cursor: "pointer" }}>Log in</button>
                </p>
                <p style={{ marginTop: 8, fontSize: 12 }}>
                  <Link to="/" style={{ color: "#333" }}>Back Home</Link>
                </p>
              </form>
            </div>
          </div>

          {/* Toggle panels */}
          <div className="auth-toggle-box">
            <div className="auth-toggle-panel toggle-left">
              <h1>Hello, Friend!</h1>
              <p>Enter your details and start a journey of healing.</p>
              <button className="auth-btn" onClick={() => setActive(true)}>
                Sign up
              </button>
            </div>
            <div className="auth-toggle-panel toggle-right">
              <h1>Welcome Back!</h1>
              <p>To keep connected, please log in with your personal info.</p>
              <button className="auth-btn" onClick={() => setActive(false)}>
                Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
