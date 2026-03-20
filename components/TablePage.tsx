'use client';
import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AnimatedTextMessage from '@/components/AnimatedTextMessage';
import Image from 'next/image';
type Props = {
  tablePages: { name: string; tableRows: string[];rowsPictures: string[] | undefined; rowsChecked: boolean[] }[];
  tableChoice: number;
  fontSize: number;
  fontSize2: number;
  colorBG: string;
  textColor: string;
  fontName: string;
  picture1: string;
  picture2: string;
};

const TablePage = ({
  tablePages,
  tableChoice,
  fontSize,
  fontSize2,
  colorBG,
  textColor,
  fontName,
  picture1,
  picture2
}: Props) => {
  const [choosenRow, setChoosenRow] = useState<number>(-1);
  const [delayShow, setDelayShow] = useState<number>(0);

  const [prevTableChoice, setPrevTableChoice] = useState(tableChoice);
  const [prevRowsChecked, setPrevRowsChecked] = useState(tablePages[tableChoice].rowsChecked);

  const rowsText = tablePages[tableChoice].tableRows;
  const rowsChecked = tablePages[tableChoice].rowsChecked;

  if (tableChoice !== prevTableChoice) {
    setPrevTableChoice(tableChoice);
    setPrevRowsChecked(rowsChecked);
    setDelayShow(0);
  } else if (rowsChecked !== prevRowsChecked) {
    let newChoosenRow = -1;
    for (let i = 0; i < rowsChecked.length; i++) {
      if (rowsChecked[i] && !prevRowsChecked?.[i]) {
        newChoosenRow = i;
        break;
      }
    }
    setPrevRowsChecked(rowsChecked);
    setDelayShow(8000);
    if (newChoosenRow !== -1) {
      setChoosenRow(newChoosenRow);
    }
  }

  useEffect(() => {
    if (choosenRow !== -1) {
      const timer = setTimeout(() => {
        setChoosenRow(-1);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [choosenRow]);
  return (
    <AnimatePresence >
    <div className="w-full h-full  inset-0 absolute ">
      <div className="w-full h-full flex flex-col justify-center items-center relative">
        <div
          className={`w-[97%] blurFilter h-1/6 mt-5 flex justify-centeritems-center border-0 shadow-xl relative`} 
        >
            <AnimatedTextMessage
                  text={tablePages[tableChoice].name}
                  duration={4}
                  delay={0}
                  height={fontSize*1.8 + 'px'}
                  name={fontName}
                  width={'100%'}
                  stroke={1}
                  color={textColor}
                  cutdelay={false}
                  rotate={true}
                />
            <Image src={picture2 || '/images/backdrop.png'} width={200} height={100} className="h-[95%] w-auto absolute top-4 left-0" alt="Company Logo" unoptimized />    
                 
        </div>
        <div className={`w-full h-5/6 flex flex-wrap flex-col justify-center ${rowsText.length>6?'items-start':'items-center '}`}
        
        >
          {rowsText.map((rowText, index) => {
            return (
              <div
                key={`row${index}`}
                className={`blurFilter mx-5 my-1 max-w-1/2   rounded-md  border-0 shadow-xl transition duration-[800] ease-in-out ${
                  rowsChecked[index] ? 'opacity-100' : 'opacity-0'
                }`}
                style={{transitionDelay: `${delayShow}ms`}}
              >
                <p className="text-shadow" style={{ fontSize:rowsText.length>6?fontSize2*0.9:fontSize2, color: textColor }}>
                  {rowText}
                </p>
              </div>
            );
          })}
        </div>
        {choosenRow !== -1 && (
            <div className={`absolute   top-1/2 left-1/2 `} style={{ fontSize: fontSize2*2, color: textColor,
                transform: 'translate(-50%, -50%)'
               }}>
            <motion.div
              initial={{ opacity: 0, x: -600 }}
              transition={{
                ease: 'easeOut',
                duration: 9,
                times: [0,0.1, 0.2,0.3, 0.4,0.5,0.6,0.8,0.9, 1],
              }}
              animate={{
                opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                rotateX: ['90deg', '89deg', '0deg', '0deg', '0deg', '0deg', '0deg', '0deg', '89deg', '90deg'],
                x: ['-100vw', '0vw', '0vw', '0vw', '0vw', '0vw', '0vw', '0vw', '0vw', '-100vw'],
              }}
              exit={{
                opacity: [1, 1, 1, 1, 0],
                rotateX: ['0deg', '0deg', '89deg', '89deg', '90deg'],
                x: ['0vw', '0vw', '0vw', '0vw', '-100vw'],
              }}
               className={`w-[1000px] h-[768px] blurFilter p-1 m-1 rounded-md flex flex-col items-center justify-center  border border-[${textColor}] `}
              // style={{ backgroundImage: `url(${tablePages[tableChoice].rowsPictures && tablePages[tableChoice].rowsPictures[choosenRow]?tablePages[tableChoice].rowsPictures[choosenRow]:""})`, backgroundSize: 'contain', backgroundPosition: 'center', boxShadow: '0 30px 40px rgba(0,0,0,.1)',
              //   backgroundRepeat: 'no-repeat', }}
             
            >
              {(tablePages[tableChoice].rowsPictures && tablePages[tableChoice].rowsPictures[choosenRow])? (
                <Image
                  src={tablePages[tableChoice].rowsPictures[choosenRow]}
                  width={800}
                  height={600}
                  className={`h-[80%] w-auto`}
                  alt={`Picture ${choosenRow}`}
                  unoptimized
                />
              ):<Image
              src={picture1 || '/images/backdrop.png'}
              width={800}
              height={600}
              className={`h-[80%] w-auto`}
              alt={`Picture ${choosenRow}`}
              unoptimized
            />}
                {rowsText[choosenRow] &&<AnimatedTextMessage
                  text={rowsText[choosenRow]}
                  duration={4}
                  delay={1}
                  height={fontSize * 2 + 'px'}
                  name={fontName}
                  width={'100%'}
                  stroke={1}
                  color={textColor}
                  cutdelay={false}
                  rotate={false}
                />} 
            </motion.div> 
            </div>
        )}
      </div>
    </div>
    </AnimatePresence>
  );
};
export default TablePage;

