import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDocument(docRef: { collectionName: string, docId: string } | null, options?: Record<string, unknown>) {
  const { data, error, mutate } = useSWR(
    docRef && docRef.docId && docRef.docId !== '00' ? `/api/mongo/${docRef.collectionName}/${docRef.docId}` : null,
    fetcher,
    { refreshInterval: 2000 } // Poll every 2 seconds for real-time feel
  );

  const loading = !data && !error;

  const value = data && data.document ? {
    data: () => data.document,
    id: docRef?.docId,
  } : undefined;

  return [value, loading, error, mutate] as const;
}

export function useCollection(collectionRef: { collectionName: string } | null, options?: Record<string, unknown>) {
  const { data, error, mutate } = useSWR(
    collectionRef ? `/api/mongo/${collectionRef.collectionName}` : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  const loading = !data && !error;

  const value = data && data.documents ? {
    docs: data.documents.map((doc: { _id: string; [key: string]: unknown }) => ({
      data: () => doc,
      id: doc._id,
    }))
  } : undefined;

  return [value, loading, error, mutate] as const;
}

export const doc = (db: unknown, collectionName: string, docId: string) => {
  return { collectionName, docId };
};

export const collection = (db: unknown, collectionName: string) => {
  return { collectionName };
};

export const updateDoc = async (docRef: { collectionName: string, docId: string }, data: Record<string, unknown>) => {
  const res = await fetch(`/api/mongo/${docRef.collectionName}/${docRef.docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update document');
  return res.json();
};

export const getDocs = async (collectionRef: { collectionName: string }) => {
  const res = await fetch(`/api/mongo/${collectionRef.collectionName}`);
  if (!res.ok) throw new Error('Failed to get documents');
  const data = await res.json();
  return {
    docs: data.documents.map((doc: { _id: string; [key: string]: unknown }) => ({
      id: doc._id,
      data: () => doc,
    }))
  };
};

export const deleteDoc = async (docRef: { collectionName: string, docId: string }) => {
  const res = await fetch(`/api/mongo/${docRef.collectionName}/${docRef.docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
};

export const arrayUnion = (value: unknown) => {
  return { _op: 'arrayUnion', value };
};

export const arrayRemove = (value: unknown) => {
  return { _op: 'arrayRemove', value };
};
