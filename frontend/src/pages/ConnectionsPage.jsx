import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useConnectionStore } from "../store/useConnectionStore";
import { Search, UserPlus, UserCheck, UserX, Send, X, Check, Mail, Phone, Info, SearchIcon, ImageIcon } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const ConnectionsPage = () => {
    const {
        friends,
        friendRequests,
        sentRequests,
        searchResults,
        isLoading,
        getFriends,
        getFriendRequests,
        getSentRequests,
        searchUsers,
        sendRequest,
        acceptRequest,
        rejectRequest,
        cancelRequest,
    } = useConnectionStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("friends"); // 'friends', 'requests', 'sent', 'search'
    const [selectedUser, setSelectedUser] = useState(null); // Modals for user info
    const [fullscreenImage, setFullscreenImage] = useState(false);

    useEffect(() => {
        getFriends();
        getFriendRequests();
        getSentRequests();
    }, [getFriends, getFriendRequests, getSentRequests]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            searchUsers(searchQuery);
            setActiveTab("search");
        }
    };

    const UserProfileModal = ({ user, onClose }) => {
        if (!user) return null;
        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 shadow-2xl backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-[#16152a] w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col max-h-[90vh]">

                    <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 pl-2">Contact Info</h2>
                        <button
                            onClick={onClose}
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
                                    src={user.profilePic || "/avatar.png"}
                                    alt={user.fullName}
                                    className="size-32 rounded-full object-cover ring-4 ring-white dark:ring-[#16152a] shadow-lg transition-transform hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ImageIcon className="text-white size-8" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-4">{user.fullName}</h3>
                            <p className="text-sm font-medium mt-1 text-slate-500">Connection</p>
                        </div>

                        <div className="px-6 py-6 space-y-6">
                            <div className="space-y-4 bg-slate-50 dark:bg-[#1e1d33] p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-start gap-3">
                                    <Info className="size-5 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Bio</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                                            {user.bio || <span className="text-slate-400 italic">This user hasn't added a bio yet.</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-2"></div>

                                <div className="flex items-center gap-3">
                                    <Mail className="size-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Email</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{user.email || "Not Provided"}</p>
                                    </div>
                                </div>

                                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full my-2"></div>

                                <div className="flex items-center gap-3">
                                    <Phone className="size-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Phone</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{user.phone || "Not Provided"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fullscreen friend image inside modal */}
                {fullscreenImage && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 cursor-zoom-out"
                        onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
                    >
                        <img
                            src={user.profilePic || "/avatar.png"}
                            alt="Full size profile"
                            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl transition-transform"
                        />
                        <button
                            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); setFullscreenImage(false); }}
                        >
                            <X className="size-6" />
                        </button>
                    </div>
                )}
            </div>,
            document.body
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#111022] pt-20 pb-10">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">

                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Connections</h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">Manage your friends and discover new people.</p>
                    </div>

                    <form onSubmit={handleSearch} className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ring-[#6764f2]"
                        />
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                    </form>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-px">
                    <button
                        onClick={() => setActiveTab("friends")}
                        className={`px-4 py-2.5 font-medium text-sm transition-colors border-b-2 ${activeTab === "friends"
                            ? "border-[#6764f2] text-[#6764f2] dark:text-[#6764f2]"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        My Friends ({friends.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("requests")}
                        className={`px-4 py-2.5 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === "requests"
                            ? "border-[#6764f2] text-[#6764f2] dark:text-[#6764f2]"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        Requests
                        {friendRequests.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{friendRequests.length}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("sent")}
                        className={`px-4 py-2.5 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === "sent"
                            ? "border-[#6764f2] text-[#6764f2] dark:text-[#6764f2]"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            }`}
                    >
                        Sent
                        {sentRequests.length > 0 && (
                            <span className="bg-[#6764f2] text-white text-[10px] px-2 py-0.5 rounded-full">{sentRequests.length}</span>
                        )}
                    </button>
                    {activeTab === "search" && (
                        <button
                            className={`px-4 py-2.5 font-medium text-sm transition-colors border-b-2 border-[#6764f2] text-[#6764f2] dark:text-[#6764f2]`}
                        >
                            Search Results
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-4 min-h-[400px]">
                    {isLoading && <div className="p-8 text-center text-slate-500">Loading...</div>}

                    {!isLoading && activeTab === "friends" && (
                        friends.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <UserPlus className="size-12 text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No friends yet</h3>
                                <p className="text-sm text-slate-500 mt-1">Search for users above to add new friends.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {friends.map(friend => (
                                    <div key={friend._id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(friend)}>
                                        <img src={friend.profilePic || "/avatar.png"} alt={friend.fullName} className="size-12 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-800" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{friend.fullName}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{friend.bio || "No bio"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {!isLoading && activeTab === "requests" && (
                        friendRequests.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <UserCheck className="size-12 text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No pending requests</h3>
                                <p className="text-sm text-slate-500 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {friendRequests.map(req => (
                                    <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(req)}>
                                            <img src={req.profilePic || "/avatar.png"} alt={req.fullName} className="size-12 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-800" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{req.fullName}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{req.bio || "Sent you a friend request"}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => rejectRequest(req._id)}
                                                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <X className="size-4" /> Decline
                                            </button>
                                            <button
                                                onClick={() => acceptRequest(req._id)}
                                                className="px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                            >
                                                <Check className="size-4" /> Accept
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {!isLoading && activeTab === "sent" && (
                        sentRequests.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <Send className="size-12 text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No sent requests</h3>
                                <p className="text-sm text-slate-500 mt-1">You haven't sent any friend requests.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sentRequests.map(user => (
                                    <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                            <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-12 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-800" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">Request pending</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => cancelRequest(user._id)}
                                            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <UserX className="size-4" /> Cancel
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {!isLoading && activeTab === "search" && (
                        searchResults.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <Search className="size-12 text-slate-300 dark:text-slate-600 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No results found</h3>
                                <p className="text-sm text-slate-500 mt-1">Try searching with a different name</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.map(user => (
                                    <div key={user._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedUser(user)}>
                                            <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-12 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-800" />
                                            <div>
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">User</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => !user.requestSent && sendRequest(user._id)}
                                            disabled={user.requestSent || friends.some(f => f._id === user._id) || friendRequests.some(r => r._id === user._id)}
                                            className={`px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm ${friends.some(f => f._id === user._id)
                                                ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                                                : user.requestSent
                                                    ? "bg-[#6764f2]/50 cursor-not-allowed"
                                                    : "bg-[#6764f2] hover:bg-[#524fcc]"
                                                }`}
                                        >
                                            {friends.some(f => f._id === user._id) ? "Friends" : user.requestSent ? "Sent" : <><UserPlus className="size-4" /> Add</>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            <UserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    );
};

export default ConnectionsPage;
