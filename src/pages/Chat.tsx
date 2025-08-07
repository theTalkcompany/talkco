import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Chat = () => {
  return (
    <>
      <Helmet>
        <title>Chat — Talk</title>
        <meta name="description" content="Join live community rooms or talk to an AI for instant support on Talk." />
        <link rel="canonical" href="/chat" />
      </Helmet>

      <h1 className="text-3xl font-bold mb-4">Talk Live</h1>
      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">AI Support</TabsTrigger>
          <TabsTrigger value="community">Community Rooms</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-4">
          <article className="surface-card p-6">
            <h2 className="text-2xl font-semibold">Talk to an AI</h2>
            <p className="mt-2 text-muted-foreground">Private, always-on support to help you process your feelings.</p>
            <div className="mt-4">
              <Button variant="hero" disabled>Start AI Session</Button>
            </div>
          </article>
        </TabsContent>
        <TabsContent value="community" className="mt-4">
          <article className="surface-card p-6">
            <h2 className="text-2xl font-semibold">Join a Room</h2>
            <p className="mt-2 text-muted-foreground">Group conversations where people support each other in real time.</p>
            <div className="mt-4 flex gap-3 flex-wrap">
              {["Anxiety","Low Mood","Loneliness"].map((room) => (
                <Button key={room} variant="outline" disabled>#{room}</Button>
              ))}
            </div>
          </article>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Chat;
