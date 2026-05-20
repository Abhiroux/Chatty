import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Users, Check, Search } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { users } = useChatStore();
  const { createGroup } = useGroupStore();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredFriends = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    if (selectedMembers.length < 1) return;

    setIsCreating(true);
    const group = await createGroup({
      name: groupName,
      description,
      memberIds: selectedMembers,
    });

    if (group) {
      setGroupName("");
      setDescription("");
      setSelectedMembers([]);
      setSearchFilter("");
      onClose();
    }
    setIsCreating(false);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16152a] w-full max-w-md rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6764f2]/10 rounded-xl">
              <Users className="size-5 text-[#6764f2]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              New Group
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-500 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-4">
          {/* Group Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              maxLength={50}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1d33] py-2.5 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#6764f2]/50 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              maxLength={200}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1d33] py-2.5 px-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#6764f2]/50 outline-none transition-all"
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Add Members * ({selectedMembers.length} selected)
            </label>

            {/* Search filter */}
            <div className="relative mb-3">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="size-4" />
              </div>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter friends..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1e1d33] py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#6764f2]/50 outline-none transition-all"
              />
            </div>

            {/* Selected member pills */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedMembers.map((memberId) => {
                  const user = users.find((u) => u._id === memberId);
                  if (!user) return null;
                  return (
                    <span
                      key={memberId}
                      className="inline-flex items-center gap-1 bg-[#6764f2]/10 text-[#6764f2] text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#6764f2]/20 transition-colors"
                      onClick={() => toggleMember(memberId)}
                    >
                      {user.fullName}
                      <X className="size-3" />
                    </span>
                  );
                })}
              </div>
            )}

            {/* Friend list */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">
                  {users.length === 0
                    ? "No friends yet. Add friends first!"
                    : "No matching friends"}
                </p>
              ) : (
                filteredFriends.map((user) => {
                  const isSelected = selectedMembers.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleMember(user._id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#6764f2]/10 dark:bg-[#6764f2]/20"
                          : "hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className="bg-center bg-no-repeat bg-cover rounded-full size-9"
                          style={{
                            backgroundImage: `url(${user.profilePic || "./avatar.png"})`,
                          }}
                        ></div>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex-1 truncate">
                        {user.fullName}
                      </p>
                      <div
                        className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-[#6764f2] border-[#6764f2]"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && <Check className="size-3 text-white" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedMembers.length < 1 || isCreating}
            className="w-full bg-[#6764f2] hover:bg-[#524fcc] text-white py-3 rounded-xl font-semibold shadow-md shadow-[#6764f2]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Users className="size-4" />
                Create Group ({selectedMembers.length + 1} members)
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateGroupModal;
