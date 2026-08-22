'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CountBoxProps {
  startValue: number;
  setWidth: number;
  name: string;
  onChange: (value: number) => void;
}

const CountBox: React.FC<CountBoxProps> = ({
  startValue,
  setWidth,
  name,
  onChange,
}) => {
  // Consecutive clicks must not wait for the parent (and Firestore) to re-render.
  const valueRef = useRef(startValue);
  const [value, setValue] = useState(startValue);

  useEffect(() => {
    valueRef.current = startValue;
    // This local value is intentionally synchronized with updates arriving from
    // the parent/Firestore while still supporting immediate consecutive clicks.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(startValue);
  }, [startValue]);

  const updateValue = (newValue: number) => {
    valueRef.current = newValue;
    setValue(newValue);
    onChange(newValue);
  };

  const changeNumber = (increment: number) => {
    updateValue(Math.max(0, valueRef.current + increment));
  };
   
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.valueAsNumber;
    if (Number.isFinite(newValue)) {
      updateValue(Math.max(0, newValue));
    }
  };

  return (
    <div className="flex flex-row justify-center items-center m-2">
      <button
        type="button"
        aria-label={`Decrease ${name}`}
        className="rounded-full bg-[#3D1152] mr-1 w-8 h-8 flex items-center justify-center text-white text-xl font-extrabold hover:bg-[#2A0B3A] transition-colors"
        onClick={() => changeNumber(-1)}
      >
        -
      </button>
      <input
        type="number"
        id={name}
        name={name}
        min={0}
        value={value}
        className={`h-8 w-${setWidth} text-center border border-gray-300 rounded dark:bg-lightMainColor`}
        onChange={handleInputChange}
      />
      <button
        type="button"
        aria-label={`Increase ${name}`}
        className="rounded-full bg-[#3D1152] ml-1 w-8 h-8 flex items-center justify-center text-white text-xl font-extrabold hover:bg-[#2A0B3A] transition-colors"
        onClick={() => changeNumber(1)}
      >
        +
      </button>
    </div>
  );
};

export default CountBox;
