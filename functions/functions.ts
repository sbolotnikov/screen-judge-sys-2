 
import { saveAs } from 'file-saver';

export const save_Template = (text1:string,filename:string) =>{
  const blob = new Blob([text1], {type: "text/plain;charset=utf-8"});
  saveAs(blob, filename+".txt");
}