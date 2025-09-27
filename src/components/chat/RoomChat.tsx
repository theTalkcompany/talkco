import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Users, Flag, UserX, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useContentModeration } from "@/hooks/useContentModeration";
import { format } from "date-fns";

interface Room {
  id: string;
  name: string;
  description: string;
  created_by?: string;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profiles?: {
    display_name?: string;
    full_name?: string;
    email?: string;
  };
}

interface RoomChatProps {
  room: Room;
  onLeaveRoom: () => void;
}

const RoomChat = ({ room, onLeaveRoom }: RoomChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<Message | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { moderateContent, isChecking } = useContentModeration();

  const isRoomAdmin = currentUser && room.created_by === currentUser.id;

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    fetchParticipants();
    
    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Fetch profile for the new message
          supabase
            .from('profiles')
            .select('display_name, full_name, email')
            .eq('user_id', newMessage.user_id)
            .maybeSingle()
            .then(({ data: profile }) => {
              setMessages(prev => [...prev, { ...newMessage, profiles: profile }]);
            });
        }
      )
      .subscribe();

    // Subscribe to participants changes  
    const participantsChannel = supabase
      .channel('room-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [room.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setCurrentUser({ ...user, profile });
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('room_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, full_name, email')
            .eq('user_id', message.user_id)
            .maybeSingle();

          return {
            ...message,
            profiles: profile,
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', room.id);

      if (error) throw error;

      // Fetch profiles separately
      const participantsWithProfiles = await Promise.all(
        (data || []).map(async (participant) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, full_name, email')
            .eq('user_id', participant.user_id)
            .maybeSingle();

          return {
            ...participant,
            profiles: profile,
          };
        })
      );

      setParticipants(participantsWithProfiles);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || sending) return;

    setSending(true);
    try {
      // Create the message first
      const { data: messageData, error } = await supabase
        .from('room_messages')
        .insert({
          room_id: room.id,
          user_id: currentUser.id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      
      // Then moderate the content
      await moderateContent(newMessage.trim(), currentUser.id, 'chat_message', messageData.id, room.id);
      
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const submitReport = async () => {
    if (!reportingMessage || !reportReason || !currentUser) return;

    setSubmittingReport(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reported_user_id: reportingMessage.user_id,
          reported_by_user_id: currentUser.id,
          room_id: room.id,
          message_id: reportingMessage.id,
          message_content: reportingMessage.content,
          reason: reportReason,
        });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });

      setShowReportDialog(false);
      setReportingMessage(null);
      setReportReason("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  const kickUser = async (userId: string) => {
    if (!isRoomAdmin) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User removed",
        description: "The user has been removed from the room.",
      });
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      onLeaveRoom();
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDisplayName = (message: Message) => {
    if (message.profiles?.display_name) return message.profiles.display_name;
    if (message.profiles?.full_name) return message.profiles.full_name;
    if (message.profiles?.email) return message.profiles.email.split('@')[0];
    return 'Anonymous';
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">#{room.name}</h2>
              {isRoomAdmin && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{room.description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {participants.length}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="flex items-start gap-2 max-w-[85%]">
              <div
                className={`rounded-lg p-3 ${
                  message.user_id === currentUser?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                } ${message.user_id === currentUser?.id ? 'ml-auto' : ''}`}
              >
                {message.user_id !== currentUser?.id && (
                  <div className="text-xs font-medium mb-1">
                    {getDisplayName(message)}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 opacity-70`}>
                  {format(new Date(message.created_at), 'HH:mm')}
                </div>
              </div>
              
              {message.user_id !== currentUser?.id && (
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setReportingMessage(message);
                      setShowReportDialog(true);
                    }}
                  >
                    <Flag className="h-3 w-3" />
                  </Button>
                  {isRoomAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => kickUser(message.user_id)}
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none"
            disabled={sending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || isChecking}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reported Message:</label>
              <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                {reportingMessage?.content}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reason for reporting:</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment or bullying</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="spam">Spam or off-topic</SelectItem>
                  <SelectItem value="harmful">Harmful or dangerous advice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={submitReport}
                disabled={!reportReason || submittingReport}
                variant="destructive"
                className="flex-1"
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReportDialog(false);
                  setReportingMessage(null);
                  setReportReason("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomChat;