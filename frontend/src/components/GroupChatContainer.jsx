import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatMessageTime } from "../lib/utils";
import { X, ArrowLeft, Info, Users, LogOut, Crown, UserMinus, UserPlus, Search, Check } from "lucide-react";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import GroupMessageInput from "./GroupMessageInput";

const GroupChatContainer = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const {
    selectedGroup,
    groupMessages,
    getGroupMessages,
    isGroupMessagesLoading,
    setSelectedGroup,
    leaveGroup,
    removeGroupMember,
    addGroupMembers,
  } = useGroupStore();

  const messageEndRef = useRef(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);

  const { users: friends } = useChatStore();

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
    }
  }, [selectedGroup, selectedGroup?._id, getGroupMessages]);

  useEffect(() => {
    if (messageEndRef.current && groupMessages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages]);

  const isAdmin = selectedGroup?.admin?._id === authUser._id || selectedGroup?.admin === authUser._id;
  const onlineMembers = selectedGroup?.members?.filter((m) => onlineUsers.includes(m._id)) || [];

  // Friends not already in the group
  const availableFriends = friends.filter(
    (f) =>
      !selectedGroup?.members?.some((m) => (m._id || m) === f._id) &&
      f.fullName.toLowerCase().includes(addMemberSearch.toLowerCase())
  );

  const handleAddMembers = async () => {
    if (selectedNewMembers.length === 0) return;
    await addGroupMembers(selectedGroup._id, selectedNewMembers);
    setSelectedNewMembers([]);
    setShowAddMembers(false);
    setAddMemberSearch("");
  };

  const handleLeave = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await leaveGroup(selectedGroup._id);
    }
  };

  if (isGroupMessagesLoading) {
    return (
      <main className="flex-1 flex flex-col h-full w-full bg-slate-50 dark:bg-[#111022] relative z-10">
        <GroupHeader
          group={selectedGroup}
          onlineCount={onlineMembers.length}
          onBack={() => setSelectedGroup(null)}
          onInfo={() => setShowGroupInfo(true)}
        />
        <MessageSkeleton />
        <GroupMessageInput />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full w-full bg-slate-50 dark:bg-[#111022] relative z-10 overflow-hidden">
      <GroupHeader
        group={selectedGroup}
        onlineCount={onlineMembers.length}
        onBack={() => setSelectedGroup(null)}
        onInfo={() => setShowGroupInfo(true)}
      />

      <div
        id="group-chat-container"
        className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 custom-scrollbar scroll-smooth"
      >
        {groupMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#6764f2]/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#6764f2]" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              No messages yet
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Be the first to send a message!
            </p>
          </div>
        ) : (
          groupMessages.map((message) => {
            const sender = message.senderId;
            const isSent =
              (sender?._id || sender) === authUser._id;
            const senderName = sender?.fullName || "Unknown";
            const senderPic = isSent
              ? authUser.profilePic
              : sender?.profilePic;

            return (
              <div
                key={message._id}
                className={`flex gap-2 sm:gap-4 max-w-[88%] sm:max-w-[80%] ${
                  isSent ? "flex-row-reverse self-end ml-auto" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 flex flex-col justify-end ${
                    isSent ? "hidden sm:flex" : ""
                  }`}
                >
                  <div
                    className="bg-center bg-no-repeat bg-cover rounded-full size-7 sm:size-8 mb-1 border border-slate-200 dark:border-slate-800"
                    style={{
                      backgroundImage: `url(${senderPic || "./avatar.png"})`,
                    }}
                  ></div>
                </div>

                <div
                  className={`flex flex-col gap-0.5 sm:gap-1 ${
                    isSent ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender name — only for others */}
                  {!isSent && (
                    <span className="text-[10px] sm:text-[11px] font-semibold text-[#6764f2] pl-1">
                      {senderName}
                    </span>
                  )}

                  <div
                    className={`${
                      isSent
                        ? "bg-[#6764f2] text-white rounded-2xl rounded-br-sm shadow-md shadow-[#6764f2]/20"
                        : "bg-white dark:bg-[#1e1d33] text-slate-800 dark:text-slate-200 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-800"
                    } flex flex-col ${
                      message.image && !message.text ? "p-1.5" : "px-3 sm:px-4 py-2"
                    }`}
                  >
                    {message.image && (
                      <img
                        src={message.image}
                        alt="message attachment"
                        className={`max-w-[180px] sm:max-w-[200px] rounded-lg ${
                          message.text ? "mb-2" : "mb-0"
                        } object-cover border border-black/10 cursor-pointer hover:opacity-90 transition-opacity`}
                        onClick={() => setFullscreenImage(message.image)}
                      />
                    )}
                    {message.text && (
                      <p className="text-sm sm:text-base leading-relaxed break-words">
                        {message.text}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] sm:text-[11px] text-slate-400 ${
                      isSent ? "pr-1" : "pl-1"
                    } flex items-center justify-end gap-1 mt-1`}
                  >
                    {formatMessageTime(message.createdAt)}
                    {isSent && <Check className="size-3 text-[#6764f2]" />}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      <GroupMessageInput />

      {/* Fullscreen Image Modal */}
      {fullscreenImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(null);
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="size-5 sm:size-6" />
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

      {/* Group Info Modal */}
      {showGroupInfo &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#16152a] w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pl-2">
                  Group Info
                </h2>
                <button
                  onClick={() => setShowGroupInfo(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar flex-1 pb-6">
                {/* Group avatar & name */}
                <div className="flex flex-col items-center pt-8 pb-6 bg-slate-50 dark:bg-[#1e1d33]/50">
                  <div className="size-24 sm:size-28 rounded-full bg-gradient-to-br from-[#6764f2] to-[#9b59b6] flex items-center justify-center shadow-lg mb-4">
                    {selectedGroup?.groupPic ? (
                      <img
                        src={selectedGroup.groupPic}
                        alt={selectedGroup.name}
                        className="size-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="size-12 text-white" />
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedGroup?.name}
                  </h3>
                  {selectedGroup?.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center px-6">
                      {selectedGroup.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {selectedGroup?.members?.length} members · {onlineMembers.length} online
                  </p>
                </div>

                {/* Members list */}
                <div className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Members
                    </h4>
                    {isAdmin && (
                      <button
                        onClick={() => setShowAddMembers(!showAddMembers)}
                        className="text-xs text-[#6764f2] hover:text-[#524fcc] font-medium flex items-center gap-1 transition-colors"
                      >
                        <UserPlus className="size-3.5" />
                        Add
                      </button>
                    )}
                  </div>

                  {/* Add members section */}
                  {showAddMembers && (
                    <div className="mb-4 p-3 bg-slate-50 dark:bg-[#1e1d33] rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={addMemberSearch}
                          onChange={(e) => setAddMemberSearch(e.target.value)}
                          placeholder="Search friends..."
                          className="w-full rounded-lg bg-white dark:bg-[#16152a] py-2 pl-8 pr-3 text-xs border border-slate-200 dark:border-slate-600 outline-none focus:ring-1 focus:ring-[#6764f2]/50 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {availableFriends.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-3">
                            No friends to add
                          </p>
                        ) : (
                          availableFriends.map((friend) => (
                            <div
                              key={friend._id}
                              onClick={() =>
                                setSelectedNewMembers((prev) =>
                                  prev.includes(friend._id)
                                    ? prev.filter((id) => id !== friend._id)
                                    : [...prev, friend._id]
                                )
                              }
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedNewMembers.includes(friend._id)
                                  ? "bg-[#6764f2]/10"
                                  : "hover:bg-slate-100 dark:hover:bg-white/5"
                              }`}
                            >
                              <div
                                className="bg-center bg-no-repeat bg-cover rounded-full size-7"
                                style={{
                                  backgroundImage: `url(${friend.profilePic || "./avatar.png"})`,
                                }}
                              ></div>
                              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 flex-1 truncate">
                                {friend.fullName}
                              </span>
                              {selectedNewMembers.includes(friend._id) && (
                                <Check className="size-3.5 text-[#6764f2]" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      {selectedNewMembers.length > 0 && (
                        <button
                          onClick={handleAddMembers}
                          className="w-full mt-2 bg-[#6764f2] text-white text-xs py-2 rounded-lg font-medium hover:bg-[#524fcc] transition-colors"
                        >
                          Add {selectedNewMembers.length} member(s)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    {selectedGroup?.members?.map((member) => {
                      const memberId = member._id || member;
                      const memberIsAdmin =
                        (selectedGroup.admin?._id || selectedGroup.admin) ===
                        memberId;
                      const isOnline = onlineUsers.includes(memberId);
                      const isMe = memberId === authUser._id;

                      return (
                        <div
                          key={memberId}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <div className="relative shrink-0">
                            <div
                              className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                              style={{
                                backgroundImage: `url(${member.profilePic || "./avatar.png"})`,
                              }}
                            ></div>
                            {isOnline && (
                              <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-[#16152a] rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {member.fullName || "Unknown"}
                              {isMe && (
                                <span className="text-slate-400 text-xs ml-1">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">
                              {memberIsAdmin ? (
                                <span className="text-[#6764f2] flex items-center gap-0.5">
                                  <Crown className="size-3" /> Admin
                                </span>
                              ) : isOnline ? (
                                "Online"
                              ) : (
                                "Offline"
                              )}
                            </p>
                          </div>
                          {isAdmin && !isMe && !memberIsAdmin && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${member.fullName} from the group?`
                                  )
                                ) {
                                  removeGroupMember(
                                    selectedGroup._id,
                                    memberId
                                  );
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                              title="Remove member"
                            >
                              <UserMinus className="size-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave Group */}
                <div className="px-4 sm:px-6 pb-4">
                  <button
                    onClick={handleLeave}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-sm transition-colors border border-red-200 dark:border-red-900/30"
                  >
                    <LogOut className="size-4" />
                    Leave Group
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
};

// Sub-component: Group Header
const GroupHeader = ({ group, onlineCount, onBack, onInfo }) => {
  return (
    <header className="h-16 sm:h-20 shrink-0 px-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/70 dark:bg-[#16152a]/70 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
          className="md:hidden flex items-center justify-center size-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          onClick={onBack}
          title="Back to Chats"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 p-1.5 sm:p-2 rounded-xl transition-colors min-w-0 flex-1"
          onClick={onInfo}
        >
          <div className="relative shrink-0">
            <div className="size-9 sm:size-11 rounded-full bg-gradient-to-br from-[#6764f2] to-[#9b59b6] flex items-center justify-center shadow-sm ring-2 ring-slate-200 dark:ring-slate-700">
              {group?.groupPic ? (
                <img
                  src={group.groupPic}
                  alt={group.name}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <Users className="size-5 text-white" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-tight truncate">
              {group?.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {group?.members?.length} members · {onlineCount} online
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
        <button
          className="size-9 sm:size-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
          title="Group Info"
          onClick={onInfo}
        >
          <Info className="size-5" />
        </button>
        <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>
        <button
          className="hidden md:flex size-10 items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Close Chat"
          onClick={onBack}
        >
          <X className="size-5" />
        </button>
      </div>
    </header>
  );
};

export default GroupChatContainer;
