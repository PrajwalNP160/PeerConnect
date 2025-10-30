import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import UsernamePrompt from "../components/UsernamePrompt";
import socket from "../socket"; // Import the shared socket instance
import { useUser } from "@clerk/clerk-react";
import { useParams } from "react-router-dom"; // Import useParams to get the roomId from the URL

export default function Home1() {
  const { user } = useUser();
  const { roomId } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    // Optional: handle events if backend emits them
    socket.on("room_full", () => {
      alert("The room is full. Please try another room.");
    });

    // Some backends emit 'user_joined' to others in the room
    socket.on("user_joined", () => {
      // no-op; navigation handled on join
    });

    // Cleanup socket listeners on component unmount
    return () => {
      socket.off("room_full");
      socket.off("user_joined");
    };
  }, [navigate]);

  const handleJoin = ({ username, room }) => {
    // Save and emit join event with plain roomId (server expects string)
    localStorage.setItem("username", username);
    localStorage.setItem("room", room);
    socket.emit("join_room", room);
    navigate(`/room/${room}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <UsernamePrompt
        onJoin={handleJoin}
        firstName={user.firstName}
        room={roomId}
      />
    </div>
  );
}
