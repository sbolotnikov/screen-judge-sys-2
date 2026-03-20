'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import ChooseVideosModal from '@/components/ChooseVideosModal';
import ShowPlayingModal from '@/components/ShowPlayingModal';
import ColorChoiceModal from '@/components/ColorChoiceModal';
import ChoosePicturesModal from '@/components/ChoosePicturesModal';
import CountBox from '@/components/CountBox';
import usePartySettings from '@/hooks/usePartySettings';
import useComp from '@/hooks/useComp';
import ChooseMessageModal from '@/components/ChooseMessageModal';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '@/hooks/useMongoDb';
import { useSession } from 'next-auth/react';

const db = null;
const db2 = null;
import type { Session } from 'next-auth';
import ChoosePartyModal from '@/components/ChoosePartyModal';
import AlertMenu from '@/components/alertMenu';
import ImgFromDb from '@/components/ImgFromDb';
import PageTableSettings from '@/components/PageTableSettings';
import { getImagesList } from '@/functions/actions';
import CoveredInput from '@/components/CoveredInput';
import { useRouter } from 'next/navigation';
import ParsedHeatEditor from '@/components/ParsedHeatEditor';
import EventsDashboard from '@/components/EventsDashboard';

type Props = Record<string, never>;

type ExtendedSession = Session & {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
};

