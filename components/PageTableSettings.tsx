import ShowIcon from '@/components/svg/showIcon';
import React from 'react';

type Props = {
  tablePages: { name: string; tableRows: string[]; rowsPictures:string[] | undefined; rowsChecked: boolean[] }[];
  tableChoice: number;
  onTablePageChange: (
    tablePage: { name: string; tableRows: string[]; rowsPictures: string[] | undefined; rowsChecked: boolean[] }[]
  ) => void;
};

const PageTableSettings = ({ tablePages, tableChoice, onTablePageChange }: Props) => {
  return (
    <div className="w-full flex flex-col justify-center items-center">
      <div className="flex w-full flex-col justify-center items-center">
        <div>
          {tablePages && tablePages[tableChoice] !== undefined &&
            // tablePages.map((page, ind) => {
              // return (
                <div
                  key={`tablePage${tableChoice}`}
                  className=" w-full flex flex-col justify-center items-center rounded-md border border-lightMainColor dark:border-darkMainColor my-1"
                >
                  <div className="w-full m-1 flex flex-row justify-center items-center">
                    <input
                      type="text"
                      className="w-64 m-1"
                      defaultValue={tablePages[tableChoice]!==undefined && tablePages[tableChoice].name.length>0?tablePages[tableChoice].name:`Page ${tableChoice+1}`}
                      onBlur={(e) => {
                        e.preventDefault();
                        const newPages = [...tablePages];
                        newPages[tableChoice] = { ...newPages[tableChoice], name: e.target.value };
                        onTablePageChange(newPages);
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const newPages = [...tablePages];
                        newPages.splice(tableChoice, 1);
                        onTablePageChange(newPages);
                      }}
                      className="  fill-alertcolor  stroke-alertcolor  rounded-md border-alertcolor  w-8 h-8 mt-2 hover:scale-110 transition-all duration-150 ease-in-out"
                    >
                      <ShowIcon icon={'Close'} stroke={'2'} />
                    </button>
                  </div>
                  {  tablePages[tableChoice].tableRows.length > 0 &&
                    tablePages[tableChoice].tableRows.map((rowText, index) => {
                      return (
                        <div
                          key={`rowTable${tableChoice}${index}`}
                          className="m-1 w-full flex flex-row justify-center items-center"
                        >
                          {`${index + 1}.`}
                          <input
                            type="checkbox"
                            checked={tablePages[tableChoice].rowsChecked[index]}
                            onChange={(e) => {
                              e.preventDefault();
                              const newPages = [...tablePages];
                              const newChecked = [...newPages[tableChoice].rowsChecked];
                              newChecked[index] = e.target.checked;
                              newPages[tableChoice] = { ...newPages[tableChoice], rowsChecked: newChecked };
                              onTablePageChange(newPages);
                            }}
                            className="m-1"
                          />
                          <div className="w-64 flex flex-col fill-lightMainColor dark:fill-darkMainColor">
                          <input
                            type="text"
                            className="w-64 m-1"
                            defaultValue={rowText}
                            onBlur={(e) => {
                              e.preventDefault();
                              const newPages = [...tablePages];
                              const newRows = [...newPages[tableChoice].tableRows];
                              newRows[index] = e.target.value;
                              newPages[tableChoice] = { ...newPages[tableChoice], tableRows: newRows };
                              onTablePageChange(newPages);
                            }}
                          />
                           <input
                            type="text"
                            className="w-64 m-1"
                            defaultValue={tablePages[tableChoice].rowsPictures ? tablePages[tableChoice].rowsPictures[index] : ''}
                            onBlur={(e) => {
                              e.preventDefault();
                              const newPages = [...tablePages];
                              const newPics = newPages[tableChoice].rowsPictures 
                                ? [...newPages[tableChoice].rowsPictures] 
                                : newPages[tableChoice].tableRows.map(() => "");
                              newPics[index] = e.target.value;
                              newPages[tableChoice] = { ...newPages[tableChoice], rowsPictures: newPics };
                              onTablePageChange(newPages);
                            }}
                          />
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const newPages = [...tablePages];
                              const newRows = [...newPages[tableChoice].tableRows];
                              newRows.splice(index, 1);
                              const newChecked = [...newPages[tableChoice].rowsChecked];
                              newChecked.splice(index, 1);
                              const newPics = newPages[tableChoice].rowsPictures ? [...newPages[tableChoice].rowsPictures] : undefined;
                              if (newPics) newPics.splice(index, 1);
                              newPages[tableChoice] = { 
                                ...newPages[tableChoice], 
                                tableRows: newRows, 
                                rowsChecked: newChecked,
                                rowsPictures: newPics
                              };
                              onTablePageChange(newPages);
                            }}
                            className="  fill-alertcolor  stroke-alertcolor  rounded-md border-alertcolor  w-8 h-8 mt-2 hover:scale-110 transition-all duration-150 ease-in-out"
                          >
                            <ShowIcon icon={'Close'} stroke={'2'} />
                          </button>
                        </div>
                      );
                    })}

                  <button
                    className="btnFancy cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      const newPages = [...tablePages];
                      newPages[tableChoice] = {
                        ...newPages[tableChoice],
                        tableRows: [...newPages[tableChoice].tableRows, ''],
                        rowsChecked: [...newPages[tableChoice].rowsChecked, false],
                        rowsPictures: newPages[tableChoice].rowsPictures ? [...newPages[tableChoice].rowsPictures, ''] : undefined
                      };
                      onTablePageChange(newPages);
                    }}
                  >
                    <p className="text-center italic">Add Row</p>
                  </button>
                </div>
              // );
            // }
            // )
            }
        </div>
        <button
          className="btnFancy cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            console.log(tablePages);
            tablePages
              ? onTablePageChange([
                  ...tablePages,
                  { name: 'New page', tableRows: [''], rowsPictures: [""], rowsChecked: [false] },
                ])
              : onTablePageChange([
                  { name: 'New page', tableRows: [''], rowsPictures: [""], rowsChecked: [false] },
                ]);
          }}
        >
          <p className="text-center italic">Add Page</p>
        </button>
      </div>
    </div>
  );
};

export default PageTableSettings;
