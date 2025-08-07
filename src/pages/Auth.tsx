import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Auth = () => {
  return (
    <>
      <Helmet>
        <title>Account — Talk</title>
        <meta name="description" content="Create your Talk account to post, chat, and personalize your experience." />
        <link rel="canonical" href="/auth" />
      </Helmet>

      <section className="surface-card p-6 max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-muted-foreground">Sign up and log in will be available soon.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="hero" disabled>Sign up</Button>
          <Button variant="outline" asChild><Link to="/">Back Home</Link></Button>
        </div>
      </section>
    </>
  );
};

export default Auth;
