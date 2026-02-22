import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  // State for message text content
  const [text, setText] = useState("");
  // State for image preview (base64 data URL)
  const [imagePreview, setImagePreview] = useState(null);
  // Ref to access hidden file input element
  const fileInputRef = useRef(null);
  // Hook to access sendMessage function from chat store
  const { sendMessage } = useChatStore();

  // Handle image file selection and generate preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    // Validate that selected file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    // Read file as data URL for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Clear image preview and reset file input value
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle form submission to send message with text and/or image
  const handleSendMessage = async (e) => {
    e.preventDefault();
    // Don't send empty messages
    if (!text.trim() && !imagePreview) return;
    try {
      // Send message to backend via store
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      // Reset form after successful send
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {/* Display image preview if selected */}
      {imagePreview && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
              />
              {/* Button to remove selected image */}
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                type="button"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          {/* Text input field for message content */}
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {/* Hidden file input for image selection */}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          {/* Button to trigger file input (image upload) */}
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        {/* Send message button */}
        <button
          type="submit"
          className="btn btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={25} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
