import React from "react";
import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-12 rounded-full relative">
              <img
                src={selectedUser.profilePic || "./avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>
          {/* user info section*/}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        {/* button to close chat */}
        <button
          onClick={() => setSelectedUser(null)}
          className="hover:cursor-pointer"
        >
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
