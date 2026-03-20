'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
// color schemas for different occasions
const variant = {
  danger: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  success: {
    color: '#155724',
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  secondary: {
    color: '#383d41',
    backgroundColor: '#e2e3e5',
    borderColor: '#d6d8db',
  },
  warning: {
    color: '#856404',
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
  },
  info: {
    color: '#0c5460',
    backgroundColor: '#d1ecf1',
    borderColor: '#bee5eb',
  },
  '': {},
};
type AlertType = {
  visibility: boolean;
  styling: {
    variantHead: string;
    heading: string;
    text: string;
    color1: string;
    button1: string;
    color2: string;
    button2: string;
    inputField: string;
  };
  onReturn: (val: string, val2: string | null) => void;
};

export default function AlertMenu(props: AlertType) {
  // main popup alert component
  // DO NOT FORGET TO NAME main tag id="mainPage"

  // const el = document.querySelector('#mainPage');
  const [value, setValue] = useState('');

  const button1Color = Object.values(variant)[
    (Object.keys(variant) as (keyof typeof variant)[] as string[]).indexOf(
      props.styling.color1
    )
  ] as { color: string; backgroundColor: string; borderColor: string };

  const button2Color = Object.values(variant)[
    (Object.keys(variant) as (keyof typeof variant)[] as string[]).indexOf(
      props.styling.color2
    )
  ] as { color: string; backgroundColor: string; borderColor: string };

  useEffect(() => {
    if (props.visibility) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [props.visibility]);

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    e.preventDefault();
    setValue(e.target.value);
  };
  return (
    <AnimatePresence>
      {props.visibility && (
        <motion.div
          initial={{ opacity: 0, x: -600 }}
          transition={{
            ease: 'easeOut',
            duration: 1,
            times: [0, 0.2, 0.5, 0.8, 1],
          }}
          animate={{
            opacity: [0, 1, 1, 1, 1],
            rotateX: ['90deg', '89deg', '89deg', '0deg', '0deg'],
            x: ['-100vw', '0vw', '0vw', '0vw', '0vw'],
          }}
          exit={{
            opacity: [1, 1, 1, 1, 0],
            rotateX: ['0deg', '0deg', '89deg', '89deg', '90deg'],
            x: ['0vw', '0vw', '0vw', '0vw', '-100vw'],
          }}
          className="blurFilter animatePageMainDiv w-[100vw] h-[100svh] fixed flex flex-col justify-center items-center bg-slate-500/70 left-0 z-[1001] top-0"
        >
          <div className="w-[100vw] h-[100svh] absolute flex justify-center items-center left-0 z-[1001]">
            <div className="m-auto  max-w-[600px] bg-gray-200 border-2 border-solid border-gray-400 rounded-md w-[97%] p-2 flex flex-col content-evenly">
              <label
                className="px-1 py-2 border-2 border-solid border-transparent rounded-sm w-full m-1 text-center"
                style={
                  Object.values(variant)[
                    Object.keys(variant).indexOf(props.styling.variantHead)
                  ]
                }
              >
                {props.styling.heading}
              </label>
              <h5
                className="px-1 py-2 border-2 border-solid border-transparent text-light rounded-sm w-full m-1 text-center text-gray-700"
                dangerouslySetInnerHTML={{ __html: props.styling.text }}
              />
              {props.styling.inputField == 'true' && (
                <textarea
                  id="inputField"
                  className="w-full mb-2 rounded-md text-gray-700"
                  onChange={handleChange}
                />
              )}
              {props.styling.color1 !== '' && (
                <button
                  className="px-1 py-2 border-2 border-solid border-transparent rounded-sm w-full m-1 text-center text-gray-700"
                  style={button1Color}
                  onClick={() => {
                    const input1 = document.querySelector(
                      '#inputField'
                    ) as HTMLTextAreaElement | null;
                    props.onReturn(
                      props.styling.button1,
                      value != null ? value : null
                    );
                  }}
                >
                  {props.styling.button1}
                </button>
              )}
              {props.styling.color2 !== '' && (
                <button
                  className="px-1 py-2 border-2 border-solid border-transparent rounded-sm w-full m-1 text-center text-gray-700"
                  style={button2Color}
                  onClick={(e) => {
                    props.onReturn(props.styling.button2, null);
                  }}
                >
                  {props.styling.button2}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
