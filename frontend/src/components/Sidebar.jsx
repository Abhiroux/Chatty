import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, UserPlus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import { useFriendStore } from "../store/useFriendStore";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);

  const { searchResults, searchUsers, isSearching, friendRequests, getFriendRequests,
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, clearSearch,
    getSentRequests, sentRequests
  } = useFriendStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("contacts"); // "contacts", "search", "requests"

  useEffect(() => {
    getUsers();
    getFriendRequests();
    getSentRequests();
  }, [getUsers, getFriendRequests, getSentRequests]);

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
      clearSearch();
    }
  };

  if (isUsersLoading) return <SidebarSkeleton />;
  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
          <button
            className="hidden lg:flex relative btn btn-ghost btn-circle btn-sm"
            onClick={() => setView(view === "requests" ? "contacts" : "requests")}
            title="Friend Requests"
          >
            <UserPlus className="size-5" />
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full size-4 flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered input-sm w-full pl-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {view === "contacts" && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineUsers}
                onChange={(e) => setShowOnlineUsers(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">show online only</span>
            </label>
            <span className="text-sm text-zinc-500">
              ({onlineUsers.length - 1 < 0 ? 0 : onlineUsers.length - 1} online)
            </span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3 flex-1">
        {view === "contacts" && (
          <>
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
                  }`}
              >
                <div className="relative mx-auto lg:mx-0">
                  <img
                    src={user.profilePic || "./avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-zinc-900" />
                  )}
                </div>
                <div className="hidden lg:block text-left min-w-0">
                  <div className="font-medium truncate">{user.fullName}</div>
                  <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center text-zinc-500 py-4">No contacts found</div>
            )}
          </>
        )}

        {view === "search" && (
          <div className="px-2">
            {isSearching ? (
              <div className="text-center text-zinc-500 py-4">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-zinc-500 py-4">No users found</div>
            ) : (
              searchResults.map((user) => {
                const isFriend = users.find(u => u._id === user._id);
                const isSent = sentRequests.find(r => r === user._id || r._id === user._id);

                return (
                  <div key={user._id} className="w-full p-3 flex items-center justify-between hover:bg-base-300 transition-colors rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={user.profilePic || "./avatar.png"} alt={user.fullName} className="size-10 object-cover rounded-full flex-shrink-0" />
                      <div className="hidden lg:block text-left min-w-0">
                        <div className="font-medium truncate text-sm">{user.fullName}</div>
                      </div>
                    </div>
                    <div className="hidden lg:block">
                      {isFriend ? (
                        <span className="text-xs text-zinc-500 bg-base-200 px-2 py-1 rounded">Friend</span>
                      ) : isSent ? (
                        <span className="text-xs text-zinc-500 bg-base-200 px-2 py-1 rounded">Sent</span>
                      ) : (
                        <button
                          className="btn btn-primary btn-xs"
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
          <div className="px-2">
            <h3 className="px-3 text-sm font-semibold text-zinc-400 mb-2">Friend Requests</h3>
            {friendRequests.length === 0 ? (
              <div className="text-center text-zinc-500 py-4 text-sm">No new requests</div>
            ) : (
              friendRequests.map((req) => (
                <div key={req._id} className="w-full p-3 flex flex-col gap-2 hover:bg-base-300 transition-colors rounded-lg mb-2 border border-base-200">
                  <div className="flex items-center gap-3">
                    <img src={req.profilePic || "./avatar.png"} alt={req.fullName} className="size-10 object-cover rounded-full" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">{req.fullName}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full mt-1">
                    <button
                      className="btn btn-primary btn-xs flex-1"
                      onClick={() => acceptFriendRequest(req._id, () => {
                        getUsers(); // Refresh contacts list
                        setView("contacts"); // Switch back to contacts
                      })}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-ghost btn-xs flex-1"
                      onClick={() => rejectFriendRequest(req._id)}
                    >
                      Reject
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
