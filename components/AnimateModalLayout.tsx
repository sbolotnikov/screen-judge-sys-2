'use client';
import { useState } from 'react';
import ShowIcon from './svg/showIcon';
import { AnimatePresence, motion } from 'framer-motion';


type Props = {
  children: React.ReactNode;
  visibility:boolean;
  onReturn: () => void;
};

export default function AnimateModalLayout( {visibility,onReturn, children}:Props 
     ) {

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
              <button
                className={` flex flex-col justify-center items-center md:mt-14 origin-center cursor-pointer z-10 hover:scale-125 `}
                onClick={() => {
                  setIsVisible(false);
                  onReturn();
                }}
              >
            <div className=" h-8 w-8 mt-3   fill-darkMainColor stroke-darkMainColor">
              <ShowIcon icon={'Close'} stroke={'2'} />
            </div>
          </button>        
          
           {children}
         
 
        </motion.div>
      )}
    </AnimatePresence>
  );

}