import { useWindowResize } from "@/hooks/useWindowResize";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import debounce from "lodash/debounce";

type ChatMessageInput = {
  placeholder: string;
  accentColor: string;
  height: number;
  onSend?: (message: string) => void;
};

export const ChatMessageInput = ({
  placeholder,
  accentColor,
  height,
  onSend,
}: ChatMessageInput) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const windowSize = useWindowResize();
  const [isTyping, setIsTyping] = useState(false);
  const [inputHasFocus, setInputHasFocus] = useState(false);


  const handleSend = useCallback(() => {
    if (!onSend || message === "") return;
    onSend(message);
    setMessage("");
  }, [onSend, message]);

  useEffect(() => {
    setIsTyping(true);
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [message]);



  return (
    <div
      className="flex flex-col gap-2 border-t border-t-gray-800"
      style={{ height: height }}
    >
      <div className="flex flex-row pt-3 gap-2 items-center relative">

        <textarea
          ref={inputRef}
          className={`w-full text-xs bg-transparent opacity-60 text-gray-300 p-2 pr-6 rounded-sm border-2 border-gray-500 placeholder-gray-300 focus:opacity-100 focus:outline-none focus:border-${accentColor}-700 focus:ring-1 focus:ring-${accentColor}-700`}
          style={{
            paddingLeft: message.length > 0 ? "12px" : "24px",
            resize: "none",
            maxHeight: "6em",
            minHeight: "1.5em",
            overflowY: "auto"
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 96) + "px";
          }}
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setInputHasFocus(true)}
          onBlur={() => setInputHasFocus(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
        />

        <button
          disabled={message.length === 0 || !onSend}
          onClick={handleSend}
          className={`text-xs uppercase text-pink-500 hover:bg-pink-750 p-2 rounded-md ${
            message.length > 0 ? "opacity-100" : "opacity-25"
          } pointer-events-${message.length > 0 ? "auto" : "none"}`}
        >
          Send
        </button>
      </div>
    </div>
  );
};