'use client';
import React, { useState, useEffect } from 'react';

interface CoveredInputProps {
  value: string;
  onSubmit: (newValue: string) => void;
  inputClassName?: string;
  buttonClassName?: string;
  displayClassName?: string;
}

const CoveredInput: React.FC<CoveredInputProps> = ({
  value,
  onSubmit,
  inputClassName = 'border rounded px-2 py-1',
  buttonClassName = 'bg-blue-500 text-white rounded px-4 py-1 ml-2',
  displayClassName = 'cursor-pointer',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className='w-full flex justify-between items-center' >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={inputClassName}
          autoFocus
          onBlur={() => {
            // Optional: exit editing mode when input loses focus
            onSubmit(inputValue);
            setIsEditing(false);
          }}
        />
        <button type="submit" className={buttonClassName}>
          Submit
        </button>
      </form>
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className={displayClassName}>
      {value || 'Click to edit'}
    </div>
  );
};

export default CoveredInput;
