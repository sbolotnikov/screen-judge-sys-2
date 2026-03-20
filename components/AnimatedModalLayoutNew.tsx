'use client';
import { useEffect, useState } from 'react';
import ShowIcon from './svg/showIcon';
import { AnimatePresence, motion } from 'framer-motion';
import sleep from '@/utils/functions';


type Props = {
  children: React.ReactNode;
  visibility: boolean;
  containerClassName?: string;
  onReturn: () => void;
};

export default function AnimateModalLayoutNew({
  visibility,
  onReturn,
  children,
  containerClassName,
}: Props) {
  const [isVisible, setIsVisible] = useState(visibility);
  return (
    <AnimatePresence>
      {isVisible && (
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
          className="blurFilter animatePageMainDiv w-[100vw] h-[100svh] absolute flex flex-col justify-center items-center bg-slate-500/70 left-0 z-[1001]"
        >
          <div
            className={`${containerClassName ? containerClassName : 'blurFilter border-0 rounded-md p-2 mt-2  shadow-2xl w-[95svw]  max-w-[1170px]  flex justify-center items-center flex-col   md:w-[80svw] bg-lightMainBG dark:bg-darkMainBG h-[73svh] md:h-[85svh]'}`}
          >
            <div
              id="wrapperDiv"
              className="w-full h-full relative  p-1  overflow-y-auto border border-lightMainColor dark:border-darkMainColor rounded-md flex flex-col justify-center items-center"
            >
              <button
                className={` flex flex-col justify-center items-center origin-center cursor-pointer z-10 hover:scale-125 absolute top-3 right-3`}
                onClick={() => {
                  setIsVisible(false);
                  sleep(1200).then(() => onReturn());
                }}
              >
                <div className=" h-8 w-8  fill-lightMainColor stroke-lightMainColor dark:fill-darkMainColor dark:stroke-darkMainColor">
                  <ShowIcon icon={'Close'} stroke={'2'} />
                </div>
              </button>
              <div
                id="containedDiv"
                className={`absolute top-0 left-0 flex flex-col w-full p-1 justify-center items-center`}
              >
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
