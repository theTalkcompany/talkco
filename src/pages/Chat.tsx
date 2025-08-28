import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import WillowChat from "@/components/chat/WillowChat";
import WillowAdmin from "@/components/admin/WillowAdmin";

const Chat = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === 'talkco@outlook.com') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  if (showAdmin && isAdmin) {
    return (
      <>
        <Helmet>
          <title>Willow Admin — Talk</title>
          <meta name="description" content="Configure Willow AI settings and customization." />
          <link rel="canonical" href="/chat" />
        </Helmet>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Willow Admin</h1>
          <Button variant="outline" onClick={() => setShowAdmin(false)}>
            Back to Chat
          </Button>
        </div>
        <WillowAdmin />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Chat with Willow — Talk</title>
        <meta name="description" content="Chat with Willow for supportive, judgment-free guidance, or join community rooms on Talk." />
        <link rel="canonical" href="/chat" />
      </Helmet>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Talk Live</h1>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowAdmin(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Willow Settings
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">Willow</TabsTrigger>
          <TabsTrigger value="community">Community Rooms</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-4">
          <article className="surface-card p-6">
            <h2 className="text-2xl font-semibold">Talk with Willow</h2>
            <p className="mt-2 text-muted-foreground">Private, judgment-free support. Willow listens, reflects, and offers gentle, practical steps.</p>
            <WillowChat />
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
