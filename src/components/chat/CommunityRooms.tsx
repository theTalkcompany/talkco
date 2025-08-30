import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import RoomChat from "./RoomChat";

interface Room {
  id: string;
  name: string;
  description: string;
  participant_count?: number;
  created_by?: string;
}

const CommunityRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // Fetch rooms with participant counts
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (roomsError) throw roomsError;

      // Get participant counts for each room
      const roomsWithCounts = await Promise.all(
        (roomsData || []).map(async (room) => {
          const { count } = await supabase
            .from('room_participants')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return {
            ...room,
            participant_count: count || 0,
          };
        })
      );

      setRooms(roomsWithCounts);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load community rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      toast({
        title: "Error",
        description: "Room name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create rooms",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .insert({
          name: newRoomName.trim(),
          description: newRoomDescription.trim(),
          created_by: user.id,
        });

      if (error) throw error;

      setNewRoomName("");
      setNewRoomDescription("");
      setShowCreateRoom(false);
      fetchRooms();
      
      toast({
        title: "Success",
        description: "Room created successfully!",
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (room: Room) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to join community rooms",
          variant: "destructive",
        });
        return;
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingParticipant) {
        // Join the room
        const { error } = await supabase
          .from('room_participants')
          .insert({
            room_id: room.id,
            user_id: user.id,
          });

        if (error) throw error;
      }

      setSelectedRoom(room);
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    }
  };

  if (selectedRoom) {
    return (
      <RoomChat 
        room={selectedRoom} 
        onLeaveRoom={() => setSelectedRoom(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading community rooms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Community Rooms</h3>
        <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
              <DialogDescription>
                Create a new community room for others to join and get support.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="text-sm font-medium">
                  Room Name
                </label>
                <Input
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  maxLength={50}
                />
              </div>
              <div>
                <label htmlFor="roomDescription" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="roomDescription"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Describe what this room is for..."
                  maxLength={200}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={createRoom} 
                  disabled={creating}
                  className="flex-1"
                >
                  {creating ? "Creating..." : "Create Room"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateRoom(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">#{room.name}</CardTitle>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {room.participant_count}
                </Badge>
              </div>
              <CardDescription>
                {room.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleJoinRoom(room)}
                className="w-full"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {rooms.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No community rooms available at the moment.
        </div>
      )}
    </div>
  );
};

export default CommunityRooms;