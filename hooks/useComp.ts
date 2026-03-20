"use client"
import { createContext, useState, useEffect } from 'react';
import { doc, useDocument } from '@/hooks/useMongoDb';
const db2 = null;
 

interface ReturnCompContextType {
    heat:string; 

} 
export const CompContext = createContext<ReturnCompContextType >({} as ReturnCompContextType );

export default function useComp(comp:string): ReturnCompContextType {  
  const [value2, loading1, err] = useDocument(
    doc(db2, 'competitions', comp),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );

  if (err) console.log('error', err);
  if (value2) { 
    console.log("got value",value2.data()?.currentHeat    ); 
  }
 
  return { heat: value2?.data()?.currentHeat ?? '' };
}
  
