import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";

const Feed = () => {
  return (
    <>
      <Helmet>
        <title>Feed — Talk</title>
        <meta name="description" content="Share anonymously and support others in the Talk community feed." />
        <link rel="canonical" href="/feed" />
      </Helmet>
      <section className="surface-card p-6">
        <h1 className="text-3xl font-bold">Community Feed</h1>
        <p className="mt-2 text-muted-foreground">Post your thoughts anonymously and receive supportive comments.</p>
        <div className="mt-6 rounded-lg border p-4 bg-background">
          <p className="text-muted-foreground">Posting is coming soon. You’ll be able to share safely and get replies.</p>
          <div className="mt-3">
            <Button variant="hero" disabled>New Post</Button>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {[1,2,3].map((i) => (
            <article key={i} className="rounded-lg border bg-card p-4 hover-tilt">
              <h2 className="font-semibold">Anonymous</h2>
              <p className="mt-2 text-foreground/90">Today was tough, but I’m trying to take it one step at a time.</p>
              <div className="mt-3 text-sm text-muted-foreground">3 supportive comments</div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};

export default Feed;
