import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Phone, Video, Info, Mail, User as UserIcon, Calendar, ImageIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <>
      <header className="h-20 shrink-0 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/70 dark:bg-[#16152a]/70 backdrop-blur-md sticky top-0 z-30">
        <div
          className="flex items-center gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 p-2 rounded-xl transition-colors"
          onClick={() => setShowProfile(true)}
        >
          <div className="relative">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-11 ring-2 ring-slate-200 dark:ring-slate-700 shadow-sm"
              style={{ backgroundImage: `url(${selectedUser.profilePic || "./avatar.png"})` }}
            ></div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-[#16152a] rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{selectedUser.fullName}</h3>
            <p className="text-xs text-[#6764f2] font-medium flex items-center gap-1 mt-0.5">
              {isOnline ? (
                <>
                  <span className="inline-block size-1.5 rounded-full bg-[#6764f2] animate-pulse"></span>
                  Online
                </>
              ) : (
                <span className="text-slate-500">Offline</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <button className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors" title="Contact Info" onClick={() => setShowProfile(true)}>
            <Info className="size-5" />
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>
          <button
            className="size-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Close Chat"
            onClick={() => setSelectedUser(null)}
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {/* Friend Profile Modal */}
      {showProfile && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 shadow-2xl backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#16152a] w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col max-h-[90vh]">

            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pl-2">Contact Info</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pb-6">
              <div className="flex flex-col items-center pt-8 pb-6 bg-slate-50 dark:bg-[#1e1d33]/50">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setFullscreenImage(true)}
                  title="View full image"
                >
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt={selectedUser.fullName}
                    className="size-32 rounded-full object-cover ring-4 ring-white dark:ring-[#16152a] shadow-lg transition-transform hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="text-white size-8" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4">{selectedUser.fullName}</h3>
                <p className="text-sm font-medium mt-1">
                  {isOnline ? (
                    <span className="text-[#6764f2] bg-[#6764f2]/10 px-3 py-1 rounded-full">Online</span>
                  ) : (
                    <span className="text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">Offline</span>
                  )}
                </p>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Info block */}
                <div className="space-y-4 bg-slate-50 dark:bg-[#1e1d33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-start gap-3">
                    <UserIcon className="size-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Bio</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                        {selectedUser.bio || <span className="text-slate-400 italic">This user hasn't added a bio yet.</span>}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-2"></div>

                  <div className="flex items-center gap-3">
                    <Mail className="size-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Email</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{selectedUser.email || "Not Provided"}</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-2"></div>

                  <div className="flex items-center gap-3">
                    <Phone className="size-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Phone</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{selectedUser.phone || "Not Provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 justify-center">
                  <Calendar className="size-4" />
                  <span>Member since {selectedUser.createdAt?.split("T")[0] || "recently"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen friend image */}
      {showProfile && fullscreenImage && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(false)}
        >
          <img
            src={selectedUser.profilePic || "/avatar.png"}
            alt="Full size profile"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl transition-transform"
          />
          <button
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
          >
            <X className="size-6" />
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

export default ChatHeader;
