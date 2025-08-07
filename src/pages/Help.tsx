import { Helmet } from "react-helmet-async";

const Help = () => {
  return (
    <>
      <Helmet>
        <title>Get Help — Talk</title>
        <meta name="description" content="Find professional mental health resources and crisis support." />
        <link rel="canonical" href="/help" />
      </Helmet>

      <section className="surface-card p-6">
        <h1 className="text-3xl font-bold">Professional Support</h1>
        <p className="mt-2 text-muted-foreground">If you’re in immediate danger, contact your local emergency number.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border p-4 bg-background">
            <h2 className="font-semibold">Crisis Resources</h2>
            <ul className="mt-2 text-muted-foreground list-disc pl-5 space-y-1">
              <li>US: 988 Suicide & Crisis Lifeline — Call or text 988</li>
              <li>UK & ROI: Samaritans — Call 116 123</li>
              <li>AU: Lifeline — 13 11 14</li>
            </ul>
          </article>
          <article className="rounded-lg border p-4 bg-background">
            <h2 className="font-semibold">Find a Professional</h2>
            <p className="mt-2 text-muted-foreground">Search for licensed therapists and counselors in your area.</p>
            <a className="mt-2 inline-block text-primary underline-offset-4 hover:underline" href="https://www.psychologytoday.com/" target="_blank" rel="noreferrer">Psychology Today directory</a>
          </article>
        </div>
      </section>
    </>
  );
};

export default Help;
