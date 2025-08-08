import { useState } from 'react';

type EditableNameValueRowProps = {
  name: string;
  value: string;
  valueColor?: string;
  onSave?: (value: string) => void;
};

export const EditableNameValueRow = ({ 
  name, 
  value, 
  valueColor = "gray-500",
  onSave 
}: EditableNameValueRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-gray-500">{name}</span>
      {isEditing ? (
        <input
          className="text-xs bg-transparent border border-gray-800 rounded-sm px-2 py-1 text-white focus:outline-none"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            onSave?.(currentValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              onSave?.(currentValue);
            }
          }}
          autoFocus
        />
      ) : (
        <span 
          className={`text-xs text-${valueColor} cursor-pointer`}
          onClick={() => setIsEditing(true)}
        >
          {currentValue || "-"}
        </span>
      )}
    </div>
  );
};