const Page: React.FC<Props> = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modal1Visible, setModal1Visible] = useState(false);
  const [modal3Visible, setModal3Visible] = useState(false);
  const [modal4Visible, setModal4Visible] = useState(false);
  const [modal5Visible, setModal5Visible] = useState(false);
  const [refreshVar, setRefreshVar] = useState(false);
  const [refreshVar2, setRefreshVar2] = useState(false);
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const router = useRouter();
  const [alertStyle, setAlertStyle] = useState({
    variantHead: '',
    heading: '',
    text: ``,
    color1: '',
    button1: '',
    color2: '',
    button2: '',
    inputField: '',
  });
  const [revealAlert, setRevealAlert] = useState(false);
  const [idToDelete, setIdToDelete] = useState('');
  const [galleryType, setGalleryType] = useState<'auto' | 'manual' | null>(
    null,
  );
  const [galleryArr, setGalleryArr] = useState<
    {
      link: string;
      name: string;
      dances: string[] | null;
    }[]
  >([]);
  const [startPage, setStartPage] = useState(true);
  const [revealCloud, setRevealCloud] = useState(false);
  const [compsArr, setCompsArr] = useState<{ name: string; id: string }[]>([]);
  const [editFirstMessage, setEditFirstMessage] = useState(true);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined;
    if (modalVisible) {
      timerInterval = setInterval(function () {
        setRefreshVar((prev) => !prev);
      }, 1000);
    } else {
      clearInterval(timerInterval);
    }
  }, [modalVisible, refreshVar2]);

  const {
    image,
    name,
    message,
    message2,
    fontSize2,
    mode,
    fontName,
    fontSize,
    fontSizeTime,
    frameStyle,
    displayedPictures,
    displayedPicturesAuto,
    seconds,
    manualPicture,
    displayedVideos,
    videoChoice,
    compLogo,
    titleBarHider,
    showUrgentMessage,
    showTable,
    tablePages,
    tableChoice,
    showHeatNumber,
    heatNum,
    savedMessages,
    textColor,
    colorBG,
    animationSpeed,
    speedVariation,
    particleCount,
    maxSize,
    animationOption,
    rainAngle,
    originX,
    originY,
    showSVGAnimation,
    particleTypes,
    id,
    compChoice,
    showBackdrop,
    setCompID,
    unmuteVideos,
    events,
    eventID,
    selectedDanceId,
    selectedDanceIdJudge
  } = usePartySettings();
  // const { heat } = useComp(compChoice || 'T9FLgtEDmxQFYFTnfrvO');
  const typesSet = [
    'star',
    'kiss',
    'snowflake',
    'heart',
    'tower',
    'LP',
    'maple',
    'rose',
    'diamond',
    'witch',
    'skeleton',
    'zero',
    'pumpkin',
    'clover',
    'streamer',
    'lightning',
    'hydrangea',
    'fred',
    'christmasBall',
  ];
  const reverseColor = (str: string) => {
    console.log(str);
    let n = parseInt(str.slice(1), 16);
    console.log(n);
    let rev = 0;

    // traversing bits of 'n'
    // from the right
    while (n > 0) {
      // bitwise left shift
      // 'rev' by 1
      rev <<= 1;

      // if current bit is '1'
      if ((n & 1) == 1) rev ^= 1;

      // bitwise right shift
      //'n' by 1
      n >>= 1;
    }
    return '#' + rev.toString(16);
  };

  // const videoSearch = async (link: string) => {
  //   try {
  //     const data = await fetch(
  //       'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=' +
  //         link +
  //         '&key=' +
  //         process.env.REACT_APP_FIREBASE_APIKEY,
  //       {
  //         cache: 'no-cache',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );
  //     const res = await data.json();
  //     return res.items;
  //   } catch (error) {
  //     if (error) {
  //       return error;
  //     }
  //   }
  // };

  const handleChange = (
    text:
      | number
      | string
      | boolean
      | object
      | {
          name: string;
          tableRows: string[];
          rowsPictures: string[] | undefined;
          rowsChecked: boolean[];
        }[],
    eventName: string,
  ) => {
    // if (session?.user.role == 'Admin')
    updateDoc(doc(db, 'parties', id), {
      [eventName]: text,
    });
  };

  // const onPressPicture = async (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   // handleChange(picURL, 'image');
  // };
  const toggleParticleType = (type: string) => {
    handleChange(
      particleTypes.includes(type)
        ? particleTypes.filter((t) => t !== type)
        : [...particleTypes, type],
      'particleTypes',
    );
  };
  const fetchConfig = () => {
    fetch('/api/admin/get_env', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });
  };
  const getCompsArray = useCallback(async () => {
    const q = await getDocs(collection(db2, 'competitions'));
    const arr1 = q.docs.map((doc: { data: () => { name: string } }) => doc.data());
    const arr2 = q.docs.map((doc: { id: string }) => doc.id);
    const arr = arr1.map((x: { name: string }, i: number) => ({ name: x.name, id: arr2[i] })) as {
      name: string;
      id: string;
    }[];
    setCompsArr(arr);
    fetchConfig();
    const list1 = await getImagesList();
    console.log('list1', list1);
  }, []);
  useEffect(() => {
    if (!session) {
      router.push('/login');
    } else {
      (async () => {
        await getCompsArray();
      })();
    }
  }, [session, router, getCompsArray]);
  const onReturnAlert = async (decision1: string) => {
    setRevealAlert(false);
    if (decision1 == 'Cancel') {
    }
    if (decision1 == 'Delete Party') {
      await deleteDoc(doc(db, 'parties', idToDelete));
      window.location.reload();
    }
  };

  return (
    <PageWrapper className="absolute top-0 left-0 w-full h-screen flex flex-col items-center justify-start">
      <AlertMenu
        visibility={revealAlert}
        onReturn={onReturnAlert}
        styling={alertStyle}
      />
      <ColorChoiceModal
        onSelectColor={(ret) => {
          console.log(ret);
          handleChange(ret, 'textColor');
          setModal5Visible(false);
        }}
        onClose={() => setModal5Visible(false)}
        vis={modal5Visible}
      />
      <ChooseVideosModal
        videosArray={displayedVideos}
        vis={modal4Visible}
        savedMessages={savedMessages}
        onClose={() => setModal4Visible(false)}
        onReturn={(ret) => {
          if (ret && ret.length > 0) {
            console.log(ret);
            handleChange(ret, 'displayedVideos');
          }
          setModal4Visible(false);
        }}
      />
      {modalVisible && (
        <ShowPlayingModal
          videoUri={videoChoice}
          manualPicture={manualPicture}
          displayedPicturesAuto={displayedPicturesAuto}
          displayedVideos={displayedVideos}
          displayedPictures={displayedPictures}
          image={image}
          button1="Ok"
          compName={name}
          heatNum={''}
          vis={modalVisible}
          mode={mode}
          fontName={fontName}
          message2={message2}
          fontSize2={fontSize2}
          fontSize={fontSize}
          fontSizeTime={fontSizeTime}
          frameStyle={frameStyle}
          seconds={seconds}
          message={message}
          compLogo={compLogo}
          titleBarHider={titleBarHider}
          showUrgentMessage={showUrgentMessage}
          showTable={showTable}
          tablePages={tablePages}
          tableChoice={tableChoice}
          showBackdrop={showBackdrop}
          showHeatNumber={showHeatNumber}
          textColor={textColor}
          colorBG={colorBG}
          animationSpeed={animationSpeed}
          speedVariation={speedVariation}
          heat={heatNum}
          particleCount={particleCount}
          maxSize={maxSize}
          animationOption={animationOption}
          rainAngle={rainAngle}
          originX={originX}
          originY={originY}
          showSVGAnimation={showSVGAnimation}
          particleTypes={particleTypes}
          onReturn={() => setModalVisible(false)}
          onRenewInterval={() => setRefreshVar2(!refreshVar2)}
          unmuteVideos={unmuteVideos}
          events={events}
          eventID={eventID}
          selectedDanceId={selectedDanceId!}
        />
      )}
      {galleryType && (
        <ChoosePicturesModal
          displayPics={galleryArr}
          galleryType={galleryType}
          savedMessages={savedMessages}
          vis={modal3Visible}
          onReturn={(ret) => {
            if (ret && ret.length > 0) {
              if (galleryType === 'auto') {
                handleChange(
                  ret.map((pic) => ({ link: pic.link, name: pic.name })),
                  'displayedPicturesAuto',
                );
              } else {
                handleChange(ret, 'displayedPictures');
              }
            }
            setModal3Visible(false);
          }}
          onClose={() => setModal3Visible(false)}
        />
      )}
      {modal1Visible && (
        <ChooseMessageModal
          savedMessages={savedMessages}
          message={editFirstMessage ? message : message2}
          addPrefix={!editFirstMessage}
          onChange={(text) => {
            console.log(text);
            handleChange(text, editFirstMessage ? 'message' : 'message2');
            setModal1Visible(false);
          }}
          onMessageArrayChange={(array) => {
            console.log(array);
            handleChange(array, 'savedMessages');
          }}
          vis={modal1Visible}
          onClose={() => setModal1Visible(false)}
        />
      )}
      {/* {revealCloud && <ChoosePicture onReturn={onReturnPicture} />} */}

      <div className="blurFilter border-0 rounded-md p-2 shadow-2xl w-[95%] max-w-[850px] max-h-[85%] h-[85%]  md:w-full md:mt-8 bg-lightMainBG/70 dark:bg-darkMainBG/70">
        <div className="w-full h-full flex flex-col justify-center items-center border rounded-md border-lightMainColor dark:border-darkMainColor relative p-2 overflow-auto">
          {/* {session?.user.role == 'Admin' && ( */}
          <div className="absolute top-0 left-0 max-w-fit p-2 flex flex-col justify-start items-center">
            {startPage ? (
              <ChoosePartyModal
                onReturn={(id) => {
                  setStartPage(false);
                  setCompID(id);
                }}
                onAlert={(name, id) => {
                  setIdToDelete(id);
                  setRevealAlert(true);
                  setAlertStyle({
                    variantHead: 'danger',
                    heading: 'Warning',
                    text: `You are about to delete party: ${name}!`,
                    color1: 'danger',
                    button1: 'Delete Party',
                    color2: 'secondary',
                    button2: 'Cancel',
                    inputField: '',
                  });
                }}
              />
            ) : session?.user &&
              ('Admin' === session.user.role ||
                'User' === session.user.role) ? (
              <div>
                <button
                  className="w-[92%] h-48 m-1"
                  onClick={(e) => setRevealCloud(!revealCloud)}
                >
                  {image && image.length > 0 ? (
                    <div className="h-full w-full rounded-md flex justify-center items-center mt-2">
                      <ImgFromDb
                        url={image}
                        stylings="object-contain"
                        alt="Event Picture"
                      />
                    </div>
                  ) : (
                    <div className="h-full w-full flex justify-center items-center">
                      <p>Please click to choose image</p>
                    </div>
                  )}
                </button>
                <CoveredInput
                  value={name}
                  onSubmit={(text: string) => handleChange(text, 'name')}
                  buttonClassName="btnFancy h-9 flex items-center"
                  inputClassName="h-9 w-3/4 bg-white rounded-lg border outline-none border-[#776548] text-[#444] text-left"
                  displayClassName="w-full flex justify-center items-center text-center text-2xl cursor-pointer"
                />
                <div className="w-full flex flex-row justify-center items-center">
                  <div className="flex flex-col justify-center items-center">
                    {mode && (
                      <select
                        value={mode}
                        onChange={(e) => handleChange(e.target.value, 'mode')}
                        className="w-20 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                      >
                        {[
                          'Auto',
                          'Auto Full',
                          'Auto Table',
                          'Default',
                          'Event Results',
                          'Manual',
                          'Video',
                        ].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-center w-20">Choose mode</p>
                  </div>
                  <div className="flex flex-col justify-center items-center ">
                    {fontSize && (
                      <CountBox
                        startValue={fontSize}
                        setWidth={12}
                        name={'fontSize'}
                        onChange={(num) => {
                          console.log(num);
                          if (num < 1) num = 1;
                          handleChange(num, 'fontSize');
                        }}
                      />
                    )}
                    <p className="text-center w-24">Choose font size</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden border-none relative">
                      {textColor && (
                        <input
                          className=" outline-none h-10 w-10  absolute -top-1 -left-1  border-none "
                          name="color"
                          id="color"
                          type="color"
                          value={textColor}
                          onChange={async (e) => {
                            console.log(e.target.value);

                            handleChange(e.target.value, 'textColor');
                          }}
                        />
                      )}
                    </div>
                    <p className="text-center w-8">Text Color</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden border-none relative">
                      {/* {colorBG && ( */}
                      <input
                        className=" outline-none h-10 w-10  absolute -top-1 -left-1  border-none "
                        name="color"
                        id="color"
                        type="color"
                        value={colorBG !== undefined ? colorBG : 'black'}
                        onChange={async (e) => {
                          console.log(e.target.value);

                          handleChange(e.target.value, 'colorBG');
                        }}
                      />
                      {/* )} */}
                    </div>
                    <p className="text-center w-8">Color BG</p>
                  </div>
                  <div className="flex flex-col justify-center items-center">
                    {seconds && (
                      <CountBox
                        startValue={seconds}
                        setWidth={10}
                        name={'secondsLength'}
                        onChange={(num) => {
                          console.log(num);
                          if (num < 1) num = 1;
                          handleChange(num, 'seconds');
                        }}
                      />
                    )}
                    <p className="text-center w-24">Choose seconds/frame</p>
                  </div>
                </div>
                {displayedPictures && manualPicture && (
                  <div className="w-full flex flex-col justify-center items-center">
                    <select
                      value={manualPicture?.name || ''}
                      onChange={(e) => {
                        const selectedPicture = displayedPictures.find(
                          (pic) => pic.name === e.target.value,
                        );
                        if (selectedPicture) {
                          handleChange(
                            {
                              name: selectedPicture.name,
                              link: selectedPicture.link,
                            },
                            'manualPicture',
                          );
                        }
                      }}
                      className="w-60 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                    >
                      {displayedPictures
                        .sort((a, b) => (a.name! > b.name! ? 1 : -1))
                        .map((item, i) => (
                          <option key={item.name+i} value={item.name}>
                            {i+1}. {item.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-center w-48">
                      Choose Picture for manual
                    </p>
                  </div>
                )}
                {titleBarHider !== undefined && (
                  <div className="w-full flex flex-col justify-center items-center">
                    <div className="flex flex-row mb-5">
                      <input
                        type="checkbox"
                        checked={titleBarHider}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'titleBarHider')
                        }
                        className="self-center"
                      />
                      <p className="ml-2">Hide Title Bar</p>
                    </div>
                  </div>
                )}
                {displayedPictures && (
                  <div className="w-full flex flex-col justify-center items-center">
                    <select
                      value={compLogo?.name || ''}
                      onChange={(e) => {
                        const selectedLogo = displayedPictures.find(
                          (pic) => pic.name === e.target.value,
                        );
                        if (selectedLogo) {
                          handleChange(
                            {
                              name: selectedLogo.name,
                              link: selectedLogo.link,
                            },
                            'compLogo',
                          );
                        }
                      }}
                      className="w-60 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                    >
                      {displayedPictures
                        .sort((a, b) => (a.name! > b.name! ? 1 : -1))
                        .map((item, i) => (
                          <option
                            key={item.name+i}
                            value={item.name}
                            className="w-full h-14 flex flex-row justify-between items-center"
                          >
                            {item.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-center w-48">Choose Picture for Logos</p>
                  </div>
                )}
                {displayedVideos && displayedVideos.length > 0 && (
                  <div className="w-full flex flex-col justify-center items-center">
                    <select
                      value={videoChoice.name}
                      onChange={(e) => {
                        const selectedVideo = displayedVideos.find(
                          (video) => video.name === e.target.value,
                        );
                        if (selectedVideo) {
                          handleChange(
                            {
                              name: selectedVideo.name,
                              link: selectedVideo.link,
                            },
                            'videoChoice',
                          );
                        }
                      }}
                      className="w-60 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                    >
                      {displayedVideos
                        .sort((a, b) => (a.name > b.name ? 1 : -1))
                        .map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-center w-48">Choose Video</p>
                  </div>
                )}
                <div className="w-full flex flex-row justify-between items-center">
                  <button
                    className="btnFancy w-20 min-h-20 "
                    style={{ padding: 0, margin: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setGalleryType('manual');
                      if (displayedPictures)
                        setGalleryArr([...displayedPictures]);
                      setModal3Visible(true);
                    }}
                  >
                    <p className="text-center text-sm italic">
                      Choose pictures for manual
                    </p>
                  </button>
                  <button
                    className="btnFancy w-20 min-h-20"
                    style={{ padding: 0, margin: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setGalleryType('auto');
                      if (displayedPicturesAuto)
                        setGalleryArr(
                          displayedPicturesAuto.map((pic) => ({
                            ...pic,
                            dances: null,
                          })),
                        );
                      setModal3Visible(true);
                    }}
                  >
                    <p className="text-center text-sm italic">
                      Choose pictures for auto
                    </p>
                  </button>
                  <button
                    className="btnFancy w-20 min-h-20"
                    style={{ padding: 0, margin: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setModal4Visible(true);
                    }}
                  >
                    <p className="text-center text-sm italic">Choose videos</p>
                  </button>
                  <button
                    className="btnFancy w-20 min-h-20"
                    style={{ padding: 0, margin: 0 }}
                    onClick={(e) => {
                      e.preventDefault();
                      setModalVisible(true);
                    }}
                  >
                    <p className="text-center text-sm italic">Start Show</p>
                  </button>
                </div>
                <div className="w-full flex flex-col justify-center items-center">
                  <div className="w-full flex flex-col justify-center items-center">
                    <select
                      value={fontName}
                      onChange={(e) => handleChange(e.target.value, 'fontName')}
                      className="w-60 h-9 mt-2 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                    >
                      {['Lato', 'DancingScript', 'ChopinScript'].map(
                        (option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ),
                      )}
                    </select>

                    <p className="text-center w-60">Choose message font</p>
                  </div>
                  <button
                    className="btnFancy cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditFirstMessage(true);
                      setModal1Visible(true);
                    }}
                  >
                    <p className="w-full text-center">{message}</p>
                    <p className="text-center italic">Choose message</p>
                  </button>
                  <button
                    className="btnFancy cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditFirstMessage(false);
                      setModal1Visible(true);
                    }}
                  >
                    <p className="w-full text-center">{message2}</p>
                    <p className="text-center italic">Choose second message</p>
                  </button>
                  <div className="w-full flex flex-col justify-center items-center">
                    <div className="flex flex-col justify-center items-center">
                      {fontSize2 && (
                        <CountBox
                          startValue={fontSize2}
                          setWidth={10}
                          name={'fontSize2'}
                          onChange={(num) => {
                            console.log(num);
                            if (num < 1) num = 1;
                            handleChange(num, 'fontSize2');
                          }}
                        />
                      )}
                      <p className="text-center w-24">Font size 2</p>
                    </div>
                  </div>
                </div>
                <div className="w-full flex flex-col justify-center items-center">
                  {showUrgentMessage !== undefined && (
                    <div className="flex flex-row mb-2.5 mt-2.5">
                      <input
                        type="checkbox"
                        checked={showUrgentMessage}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'showUrgentMessage')
                        }
                        className="self-center"
                      />
                      <p className="ml-2">Show Urgent Message</p>
                    </div>
                  )}
                  <div className="flex flex-row mb-2.5 mt-2.5">
                    {showTable !== undefined && (
                      <input
                        type="checkbox"
                        checked={showTable}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'showTable')
                        }
                        className="self-center"
                      />
                    )}
                    <p className="ml-2">Show Table</p>
                  </div>
                  <select
                    value={tableChoice}
                    onChange={(e) => {
                      handleChange(parseInt(e.target.value), 'tableChoice');
                    }}
                    className="w-60 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                  >
                    {tablePages &&
                      tablePages.map((option, i) => (
                        <option key={`TablesRow${i}`} value={i}>
                          {option.name}
                        </option>
                      ))}
                  </select>
                  <PageTableSettings
                    tablePages={tablePages}
                    tableChoice={tableChoice}
                    onTablePageChange={(newValue) => {
                      handleChange(newValue, 'tablePages');
                    }}
                  />

                  <div className="flex flex-row mb-2.5 mt-2.5">
                    {showBackdrop !== undefined && (
                      <input
                        type="checkbox"
                        checked={showBackdrop}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'showBackdrop')
                        }
                        className="self-center"
                      />
                    )}
                    <p className="ml-2">Show backdrop</p>
                  </div>
                  <div className="flex flex-row mb-2.5 mt-2.5">
                    {showHeatNumber !== undefined && (
                      <input
                        type="checkbox"
                        checked={showHeatNumber}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'showHeatNumber')
                        }
                        className="self-center"
                      />
                    )}
                    <p className="ml-2">Show heat number</p>
                  </div>
                  <div className="flex flex-row mb-2.5 mt-2.5">
                    {heatNum !== undefined && (
                      <ParsedHeatEditor
                        str1={heatNum}
                        arrOfOpt={['Heat', 'Solo', 'Pro', 'Awards']}
                        onChange={(value) => {
                          if (value !== heatNum) handleChange(value, 'heatNum');
                        }}
                      />
                    )}
                  </div>
                  <p className="ml-2 text-center w-full">{heatNum}</p>
                  <div className="flex flex-row mb-2.5 mt-2.5">
                    {unmuteVideos !== undefined && (
                      <input
                        type="checkbox"
                        checked={unmuteVideos}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'unmuteVideos')
                        }
                        className="self-center"
                      />
                    )}
                    <p className="ml-2">Unmute Videos</p>
                  </div>

                  <div className="flex flex-row justify-center items-center">
                    <div className="flex flex-col justify-center items-center">
                      {events && (
                        
                        <select
                          value={eventID}
                          onChange={(e) =>
                            handleChange(e.target.value, 'eventID')
                          }
                          className="w-28 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                        >
                          {events.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-center w-20">Choose Dance to show results for</p>
                    </div>
                    {eventID.length>0 && (
                       <div className="flex flex-col m-1">                  
                      <select
              value={selectedDanceId}
              onChange={(e) =>handleChange(e.target.value, 'selectedDanceId')}
              className="block w-32 pl-4 pr-10 py-3 text-base border-stone-300 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-xl border bg-stone-50 font-medium"
            >
              <option value="all">Overall (All Dances)</option>
              {events.filter(event => event.id === eventID)[0].dances.map((dance) => (
                <option key={dance.id} value={dance.id}>
                  {dance.name}
                </option>
              ))}
            </select>
             <p className="text-center w-20">Choose dance to display</p>
</div>
                    )}
                    {eventID.length>0 && (
                      <div className="flex flex-col mb-1">   
                      <select
              value={selectedDanceIdJudge}
              onChange={(e) =>handleChange(e.target.value, 'selectedDanceIdJudge')}
              className="block w-32 pl-4 pr-10 py-3 text-base border-stone-300 focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm rounded-xl border bg-stone-50 font-medium"
            >
              <option value="all">Overall (All Dances)</option>
              {events.filter(event => event.id === eventID)[0].dances.map((dance) => (
                <option key={dance.id} value={dance.id}>
                  {dance.name}
                </option>
              ))}
            </select>
             <p className="text-center w-20">Choose dance to judge</p>
</div>
                    )}
                    {/* <div className="flex flex-col justify-center items-center">
                      {compsArr && (
                        <select
                          value={compChoice}
                          onChange={(e) =>
                            handleChange(e.target.value, 'compChoice')
                          }
                          className="w-28 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                        >
                          {compsArr.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-center w-20">Choose comp</p>
                    </div> */}
                    <div className="flex flex-col justify-center items-center">
                      {fontSizeTime && (
                        <CountBox
                          startValue={fontSizeTime}
                          setWidth={10}
                          name={'fontSizeTime'}
                          onChange={(num) => {
                            console.log(num);
                            if (num < 1) num = 1;
                            handleChange(num, 'fontSizeTime');
                          }}
                        />
                      )}
                      <p className="text-center w-24">Font size time</p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                      {frameStyle && (
                        <select
                          value={frameStyle}
                          onChange={(e) =>
                            handleChange(e.target.value, 'frameStyle')
                          }
                          className="w-28 h-9 bg-white rounded-lg border border-[#776548] text-[#444] text-left"
                        >
                          {[
                            'No frame',
                            'Fire frame',
                            'Running frame',
                            'Glow frame',
                          ].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-center w-20">Choose frame</p>
                    </div>
                  </div>
                  <div className="flex flex-row mb-2.5 mt-2.5">
                    {showSVGAnimation !== undefined && (
                      <input
                        type="checkbox"
                        checked={showSVGAnimation}
                        onChange={(e) =>
                          handleChange(e.target.checked, 'showSVGAnimation')
                        }
                        className="self-center"
                      />
                    )}
                    <p className="ml-2">Show SVG Animation</p>
                  </div>

       
                  {showSVGAnimation && (
                    <div className="w-full flex flex-row flex-wrap mb-2.5">
                      <div className="w-1/2 flex flex-col justify-center items-center p-1">
                        <label>Animation Speed: {animationSpeed}</label>
                        <input
                          className="w-full"
                          type="range"
                          min="1"
                          max="10"
                          value={animationSpeed}
                          onChange={(e) =>
                            handleChange(
                              Number(e.target.value),
                              'animationSpeed',
                            )
                          }
                        />
                      </div>
                      <div className="w-1/2 flex flex-col justify-center items-center p-1">
                        <label>Speed Variation: {speedVariation}</label>
                        <input
                          className="w-full"
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={speedVariation}
                          onChange={(e) =>
                            handleChange(
                              Number(e.target.value),
                              'speedVariation',
                            )
                          }
                        />
                      </div>

                      <div className="w-1/2 flex flex-col justify-center items-center p-1">
                        <label>Particle Count: {particleCount}</label>
                        <input
                          className="w-full"
                          type="range"
                          min="1"
                          max="1000"
                          value={particleCount}
                          onChange={(e) =>
                            handleChange(
                              Number(e.target.value),
                              'particleCount',
                            )
                          }
                        />
                      </div>
                      <div className="w-1/2 flex flex-col justify-center items-center p-1">
                        <label>Max Size: {maxSize}</label>
                        <input
                          className="w-full"
                          type="range"
                          min="1"
                          max="100"
                          value={maxSize}
                          onChange={(e) =>
                            handleChange(Number(e.target.value), 'maxSize')
                          }
                        />
                      </div>
                      <div className="w-full flex flex-col justify-center items-center p-1">
                        <label>Animation Option:</label>
                        <select
                          value={animationOption}
                          onChange={(e) =>
                            handleChange(
                              Number(e.target.value),
                              'animationOption',
                            )
                          }
                        >
                          <option value={1}>Towards Viewer</option>
                          <option value={2}>Away from Viewer</option>
                          <option value={3}>Rain</option>
                          <option value={4}>Storm vortex</option>
                          <option value={5}>Firework</option>
                        </select>
                      </div>
                      {animationOption === 3 && (
                        <div className="w-full flex flex-col justify-center items-center p-1">
                          <label>Rain Angle: {rainAngle}°</label>
                          <input
                            className="w-full"
                            type="range"
                            min="0"
                            max="360"
                            value={rainAngle}
                            onChange={(e) =>
                              handleChange(Number(e.target.value), 'rainAngle')
                            }
                          />
                        </div>
                      )}
                      {(animationOption === 1 || animationOption === 2) && (
                        <>
                          <div className="w-1/2 flex flex-col justify-center items-center p-1">
                            <label>Origin X: {originX}</label>
                            <input
                              className="w-full"
                              type="range"
                              min="0"
                              max="1600"
                              value={originX}
                              onChange={(e) =>
                                handleChange(Number(e.target.value), 'originX')
                              }
                            />
                          </div>
                          <div className="w-1/2 flex flex-col justify-center items-center p-1">
                            <label>Origin Y: {originY}</label>
                            <input
                              className="w-full"
                              type="range"
                              min="0"
                              max="1200"
                              value={originY}
                              onChange={(e) =>
                                handleChange(Number(e.target.value), 'originY')
                              }
                            />
                          </div>
                        </>
                      )}
                      <div style={{ marginTop: '20px' }}>
                        <label className="bg-none">Particle Types:</label>
                        {typesSet
                          .slice()
                          .sort((a, b) => a.localeCompare(b))
                          .map((type) => (
                            <button
                              key={type}
                              onClick={() => toggleParticleType(type)}
                              className={`m-2 rounded p-2 ${
                                particleTypes.includes(type)
                                  ? 'bg-lightblue'
                                  : 'bg-franceBlue'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : session?.user && session.user.role === 'MC' ? (
              <div>
                <p className=" w-full text-[#444] text-4xl capitalize text-center">
                  {name}
                </p>
                <div className="flex flex-row mb-2.5 mt-2.5">
                  {heatNum !== undefined && (
                    <ParsedHeatEditor
                      str1={heatNum}
                      arrOfOpt={['Heat', 'Solo', 'Pro', 'Awards']}
                      onChange={(value) => {
                        if (value !== heatNum) handleChange(value, 'heatNum');
                      }}
                    />
                  )}
                </div>
                <p className="ml-2 text-center w-full">{heatNum}</p>
              </div>
            ) : (
              <> </>
            )}
            {((session?.user && session.user.role === 'Admin') ||
              (session?.user && session.user.role === 'Judge')) &&
              id.length > 0 && <EventsDashboard id={id} />}
          </div>
          {/* )} */}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Page;
