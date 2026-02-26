import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  // Get the currently selected user from the chat store
  const { selectedUser } = useChatStore();

  return (
    // Full screen container with background color matching DESIGN.md
    <div className="h-screen bg-slate-50 dark:bg-[#111022] pt-16">
      <div className="flex items-center justify-center h-full p-4 sm:p-6">
        <div className="bg-white dark:bg-[#16152a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-6xl h-full flex overflow-hidden">
          {/* Sidebar component with user list */}
          <Sidebar />
          {/* Show either empty state or chat container based on selection */}
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
