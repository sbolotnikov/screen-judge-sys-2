'use client';

import AnimateModalLayout from '@/components/AnimateModalLayout';
import ShowIcon from '@/components/svg/showIcon'; 
import React, { useState, useEffect } from 'react'; 
import Image from 'next/image';

interface Picture {
    link: string;
    name: string;
    dances:string[] | null;  
}

type Props = {
  displayPics: Picture[];
  savedMessages: string[];
  galleryType: 'manual' | 'auto';
  vis: boolean;
  onReturn: (pictures: Picture[]  ) => void;
  onClose:()=>void;
}

const ChoosePicturesModal: React.FC<Props> = ({
  displayPics,
  savedMessages,
  galleryType,
  vis,
  onReturn,
  onClose
}) => {
  const [displayPictures, setDisplayPictures] = useState<Picture[] >([]);
  const [pictureLink, setPictureLink] = useState('');
  const [pictureLinkType, setPictureLinkType] = useState('Regular link');
  const [pictureText, setPictureText] = useState('');
  const [pictureDances, setPictureDances] = useState<string[] | null>(null);

  useEffect(() => {
    setDisplayPictures(displayPics);
    console.log(displayPics)
  }, [displayPics]);

  const handleSubmit = (submitType: 'Save' | 'Close') => {
    if (submitType === 'Save') {
      onReturn(displayPictures);
    } else {
      onReturn([]);
    }
  };

  const handleAddPicture = () => {
    const newPicture =   { name: pictureText, link: pictureLink, dances:pictureDances } as Picture;
    
    setDisplayPictures([...displayPictures, newPicture]);
    setPictureLink('');
    setPictureText('');
    setPictureDances([]);
  };

  const handleDeletePicture = (index: number) => {
    const newPictures = [...displayPictures];
    newPictures.splice(index, 1);
    setDisplayPictures(newPictures);
  };

  const handlePictureLinkChange = (text: string) => {
    if (pictureLinkType === 'GDrive Link') {
      const id = text.split('/file/d/')[1]?.split('/')[0];
      setPictureLink(`https://drive.google.com/thumbnail?id=${id}&sz=w1000`);
    } else setPictureLink(text)
  };

  if (!vis) return null;

  return (
    <AnimateModalLayout
      visibility={vis}
      onReturn={() => {
        onClose();
      }}
    > 
      <div
        className={`blurFilter border-0 rounded-md p-2 mt-2  shadow-2xl w-[95svw]  max-w-[1170px]  flex justify-center items-center flex-col   md:w-[80svw] bg-lightMainBG dark:bg-darkMainBG h-[70svh] md:h-[85svh]
        }`}
      >
        <div
          id="wrapperDiv"
          className="w-full h-full relative  p-1  overflow-y-auto border border-lightMainColor dark:border-darkMainColor rounded-md flex flex-col justify-center items-center"
        >
          <div
            id="containedDiv"
            className={`absolute top-0 left-0 flex flex-col w-full p-1 justify-center items-center`}
          > 
        <h2 className="text-xl font-bold mb-4">Available pictures</h2>

        <div className="w-full h-28 border border-black p-1 rounded-md overflow-x-auto mb-4">
          <div className="flex flex-wrap items-center justify-start">
            {displayPictures.map((item, i) => (
              <div key={`picturescasting${i}`} className="relative m-1">
                <img 
                  src={ item.link || '/images/backdrop.png'} 
                  alt={galleryType === 'auto' ? `Picture ${i}` : item.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 bg-gray-300 p-1 rounded-sm cursor-pointer"
                  onClick={()=>{
                    setPictureLinkType('Regular link');
                    setPictureLink(item.link);
                    setPictureText(item.name);
                    setPictureDances(item.dances || []);
                  }}
                />
                <button 
                  onClick={() => handleDeletePicture(i)}
                  className="absolute top-0 right-0 fill-alertcolor  stroke-alertcolor  rounded-md border-alertcolor  w-8 h-8"
                >
                  <ShowIcon icon={'Close'} stroke={'2'} />
                </button>
                {galleryType === "manual"  && (
                  <p className="mt-1 text-center max-w-[100px] truncate">{item.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full flex flex-col items-center mb-4">
          <Image 
            src={pictureLink || '/images/backdrop.png'} 
            alt="Preview" 
            width={64}
            height={64}
            className=" bg-gray-300 rounded-sm mb-2"
            unoptimized
          />
          
          <select
            value={pictureLinkType}
            onChange={(e) => setPictureLinkType(e.target.value)}
            className="mb-2 p-2 border border-gray-300 rounded"
          >
            <option value="Regular link">Regular link</option>
            <option value="GDrive Link">GDrive Link</option>
          </select>

          <input
            type="text"
            placeholder="Enter picture link"
            value={pictureLink} 
            onChange={(e) => handlePictureLinkChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />

          {galleryType === "manual" && (
            <input
              type="text"
              placeholder="Enter picture text"
              value={pictureText}
              onChange={(e) => setPictureText(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-2"
            />
          )}
          {galleryType === "manual" && (
                <div>
                  <div>
                    {pictureDances?.toString() || 'No dances selected'}
                  </div>
                <select
                className="w-full p-2 border border-gray-300 rounded mb-2"
                onChange={(e) => {
                  e.preventDefault();
                  const value = e.target.value;
                  const dances = pictureDances ?? [];
                  if (dances.includes(value)) {
                    setPictureDances(dances.filter((item) => item !== value));
                  } else {
                    setPictureDances([...dances, value]);
                  }
                }}
              >
                {savedMessages &&
                  savedMessages.concat('All').sort((a, b) => a.localeCompare(b)).map((item, index) => {
                     return (
                      <option key={'opt' + index} value={item}>
                        {item}
                      </option>
                    );
                  })}
              </select>


              </div>
          )}

          <button
            onClick={handleAddPicture}
            className="w-full bg-purple-800 text-white p-2 rounded hover:bg-purple-700 transition-colors"
          >
            Add Picture
          </button>
        </div>

        <button
          onClick={() => handleSubmit('Save')}
          className="w-full bg-purple-800 text-white p-2 rounded hover:bg-purple-700 transition-colors mb-2"
        >
          Save Changes
        </button>
        <button
          onClick={() => handleSubmit('Close')}
          className="w-full bg-blue-800 text-white p-2 rounded hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
      </div>
    </div>
    </AnimateModalLayout>
  );
};

export default ChoosePicturesModal;