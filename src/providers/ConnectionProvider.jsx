import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { CONNECTION_STORAGE_KEY, getTrackerConnection, normalizeBaseUrl } from "../config.js";

const Context = createContext(null);
export function ConnectionProvider({ children }) {
  const [baseUrl, setUrl] = useState('');
  const [defaultUrl, setDefaultUrl] = useState('');
  const [isReady, setReady] = useState(false);
  const [storageError, setStorageError] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CONNECTION_STORAGE_KEY);
        const settings = getTrackerConnection(saved, process.env.EXPO_PUBLIC_TRACKER_API_URL ?? '');
        if (alive) {
          setUrl(settings.baseUrl);
          setDefaultUrl(settings.defaultUrl);
          setStorageError(settings.configurationError);
        }
      } catch (error) {
        if (alive) setStorageError(error instanceof Error ? error.message : 'Could not load the saved connection.');
      } finally {if (alive) setReady(true);}
    })();
    return () => {alive = false;};
  }, []);
  async function setBaseUrl(value) {
    const next = normalizeBaseUrl(value);
    // Only this endpoint preference is stored on-device. Entries and lists stay on the API.
    await AsyncStorage.setItem(CONNECTION_STORAGE_KEY, next);
    setUrl(next);
    setStorageError(null);
  }
  return <Context.Provider value={{ baseUrl, defaultUrl, isReady, isConfigured: Boolean(baseUrl), setBaseUrl, storageError }}>{children}</Context.Provider>;
}
export function useConnection() {
  const context = useContext(Context);
  if (!context) throw new Error('useConnection must be inside ConnectionProvider.');
  return context;
}
