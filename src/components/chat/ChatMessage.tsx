type ChatMessageProps = {
  message: string;
  accentColor: string;
  name: string;
  isSelf: boolean;
  hideName?: boolean;
};

export const ChatMessage = ({
  name,
  message,
  accentColor,
  isSelf,
  hideName,
}: ChatMessageProps) => {
  // Simple markdown parser for bold text
  const renderMessage = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Bold text with underline for headers
        return (
          <span key={index} className="font-bold text-base underline decoration-2 underline-offset-4">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col gap-1 px-4 ${hideName ? "pt-0" : "pt-4"}`}>
      {!hideName && (
        <div
          className={`text-${
            isSelf ? "gray-700" : accentColor + "-800 text-ts-" + accentColor
          } uppercase text-xs`}
        >
          {name}
        </div>
      )}
      <div
        className={`text-${
          isSelf ? "gray-300" : accentColor + "-600"
        } text-sm whitespace-pre-line ${
          isSelf ? "" : "font-semibold"
        }`}
      >
        {renderMessage(message)}
      </div>
    </div>
  );
};