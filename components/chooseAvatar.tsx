'use client'
import { useEffect, useState } from "react"
// import { uploadImage } from "@/utils/picturemanipulation";

// color schemas for different occasions 
const variant = {
  'danger': {
    'color': '#721c24',
    'backgroundColor': '#f8d7da',
    'borderColor': '#f5c6cb'
    
  },
  'success': {
    'color': '#155724',
    'backgroundColor': '#d4edda',
    'borderColor': '#c3e6cb'
   },
   'secondary': {
    'color': '#383d41',
    'backgroundColor': '#e2e3e5',
    'borderColor': '#d6d8db'
  },
  'warning': {
    'color': '#856404',
    'backgroundColor': '#fff3cd',
    'borderColor': '#ffeeba'
  },
  'info': {
    'color': '#0c5460',
    'backgroundColor': '#d1ecf1',
    'borderColor': '#bee5eb',
  },
  '': {},
}
type AlertType = {
  extraSize:boolean,
  styling:{
variantHead: string,
heading: string,
text: string,
color1: string,
button1: string,
color2: string,
button2: string,
inputField:string,
},
onReturn: (val: string, val2:string ) => void}

export default function ChooseAvatar(props:AlertType) {
  // main popup alert component
  // DO NOT FORGET TO NAME main tag id="mainPage"

  const [value, setValue] = useState(300);

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
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
  };

  return (
    <div className="blurFilter w-screen h-svh fixed flex justify-center items-center bg-slate-500/70 left-0 z-1001 top-0" >
      <div className='m-auto  max-w-[600px] bg-gray-200 border-2 border-solid border-gray-400 rounded-md w-[97%] p-2 flex flex-col content-evenly'>
        <label className='px-1 py-2 border-2 border-solid border-transparent text-slate-500 rounded-sm w-full m-1 text-center' style={Object.values(variant)[Object.keys(variant).indexOf(props.styling.variantHead)]}>{props.styling.heading}</label>
        <h5 className="px-1 py-2 border-2 border-solid border-transparent text-slate-500 rounded-sm w-full m-1 text-center"  dangerouslySetInnerHTML={{ __html:props.styling.text}}/>
         <input type="file" hidden id="inputField" accept="image/*" className="w-full mb-2 rounded-md text-gray-700" 
        onChange={handleChange}/>
        {props.extraSize && <select onChange={(e)=>{ setValue(Number(e.target.value))}} className="w-full mb-2 rounded-md text-gray-700">
          <option value={300}>Small</option>
          <option value={600}>Medium</option>
          <option value={1200}>Large</option>
          </select>}
        {(props.styling.color1!=="") && 
        <button className='px-1 py-2 border-2 border-solid border-transparent rounded-sm w-full m-1 text-center text-white' style={button1Color} 
        onClick={() => {
          document.getElementById("inputField")!.click()
          }}>
          {props.styling.button1}
        </button>}
        {(props.styling.color2!=="") &&<button className="px-1 py-2 border-2 border-solid border-transparent rounded-sm w-full m-1 text-center text-white" style={button2Color} onClick={e => { props.onReturn(props.styling.button2, "") }}>
          {props.styling.button2}
        </button>}

      </div>

    </div>

  )
        }