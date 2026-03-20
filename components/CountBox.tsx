'use client';

import React, { useEffect } from 'react';
 

interface CountBoxProps {
  startValue: number;
  setWidth: number;
  name:string;
  onChange: (value: number) => void;
}

const CountBox: React.FC<CountBoxProps> = ({ startValue, setWidth, name, onChange }) => {
 
  const changeNumber = (isAdd: boolean) => {
    const increment = isAdd ? 1 : startValue > 0 ? -1 : 1;
    const newValue = startValue + increment;
    onChange(newValue);
  };
   
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue =e.target.valueAsNumber;
    if (!isNaN(newValue)) { 
      onChange(newValue);
    }
  };
   useEffect(() => {
     const inputElement = document.getElementById(name) as HTMLInputElement;
     if (inputElement) {
       inputElement.valueAsNumber = startValue;
     }
   }, [startValue]);  return (
    <div className="flex flex-row justify-center items-center m-2">
      <button
        className="rounded-full bg-[#3D1152] mr-1 w-8 h-8 flex items-center justify-center text-white text-xl font-extrabold hover:bg-[#2A0B3A] transition-colors"
        onClick={() => changeNumber(false)}
      >
        -
      </button>
      {startValue &&<input
        type="number"
        id={name}
        className={` h-8 w-${setWidth} text-center border border-gray-300 rounded dark:bg-lightMainColor`}
        onBlur={handleInputChange} 
      />}
      <button
        className="rounded-full bg-[#3D1152] ml-1 w-8 h-8 flex items-center justify-center text-white text-xl font-extrabold hover:bg-[#2A0B3A] transition-colors"
        onClick={() => changeNumber(true)}
      >
        +
      </button>
    </div>
  );
};

export default CountBox;