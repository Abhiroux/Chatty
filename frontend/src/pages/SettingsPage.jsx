import { useThemeStore } from "../store/useThemeStore";
import { Send, User, Monitor, Sun, Moon } from "lucide-react";

// Mock messages for the chat preview
const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just updating the new UI.",
    isSent: true,
  },
];

const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const SettingsPage = () => {
  // Get theme state and setter from store
  const { theme, setTheme, activeTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111022] container mx-auto px-4 sm:px-6 pt-24 pb-10 max-w-5xl">
      <div className="space-y-8">

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Theme Settings</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose a theme for your chat application.
          </p>
        </div>

        {/* Theme Selector */}
        <div className="bg-white dark:bg-[#16152a] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-4">Appearance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`
                   flex flex-col items-center gap-3 p-4 rounded-xl transition-all border-2
                   ${theme === id
                    ? "border-[#6764f2] bg-[#6764f2]/5 text-[#6764f2]"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"}
                 `}
                onClick={() => setTheme(id)}
              >
                <Icon className="size-6" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-white dark:bg-[#16152a] rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-6">Live Preview</h3>

          {/* Chat Preview Container */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl max-w-lg mx-auto bg-slate-50 dark:bg-[#111022]">

            {/* Chat Header with User Info */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#16152a]/70 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#6764f2] flex items-center justify-center text-white ring-2 ring-slate-100 dark:ring-[#16152a]">
                    <User className="size-5" />
                  </div>
                  <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white dark:border-[#16152a] rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight">John Doe</h3>
                  <p className="text-xs text-[#6764f2] font-medium flex items-center gap-1 mt-0.5">
                    <span className="inline-block size-1.5 rounded-full bg-[#6764f2]"></span>
                    Active now
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages Display */}
            <div className="p-6 space-y-6 min-h-[240px] bg-transparent">
              {PREVIEW_MESSAGES.map((message) => (
                <div key={message.id} className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}>
                  {/* Message Bubble */}
                  <div className={`
                          max-w-[80%] rounded-2xl p-4 shadow-sm
                          ${message.isSent
                      ? "bg-[#6764f2] text-white rounded-br-none shadow-[#6764f2]/20"
                      : "bg-white dark:bg-[#1e1d33] text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-800"}
                       `}>
                    <p className="text-sm sm:text-base">{message.content}</p>
                    {/* Message Timestamp */}
                    <p className={`text-[11px] mt-2 ${message.isSent ? "text-white/70" : "text-slate-400"}`}>12:00 PM</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Area */}
            <div className="p-4 bg-transparent border-t border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex items-center gap-2">
                <input
                  type="text"
                  className="w-full bg-transparent border-none px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-0 outline-none"
                  placeholder="Type a message..."
                  value="This is a preview"
                  readOnly
                />
                {/* Send Button */}
                <button className="p-3 bg-[#6764f2] text-white rounded-xl shadow-md shadow-[#6764f2]/30 shrink-0 flex items-center justify-center">
                  <Send className="size-4 ml-0.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
