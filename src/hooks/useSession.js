// src/hooks/useSession.js
import { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuid } from 'uuid';

export default function useSession() {
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('vclimb_session') || null);
  const [session, setSession] = useState(null);
  const unsubRef = useRef(null);

  const createSession = async ({ initialPlayers = [] } = {}) => {
    const id = uuid().slice(0,8);
    const docRef = doc(db, 'sessions', id);
    const data = { players: initialPlayers, createdAt: serverTimestamp(), updates: [] };
    await setDoc(docRef, data);
    setSessionId(id);
    localStorage.setItem('vclimb_session', id);
    // attach listener
    return id;
  };

  const joinSession = async (id) => {
    const docRef = doc(db, 'sessions', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Session not found');
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = onSnapshot(docRef, (s) => {
      setSession(s.data());
    });
    setSessionId(id);
    localStorage.setItem('vclimb_session', id);
  };

  const updateSession = async (patch) => {
    if (!sessionId) throw new Error('No sessionId');
    const docRef = doc(db, 'sessions', sessionId);
    await updateDoc(docRef, patch);
  };

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return { sessionId, session, createSession, joinSession, updateSession };
}

