import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function RoomChat({ roomId, username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const listRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const onHistory = (history) => {
      setMessages(history);
      scrollToBottom();
    };
    const onMessage = (entry) => {
      setMessages((prev) => [...prev, entry]);
      scrollToBottom();
    };
    const onTyping = ({ user, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(user);
        else next.delete(user);
        return next;
      });
    };

    socket.on("chat_history", onHistory);
    socket.on("chat_message", onMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.off("chat_history", onHistory);
      socket.off("chat_message", onMessage);
      socket.off("typing", onTyping);
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 0);
  };

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    socket.emit("chat_send", { room: roomId, user: username, message: msg });
    setText("");
    socket.emit("typing", { room: roomId, user: username, isTyping: false });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onChange = (e) => {
    setText(e.target.value);
    socket.emit("typing", { room: roomId, user: username, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing", { room: roomId, user: username, isTyping: false });
    }, 1200);
  };

  return (
    <div className="flex flex-col h-80 bg-white rounded-xl shadow-md">
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold">{m.user}:</span> {m.message}
            <span className="text-gray-400 text-xs ml-2">{new Date(m.ts).toLocaleTimeString()}</span>
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="text-xs text-gray-500 italic">
            {Array.from(typingUsers).slice(0, 2).join(", ")}
            {typingUsers.size > 2 ? ` and ${typingUsers.size - 2} others` : ""} typing...
          </div>
        )}
      </div>
      <div className="p-2 border-t flex gap-2">
        <textarea
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={2}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message and press Enter"
        />
        <button onClick={send} className="bg-teal-600 text-white px-3 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
