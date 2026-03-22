'use client';
import React, { useState, useEffect } from 'react';

interface BlurInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
  value: string;
  onUpdate: (newValue: string) => void;
  className?: string;
}

/**
 * An input component that maintains local state while typing 
 * and only triggers an update when focus is lost (onBlur) or Enter is pressed.
 */
export const BlurInput: React.FC<BlurInputProps> = ({
  value,
  onUpdate,
  className = '',
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync with prop when focus is not active
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onUpdate(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
};
