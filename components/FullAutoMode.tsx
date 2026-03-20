'use client';
import React, { useEffect, useRef, useState } from 'react';
import ManualImage from './ManualImage';

type Props = {
  seconds: number;
  text1: string;
  compLogo: string;
  videoBG: string;
  titleBarHider: boolean;
  message: string;
  fontSizeTime: number;
  showBackdrop: boolean;
  picsArray: { link: string; dances: string[] }[];
  vidsArray: { link: string; dances: string[] }[];
  onRenewInterval: () => void;
};

const FullAutoMode = ({
  picsArray,
  vidsArray,
  seconds,
  text1,
  compLogo,
  videoBG,
  showBackdrop,
  fontSizeTime,
  titleBarHider,
  onRenewInterval,
}: Props) => {
  const [activePic, setActivePic] = useState(0);
  const [activeVideo, setActiveVideo] = useState(0);
  const [usedPictures, setUsedPictures] = useState<string[]>([]);
  
  const timerIntervalID = useRef<number | null>(null);
  const timerIntervalVideoID = useRef<number | null>(null);
  
  // Use a ref to always have access to the latest state in the timeout callback
  const stateRef = useRef({ usedPictures, picsArray, vidsArray, seconds });
  useEffect(() => {
    stateRef.current = { usedPictures, picsArray, vidsArray, seconds };
  }, [usedPictures, picsArray, vidsArray, seconds]);

  const getValidPictureId = () => {
    const { picsArray: currentPics, usedPictures: currentUsed } = stateRef.current;
    const base = currentPics.length;
    if (base === 0) return 0;

    let currentPictureID = Math.floor(Math.random() * base);
    let index1 = 0;
    
    while (currentUsed.indexOf(currentPics[currentPictureID].link) !== -1 && index1 < base) {
      currentPictureID = Math.floor(Math.random() * base);
      index1++;
    }

    const newLink = currentPics[currentPictureID].link;
    setUsedPictures((prev) => {
      const next = [...prev, newLink];
      if (next.length > 5) next.shift();
      return next;
    });

    return currentPictureID;
  };

  useEffect(() => {
    const interval = Math.max(seconds || 5, 1); // Ensure at least 1s, default 5s
    
    const tickPictures = () => {
      setActivePic(getValidPictureId());
      timerIntervalID.current = window.setTimeout(tickPictures, interval * 1000);
    };

    const tickVideo = () => {
      const { vidsArray: currentVids } = stateRef.current;
      if (currentVids.length > 0) {
        setActiveVideo(Math.floor(Math.random() * currentVids.length));
      }
      timerIntervalVideoID.current = window.setTimeout(tickVideo, interval * 3 * 1000);
    };

    console.log('Starting FullAutoMode loops with interval:', interval);
    
    // Initial calls
    if (picsArray.length > 0) tickPictures();
    if (vidsArray.length > 0) tickVideo();

    onRenewInterval();

    return () => {
      if (timerIntervalID.current) window.clearTimeout(timerIntervalID.current);
      if (timerIntervalVideoID.current) window.clearTimeout(timerIntervalVideoID.current);
    };
  }, [picsArray.length, vidsArray.length, seconds]); // Only restart if arrays length or seconds change
  return (
    <>
      {(picsArray[activePic] !== undefined) && (vidsArray[activeVideo] !== undefined)&&(
        <ManualImage
          image1={picsArray[activePic].link}
          text1={text1}
          compLogo={compLogo}
          fontSizeTime={fontSizeTime}
          videoBG={vidsArray[activeVideo].link}
          showBackdrop={showBackdrop}
          titleBarHider={titleBarHider}
        />
      )}
    </>
  );
};

export default FullAutoMode;