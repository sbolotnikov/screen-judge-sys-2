import { useEffect, useState, useCallback } from 'react';
import { save_Template } from '@/functions/functions';
import { useSession } from 'next-auth/react';
import { TablePage } from '@/types/types';

// Extend the session user type to include role
interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

type Props = {
  onReturn: (str: string) => void;
  onAlert: (name: string, id: string) => void;
};
type PartyType = {
  image: string;
  name: string;
  message: string;
  mode: string;
  fontSize: number;
  fontSize2: number;
  fontSizeTime: number;
  frameStyle: string;
  colorBG: string;
  showTable: boolean;
  showHeatNumber: boolean;
  displayedPictures: { link: string; name: string; dances: string[] }[];
  displayedVideos: {
    name: string;
    image: string;
    link: string;
    dances: string[];
  }[];
  videoChoice: { link: string; name: string };
  compLogo: { link: string; name: string };
  titleBarHider: boolean;
  showUrgentMessage: boolean;
  showSVGAnimation: boolean;
  displayedPicturesAuto: { link: string; name: string }[];
  seconds: number;
  manualPicture: { link: string; name: string };
  savedMessages: string[];
  textColor: string;
  id: string;
  animationSpeed: number;
  speedVariation: number;
  particleCount: number;
  maxSize: number;
  animationOption: number;
  rainAngle: number;
  originX: number;
  originY: number;
    heatNum: string;
    unmuteVideos: boolean;
  particleTypes: string[];
  tablePages: TablePage[];
};
const ChoosePartyModal = ({ onReturn, onAlert }: Props) => {
  const { data: session } = useSession();
  const [parties, setParties] = useState<PartyType[]>([]);
  const [choosenParties, setChoosenParties] = useState<string[]>([]);
  const [visibleInput, setVisibleInput] = useState(false);
  const [partyName, setPartyName] = useState<string>('');

  const getPartyArray = useCallback(async () => {
    if (!session?.user?.email) {
      console.log('No user session found');
      return;
    }

    try {
      // Use the new party access function
      const response = await fetch(`/api/party-access?userEmail=${encodeURIComponent(session.user.email)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accessible parties');
      }
      const data = await response.json();
      const accessibleParties = data.parties || [];

      const formattedParties = accessibleParties.map((party: Record<string, unknown>) => ({
        ...party,
        // Ensure all required PartyType fields are present with defaults
        image: (party.image as string) || '',
        name: (party.name as string) || '',
        message: (party.message as string) || '',
        mode: (party.mode as string) || 'Default',
        fontSize: (party.fontSize as number) || 10,
        fontSize2: (party.fontSize2 as number) || 10,
        fontSizeTime: (party.fontSizeTime as number) || 10,
        frameStyle: (party.frameStyle as string) || 'No frame',
        heatNum: (party.heatNum as string) || 'Heat 1',
        colorBG: (party.colorBG as string) || '#FFFFFF',
        unmuteVideos: (party.unmuteVideos as boolean) || false,
        displayedPictures:
          (party.displayedPictures as {
            link: string;
            name: string;
            dances: string[];
          }[]) || [],
        displayedVideos:
          (party.displayedVideos as {
            name: string;
            image: string;
            link: string;
            dances: string[];
          }[]) || [],
        videoChoice: (party.videoChoice as { link: string; name: string }) || {
          link: '',
          name: '',
        },
        compLogo: (party.compLogo as { link: string; name: string }) || {
          link: '',
          name: '',
        },
        titleBarHider: (party.titleBarHider as boolean) || false,
        showUrgentMessage: (party.showUrgentMessage as boolean) || false,
        showSVGAnimation: (party.showSVGAnimation as boolean) || false,
        displayedPicturesAuto:
          (party.displayedPicturesAuto as { link: string; name: string }[]) ||
          [],
        seconds: (party.seconds as number) || 5,
        manualPicture: (party.manualPicture as {
          link: string;
          name: string;
        }) || { link: '', name: '' },
        savedMessages: (party.savedMessages as string[]) || [],
        textColor: (party.textColor as string) || '#000000',
        animationSpeed: (party.animationSpeed as number) || 3,
        speedVariation: (party.speedVariation as number) || 0.4,
        particleCount: (party.particleCount as number) || 100,
        maxSize: (party.maxSize as number) || 20,
        animationOption: (party.animationOption as number) || 0,
        rainAngle: (party.rainAngle as number) || 0,
        originX: (party.originX as number) || 400,
        originY: (party.originY as number) || 400,
        particleTypes: (party.particleTypes as string[]) || [],
        tablePages: (party.tablePages as TablePage[]) || [],
        showTable: (party.showTable as boolean) || false,
        showHeatNumber: (party.showHeatNumber as boolean) || false,
        showBackdrop: (party.showBackdrop as boolean) || false,
      })) as PartyType[];

      if (formattedParties.length > 0) {
        setChoosenParties([formattedParties[0].id]);
      }
      setParties(formattedParties);
    } catch (error) {
      console.error('Error loading accessible parties:', error);
      // Fallback to old method if needed
      await getPartyArrayFallback();
    }
  }, [session?.user?.email]);

  // Fallback method (original implementation)
  async function getPartyArrayFallback() {
    try {
      const response = await fetch('/api/mongo/parties');
      if (!response.ok) {
        throw new Error('Failed to fetch parties');
      }
      const data = await response.json();
      
      const arr = data.map((x: { _id: string; [key: string]: unknown }) => ({ ...x, id: x._id })) as PartyType[];
      arr.sort((a, b) => a.name.localeCompare(b.name));

      if (arr.length > 0) {
        setChoosenParties([arr[0].id]);
      }
      setParties(arr);
    } catch (error) {
      console.error('Error fetching parties fallback:', error);
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      getPartyArray();
    }
  }, [session?.user?.email, getPartyArray]); // Include getPartyArray dependency

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    const file1 = e.currentTarget.files![0];

    const reader = new FileReader();
    reader.onload = (function () {
      return async function () {
        const res = this.result?.toString();
        const resObj = JSON.parse(res !== undefined ? res : '');
        delete resObj.id;

        try {
          const response = await fetch('/api/mongo/parties', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resObj),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create party');
          }
          
          const data = await response.json();

          // Grant access to all users for the loaded party
          await fetch('/api/party-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partyId: data.id, addAllUsers: true }),
          });

          console.log('Party loaded and access granted to all users');
          location.reload();
        } catch (error) {
          console.error('Error loading party:', error);
        }
      };
    })();
    reader.readAsText(file1);
  };

  return (
    <div className="w-full flex flex-col justify-center items-center">
      <select
        multiple
        className="w-full md:w-3/4 p-2 h-48 border border-gray-300 rounded mb-4 overflow-y-auto"
        name="parties"
        id="parties"
        value={choosenParties}
        onChange={(e) => {
          const values = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          setChoosenParties(values);
        }}
      >
        {parties.map((party, index) => {
          return (
            <option
              key={index}
              value={party.id}
              className="text-lightMainColor bg-lightMainBG dark:text-darkMainColor dark:bg-darkMainBG p-1"
            >
              {party.name}
            </option>
          );
        })}
      </select>
      {choosenParties.length > 0 && (
        <div className="w-full flex flex-row flex-wrap justify-center items-center">
          <button
            className="btnFancy"
            onClick={() => {
              // If multiple are selected, we pick the first one
              onReturn(choosenParties[0]);
            }}
          >
            Use {choosenParties.length > 1 ? `(${choosenParties.length})` : ''}
          </button>
          <button
            className="btnFancy"
            onClick={() => {
              choosenParties.forEach((id) => {
                const party = parties.find((p) => p.id === id);
                if (party) {
                  save_Template(JSON.stringify(party), 'party_' + id);
                }
              });
            }}
          >
            Save {choosenParties.length > 1 ? `(${choosenParties.length})` : ''}
          </button>

          <button
            className="btnFancy"
            onClick={() => {
              // Only handle the first one for delete as onAlert shows a modal
              const firstId = choosenParties[0];
              const party = parties.find((p) => p.id === firstId);
              if (party) {
                onAlert(party.name, firstId);
              }
            }}
          >
            Delete {choosenParties.length > 1 ? `(Selected: ${choosenParties.length})` : ''}
          </button>
        </div>
      )}
      <div className="w-full flex flex-row flex-wrap justify-center items-center">
        <button
          className="btnFancy"
          onClick={() => document.getElementById('inputField2')!.click()}
        >
          Load Party
        </button>
        <input
          type="file"
          id="inputField2"
          hidden
          accept="text/*"
          className="w-full mb-2 rounded-md text-gray-700"
          onChange={handleChange}
        />
        <button
          className="btnFancy"
          onClick={(e) => {
            e.preventDefault();
            setVisibleInput(!visibleInput);
          }}
        >
          Create Party
        </button>
        {visibleInput && (
          <div className="w-full flex flex-col gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <input
              type="text"
              value={partyName}
              placeholder="Enter party name"
              className="w-full p-2 border border-gray-300 rounded"
              onChange={(e) => {
                e.preventDefault();
                setPartyName(e.target.value);
              }}
            />

            {/* Admin-only section copying options */}
            {(session?.user as ExtendedUser)?.role === 'Admin' &&
              parties.length > 0 && (
                <div className="w-full border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Copy sections from existing parties (Admin only):
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* displayedPictures */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Pictures:</label>
                      <select
                        multiple
                        data-section="displayedPictures"
                        className="w-full p-1 text-xs border border-gray-300 rounded h-24 overflow-y-auto"
                      >
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.displayedPictures.length} pics)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* displayedVideos */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Videos:</label>
                      <select
                        multiple
                        data-section="displayedVideos"
                        className="w-full p-1 text-xs border border-gray-300 rounded h-24 overflow-y-auto"
                      >
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.displayedVideos.length} videos)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* displayedPicturesAuto */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Auto Pictures:</label>
                      <select
                        multiple
                        data-section="displayedPicturesAuto"
                        className="w-full p-1 text-xs border border-gray-300 rounded h-24 overflow-y-auto"
                      >
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.displayedPicturesAuto.length}{' '}
                            auto pics)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* savedMessages */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Messages:</label>
                      <select
                        multiple
                        data-section="savedMessages"
                        className="w-full p-1 text-xs border border-gray-300 rounded h-24 overflow-y-auto"
                      >
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.savedMessages.length} messages)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* tablePages */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold">Table Pages:</label>
                      <select
                        multiple
                        data-section="tablePages"
                        className="w-full p-1 text-xs border border-gray-300 rounded h-24 overflow-y-auto"
                      >
                        {parties.map((party) => (
                          <option key={party.id} value={party.id}>
                            {party.name} ({party.tablePages.length} tables)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

            <button
              className="btnFancy"
              onClick={async (e) => {
                e.preventDefault();
                setVisibleInput(!visibleInput);
                console.log('submit');

                // Get selected values from admin dropdowns
                const copiedData: Partial<PartyType> = {};

                if ((session?.user as ExtendedUser)?.role === 'Admin') {
                  const selects = document.querySelectorAll(
                    'select[data-section]'
                  ) as NodeListOf<HTMLSelectElement>;

                  // Use Maps/Sets to deduplicate items by their unique identifiers (usually link, name or id)
                  const picturesMap = new Map();
                  const videosMap = new Map();
                  const autoPicturesMap = new Map();
                  const messagesSet = new Set<string>();
                  const tablesMap = new Map();

                  selects.forEach((select) => {
                    const section = select.dataset.section;
                    const selectedPartyIds = Array.from(select.selectedOptions)
                      .map((opt) => (opt as HTMLOptionElement).value)
                      .filter((val) => val !== '');

                    if (selectedPartyIds.length > 0 && section) {
                      selectedPartyIds.forEach((selectedPartyId) => {
                        const sourceParty = parties.find(
                          (p) => p.id === selectedPartyId
                        );
                        if (sourceParty) {
                          switch (section) {
                            case 'displayedPictures':
                              sourceParty.displayedPictures.forEach((p) =>
                                picturesMap.set(p.link, p)
                              );
                              break;
                            case 'displayedVideos':
                              sourceParty.displayedVideos.forEach((v) =>
                                videosMap.set(v.link, v)
                              );
                              break;
                            case 'displayedPicturesAuto':
                              sourceParty.displayedPicturesAuto.forEach((p) =>
                                autoPicturesMap.set(p.link, p)
                              );
                              break;
                            case 'savedMessages':
                              sourceParty.savedMessages.forEach((m) =>
                                messagesSet.add(m)
                              );
                              break;
                            case 'tablePages':
                              sourceParty.tablePages.forEach((t) =>
                                tablesMap.set(t.id || t.name, t)
                              );
                              break;
                          }
                        }
                      });
                    }
                  });

                  if (picturesMap.size > 0)
                    copiedData.displayedPictures = Array.from(
                      picturesMap.values()
                    );
                  if (videosMap.size > 0)
                    copiedData.displayedVideos = Array.from(videosMap.values());
                  if (autoPicturesMap.size > 0)
                    copiedData.displayedPicturesAuto = Array.from(
                      autoPicturesMap.values()
                    );
                  if (messagesSet.size > 0)
                    copiedData.savedMessages = Array.from(messagesSet);
                  if (tablesMap.size > 0)
                    copiedData.tablePages = Array.from(tablesMap.values());
                }

                const resObj = {
                  image: '',
                  name: partyName,
                  message: '',
                  mode: 'Default',
                  fontSize: 10,
                  fontSizeTime: 10,
                  frameStyle: 'No frame',
                  displayedPictures: copiedData.displayedPictures || [],
                  displayedVideos: copiedData.displayedVideos || [],
                  videoChoice: { link: '', name: '' },
                  compLogo: { link: '', name: '' },
                  titleBarHider: false,
                  showUrgentMessage: false,
                  showHeatNumber: false,
                  showSVGAnimation: true,
                  displayedPicturesAuto: copiedData.displayedPicturesAuto || [],
                  seconds: 5,
                  manualPicture: { link: '', name: '' },
                  savedMessages: copiedData.savedMessages || [
                    ' ',
                    'Argentine Tango',
                    'Bachata',
                    'Cha Cha',
                    'Foxtrot',
                    'Happy Birthday, Paul!',
                    'Hustle',
                    'Jive',
                    'Mambo',
                    'Merengue',
                    'POLKA',
                    'Paso Doble',
                    'Quickstep',
                    'Rumba',
                    'Salsa',
                    'Samba',
                    'Swing',
                    'Tango',
                    'Two Step',
                    'Viennese Waltz',
                    'Waltz',
                    'West Coast Swing',
                  ],
                  textColor: '#000000',
                  animationSpeed: 3,
                  speedVariation: 0.4,
                  particleCount: 100,
                  maxSize: 20,
                  animationOption: 0,
                  rainAngle: 0,
                  originX: 400,
                  originY: 400,
                  heat: '',
                  heatNum: 'Heat 1',
                  unmuteVideos: false,
                  colorBG: '#FFFFFF',
                  showTable: false,
                  
                  showBackdrop: false,
                  particleTypes: [],
                  tablePages: copiedData.tablePages || [],
                };

                try {
                  const response = await fetch('/api/mongo/parties', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(resObj),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to create party');
                  }
                  
                  const data = await response.json();

                  // Grant access to all users for the new party
                  await fetch('/api/party-access', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partyId: data.id, addAllUsers: true }),
                  });

                  console.log('Party created and access granted to all users');
                  location.reload();
                } catch (error) {
                  console.error('Error creating party:', error);
                }
              }}
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoosePartyModal;
