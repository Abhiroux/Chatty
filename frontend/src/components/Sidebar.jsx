import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus, Edit, Check, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useConnectionStore } from "../store/useConnectionStore";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  const {
    searchResults, searchUsers, isLoading: isSearching, friendRequests, getFriendRequests,
    sendRequest: sendFriendRequest, acceptRequest: acceptFriendRequest, rejectRequest: rejectFriendRequest,
    getSentRequests, sentRequests
  } = useConnectionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("contacts"); // "contacts", "search", "requests"

  useEffect(() => {
    getUsers();
    getFriendRequests();
    getSentRequests();
  }, [getUsers, getFriendRequests, getSentRequests]);

  // Count only online users who are in the contacts list (friends)
  const onlineFriendsCount = users.filter((user) => onlineUsers.includes(user._id)).length;

  const filteredUsers = showOnlineUsers
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setView("search");
      searchUsers(value);
    } else {
      setView("contacts");
      searchUsers("");
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-[#16152a] backdrop-blur-xl h-full shrink-0 relative z-20 transition-all duration-200">

      {/* Top Bar: User Profile & Actions */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-transparent">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer hidden lg:block">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-[#6764f2]/20"
              style={{ backgroundImage: `url(${authUser?.profilePic || "./avatar.png"})` }}
            ></div>
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-[#16152a] rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden lg:block">Chats</h2>
            <div className="lg:hidden flex items-center justify-center p-2">
              <Users className="size-6 text-slate-900 dark:text-slate-100" />
            </div>
          </div>
        </div>

        <button
          className="relative flex items-center justify-center size-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400 hidden lg:flex"
          onClick={() => setView(view === "requests" ? "contacts" : "requests")}
          title="Friend Requests"
        >
          <UserPlus className="size-5" />
          {friendRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#6764f2] text-white text-xs font-bold rounded-full size-4 flex items-center justify-center shadow-sm shadow-[#6764f2]/40">
              {friendRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 hidden lg:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 group-focus-within:text-[#6764f2] transition-colors">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border-none bg-slate-100 dark:bg-[#1e1d33] py-2.5 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-[#6764f2]/50 transition-all shadow-sm outline-none"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Filters */}
      {view === "contacts" && (
        <div className="px-4 pb-2 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineUsers}
              onChange={(e) => setShowOnlineUsers(e.target.checked)}
              className="checkbox checkbox-sm checkbox-primary rounded"
              style={{ '--chkbg': '#6764f2', '--chkfg': 'white' }}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Online only</span>
          </label>
          <span className="text-xs text-slate-400">
            ({onlineFriendsCount})
          </span>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {view === "contacts" && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="text-center text-slate-500 py-4 text-sm">No contacts found</div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUser?._id === user._id;
                const isOnline = onlineUsers.includes(user._id);

                return (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors relative ${isSelected
                      ? "bg-[#6764f2]/10 dark:bg-white/5"
                      : "hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                  >
                    <div className="relative shrink-0 mx-auto lg:mx-0">
                      <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-12"
                        style={{ backgroundImage: `url(${user.profilePic || "./avatar.png"})` }}
                      ></div>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white dark:border-[#1e1d33] rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-col flex-1 min-w-0 hidden lg:flex">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user.fullName}</p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {isOnline ? "Online" : "Offline"}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#6764f2] rounded-r-full hidden lg:block"></div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {view === "search" && (
          <div className="px-1 space-y-1">
            {isSearching ? (
              <div className="text-center text-slate-500 py-4 text-sm">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-slate-500 py-4 text-sm">No users found</div>
            ) : (
              searchResults.map((user) => {
                const isFriend = users.find(u => u._id === user._id);
                const isSent = sentRequests.find(r => r === user._id || r._id === user._id);

                return (
                  <div key={user._id} className="w-full p-3 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/5 transition-colors rounded-xl group cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0 mx-auto lg:mx-0">
                        <div
                          className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                          style={{ backgroundImage: `url(${user.profilePic || "./avatar.png"})` }}
                        ></div>
                      </div>
                      <div className="hidden lg:flex flex-col text-left min-w-0">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">{user.fullName}</div>
                      </div>
                    </div>

                    <div className="hidden lg:block">
                      {isFriend ? (
                        <span className="text-[10px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-white/5 px-2 py-1 rounded-full">Friend</span>
                      ) : isSent ? (
                        <span className="text-[10px] font-bold tracking-wide uppercase text-slate-400 dark:text-slate-500 bg-slate-200 dark:bg-white/5 px-2 py-1 rounded-full">Sent</span>
                      ) : (
                        <button
                          className="bg-[#6764f2] hover:bg-[#524fcc] text-white px-3 py-1 text-xs font-semibold rounded-lg shadow-sm shadow-[#6764f2]/30 transition-colors"
                          onClick={() => sendFriendRequest(user._id)}
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === "requests" && (
          <div className="px-1 space-y-2">
            <h3 className="px-2 pt-2 text-xs font-bold tracking-wider uppercase text-slate-500 mb-1 hidden lg:block">Friend Requests</h3>
            {friendRequests.length === 0 ? (
              <div className="text-center text-slate-500 py-4 text-sm hidden lg:block">No new requests</div>
            ) : (
              friendRequests.map((req) => (
                <div key={req._id} className="w-full p-3 flex flex-col gap-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white/50 dark:bg-[#1e1d33]/50">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div
                        className="bg-center bg-no-repeat bg-cover rounded-full size-10"
                        style={{ backgroundImage: `url(${req.profilePic || "./avatar.png"})` }}
                      ></div>
                    </div>
                    <div className="text-left min-w-0 flex-1 hidden lg:block">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate text-sm">{req.fullName}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full mt-1 hidden lg:flex">
                    <button
                      className="flex-1 bg-[#6764f2] hover:bg-[#524fcc] text-white py-1.5 text-xs font-semibold rounded-lg shadow-sm shadow-[#6764f2]/30 transition-colors flex items-center justify-center gap-1"
                      onClick={() => acceptFriendRequest(req._id, () => {
                        getUsers();
                        setView("contacts");
                      })}
                    >
                      <Check className="size-3" /> Accept
                    </button>
                    <button
                      className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                      onClick={() => rejectFriendRequest(req._id)}
                    >
                      <X className="size-3" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
