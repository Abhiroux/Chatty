import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full h-full flex flex-1 flex-col items-center justify-center p-8 sm:p-16 bg-slate-50 dark:bg-[#111022] relative z-10">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-[#6764f2]/10 dark:bg-[#6764f2]/20 flex items-center
             justify-center animate-bounce shadow-inner shadow-[#6764f2]/10"
            >
              <MessageSquare className="w-8 h-8 text-[#6764f2]" />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome to Chatty!</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
