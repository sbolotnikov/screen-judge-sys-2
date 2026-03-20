'use client';

import { useEffect, useMemo, useState } from 'react';
import CountBox from './CountBox';

type ParsedStringEditorProps = {
  str1: string;
  arrOfOpt: string[];
  onChange?: (value: string) => void;
};

type ParsedResult = {
  selectedOption: string;
  numberValue: string;
  tailText: string;
};

function parseString(str1: string, arrOfOpt: string[]): ParsedResult {
  const trimmed = str1.trimStart();

  // Prefer the longest matching option first
  const sortedOptions = [...arrOfOpt].sort((a, b) => b.length - a.length);

  let matchedOption = '';
  let rest = trimmed;

  for (const option of sortedOptions) {
    if (trimmed.startsWith(option)) {
      matchedOption = option;
      rest = trimmed.slice(option.length);
      break;
    }
  }

  rest = rest.trimStart();

  // Find number immediately after the matched option
  const numberMatch = rest.match(/^(\d+)/);

  let numberValue = '';
  let tailText = rest;

  if (numberMatch) {
    numberValue = numberMatch[1];
    tailText = rest.slice(numberValue.length).trimStart();
  }

  return {
    selectedOption: matchedOption,
    numberValue,
    tailText,
  };
}

function buildString(
  selectedOption: string,
  numberValue: string,
  tailText: string,
): string {
  const parts: string[] = [];

  if (selectedOption) parts.push(selectedOption);
  if (numberValue !== '') parts.push(numberValue);
  if (tailText.trim() !== '') parts.push(tailText.trim());

  return parts.join(' ');
}

export default function ParsedHeatEditor({
  str1,
  arrOfOpt,
  onChange,
}: ParsedStringEditorProps) {
  const parsed = useMemo(() => parseString(str1, arrOfOpt), [str1, arrOfOpt]);

  const [selectedOption, setSelectedOption] = useState(parsed.selectedOption);
  const [numberValue, setNumberValue] = useState(parsed.numberValue);
  const [tailText, setTailText] = useState(parsed.tailText);

  // useEffect(() => {
    
  //   console.log("option changed '", selectedOption, "'");
  //   if (selectedOption === "") {
  //       setSelectedOption("");
  //       onChange?.("");
  //   }else onChange?.(selectedOption)

  // }, [selectedOption]);

  return (
    <div className="flex flex-row w-full">
      <label className="flex flex-col justify-center items-center w-1/3">
        Option:
        <select
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)}
          onBlur={() =>
            onChange?.(buildString(selectedOption, numberValue, tailText))
          }
          className="w-full h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
        >
          <option value="">Select option</option>
          {arrOfOpt.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col justify-center items-centerw-1/3">
        Number:
        <CountBox
          startValue={numberValue !== '' ? parseInt(numberValue) : 0}
          setWidth={20}
          name={'heat number'}
          onChange={(num) => {
            console.log(num);
            setNumberValue(num.toString());
            onChange?.(buildString(selectedOption, num.toString(), tailText));
          }}
        />
      </label>

      <label className="flex flex-col items-center justify-center w-1/3">
        Text:
        <input
          type="text"
          value={tailText}
          onChange={(e) => setTailText(e.target.value)}
          onBlur={() =>
            onChange?.(buildString(selectedOption, numberValue, tailText))
          }
          className="w-full h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
        />
      </label>

      {/* <label>
        Result:
        <input
          type="text"
          value={combinedValue}
          readOnly
          style={{ display: "block", width: "100%", marginTop: "4px" }}
        />
      </label> */}
    </div>
  );
}
