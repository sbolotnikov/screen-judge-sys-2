'use client';

import AnimateModalLayout from '@/components/AnimateModalLayout';
import React, { useState } from 'react';

interface ColorChoiceModalProps {
  vis: boolean;
  onSelectColor: (color: string) => void;
  onClose: (value: boolean) => void;
}

const ColorChoiceModal: React.FC<ColorChoiceModalProps> = ({
  vis,
  onSelectColor,
  onClose,
}) => {
  const [color, setColor] = useState('#ff0000');

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    setColor(newColor);
    onSelectColor(newColor);
  };

  if (!vis) return null;

  return (
    <AnimateModalLayout
      visibility={vis}
      onReturn={() => {
        setColor('#ff0000');
        onClose(true);
      }}
    >
      <div
        className="w-full h-full relative  p-1  overflow-y-auto border border-lightMainColor dark:border-darkMainColor rounded-md flex flex-col justify-center items-center"
      >
          <div
            id="containedDiv"
            className={`absolute top-0 left-0 flex flex-col w-full p-1 justify-center items-center`}
          > 
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            className="w-full h-24 mb-4"
          /> 
        </div>
        <div className="mt-4 w-full flex justify-center">
          <div
            className="w-16 h-16 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: color }}
          ></div>
        </div>
      </div> 
    </AnimateModalLayout>
  );
};

export default ColorChoiceModal;