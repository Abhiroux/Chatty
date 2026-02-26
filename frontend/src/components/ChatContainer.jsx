import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { useRef } from "react";
import { X } from "lucide-react";

const ChatContainer = () => {
  const { authUser } = useAuthStore();
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const messageEndRef = useRef(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages(selectedUser);
    };
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#111022] relative z-10">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#111022] relative z-10 overflow-hidden">
      <ChatHeader />

      <div
        id="chat-container"
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar scroll-smooth"
      >
        {messages.map((message) => {
          const isSent = message.senderId === authUser._id;
          const pic = isSent ? authUser.profilePic : selectedUser.profilePic;

          return (
            <div
              key={message._id}
              className={`flex gap-4 max-w-[80%] ${isSent ? "flex-row-reverse self-end ml-auto" : ""}`}
              ref={messageEndRef}
            >
              <div className="shrink-0 flex flex-col justify-end">
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-8 mb-1 border border-slate-200 dark:border-slate-800"
                  style={{ backgroundImage: `url(${pic || "./avatar.png"})` }}
                ></div>
              </div>

              <div className={`flex flex-col gap-1 ${isSent ? "items-end" : "items-start"}`}>
                <div
                  className={`${isSent
                    ? "bg-[#6764f2] text-white rounded-2xl rounded-br-none shadow-md shadow-[#6764f2]/20"
                    : "bg-white dark:bg-[#1e1d33] text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 dark:border-slate-800"
                    } p-3 sm:p-4`}
                >
                  {message.image && (
                    <img
                      src={message.image}
                      alt="message attachment"
                      className="sm:max-w-[200px] rounded-lg mb-2 object-cover border border-black/10 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setFullscreenImage(message.image)}
                    />
                  )}
                  {message.text && <p className="text-sm sm:text-base leading-relaxed">{message.text}</p>}
                </div>

                <span className={`text-[11px] text-slate-400 ${isSent ? "pr-1" : "pl-1"}`}>
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />

      {/* Fullscreen Image Modal using Portal to overflow the container boundaries */}
      {fullscreenImage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out" onClick={() => setFullscreenImage(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="size-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen attachment"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </main>
  );
};

export default ChatContainer;
