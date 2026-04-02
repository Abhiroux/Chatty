import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  // Get the currently selected user from the chat store
  const { selectedUser } = useChatStore();

  return (
    // Full screen container with background color matching DESIGN.md
    <div className="h-screen bg-slate-50 dark:bg-[#111022] pt-14 sm:pt-16">
      <div className="flex items-center justify-center h-full p-0 md:p-4 lg:p-6">
        <div className="bg-white dark:bg-[#16152a] md:rounded-2xl md:border border-slate-200 dark:border-slate-800 md:shadow-xl w-full max-w-6xl h-full flex overflow-hidden relative">
          {/* Sidebar — on mobile, hidden when a chat is open */}
          <div
            className={`w-full md:w-80 lg:w-96 shrink-0 h-full transition-transform duration-300 ease-in-out
              ${selectedUser ? "-translate-x-full md:translate-x-0 absolute md:relative" : "translate-x-0 relative"}
            `}
          >
            <Sidebar />
          </div>

          {/* Chat area — on mobile, slides in from the right when a user is selected */}
          <div
            className={`absolute md:relative inset-0 md:inset-auto w-full md:w-auto md:flex-1 h-full transition-transform duration-300 ease-in-out
              ${selectedUser ? "translate-x-0" : "translate-x-full md:translate-x-0"}
            `}
          >
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
