import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore } from "../store/useThemeStore";
import { PlusCircle, Send, X, Smile, Mic } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { sendMessage } = useChatStore();
  const { activeTheme } = useThemeStore();

  useEffect(() => {
    // Close emoji picker when clicking outside
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      setText("");
      setImagePreview(null);
      setShowEmojiPicker(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <footer className="p-4 sm:p-6 pt-2 shrink-0 bg-transparent relative">
      {/* Display image preview if selected */}
      {imagePreview && (
        <div className="mb-4">
          <div className="relative inline-block mt-1 group cursor-pointer overflow-hidden rounded-xl border border-[#6764f2]/30 shadow-sm">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 sm:w-64 h-24 sm:h-40 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 size-6 rounded-full bg-slate-900/50 hover:bg-slate-900 flex items-center justify-center text-white backdrop-blur-sm transition-colors"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker container */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-4 mb-2 z-50" ref={emojiPickerRef}>
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={activeTheme === "dark" ? "dark" : "light"}
          />
        </div>
      )}

      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row sm:items-end gap-2 shadow-lg dark:shadow-black/20 relative z-20 transition-all">

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className={`p-2 sm:p-3 rounded-xl transition-all shrink-0 ${imagePreview ? "text-[#6764f2]" : "text-slate-400 hover:text-[#6764f2] hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            onClick={() => fileInputRef.current?.click()}
            title="Attach Photo"
          >
            <PlusCircle className="size-5 sm:size-6" />
          </button>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        <div className="flex-1 py-1 sm:py-3 px-2 sm:px-0">
          <input
            type="text"
            className="w-full bg-transparent border-none p-0 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-0 outline-none"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-1 pb-1 sm:pb-0 px-2 sm:px-0">
          <button
            type="button"
            className={`hidden sm:flex p-2 rounded-xl transition-all shrink-0 ${showEmojiPicker ? "text-yellow-500 bg-slate-100 dark:bg-white/5" : "text-slate-400 hover:text-yellow-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}
            title="Add emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="size-5" />
          </button>
          <button
            type="button"
            className="hidden sm:flex p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all shrink-0"
            title="Voice message"
          >
            <Mic className="size-5" />
          </button>

          <button
            type="submit"
            className="p-2.5 sm:p-3 bg-[#6764f2] hover:bg-[#524fcc] text-white rounded-xl shadow-md shadow-[#6764f2]/30 transition-all shrink-0 sm:ml-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!text.trim() && !imagePreview}
          >
            <Send className="size-5 ml-0.5" />
          </button>
        </div>
      </form>
      <div className="text-center mt-2 hidden lg:block">
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Press Enter to send, Shift + Enter for new line</p>
      </div>
    </footer>
  );
};

export default MessageInput;
