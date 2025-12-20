import { useState, useEffect, useCallback } from 'react';
import { persistence, createDefaultState } from '../../lib/persistence';
import type { LibraryState } from '../../lib/persistence';
import { randomAddress, incrementAddress, decrementAddress } from '../../lib/babel-core';

interface UseLibraryStateOptions {
  pageId: string;
  addressLength?: number;
}

export function useLibraryState({ pageId, addressLength = 64 }: UseLibraryStateOptions) {
  const [state, setState] = useState<LibraryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load state on mount
  useEffect(() => {
    const load = async () => {
      const saved = await persistence.get(pageId);
      if (saved && saved.currentAddress) {
        setState(saved);
      } else {
        const initial = createDefaultState(randomAddress(addressLength));
        setState(initial);
        await persistence.set(pageId, initial);
      }
      setIsLoading(false);
    };
    load();
  }, [pageId, addressLength]);

  // Save state when it changes
  useEffect(() => {
    if (state && !isLoading) {
      persistence.set(pageId, state);
    }
  }, [state, pageId, isLoading]);

  const setAddress = useCallback((address: string) => {
    setState(prev => prev ? { ...prev, currentAddress: address } : null);
  }, []);

  const goRandom = useCallback(() => {
    setAddress(randomAddress(addressLength));
  }, [setAddress, addressLength]);

  const goNext = useCallback(() => {
    setState(prev => {
      if (!prev) return null;
      return { ...prev, currentAddress: incrementAddress(prev.currentAddress) };
    });
  }, []);

  const goPrev = useCallback(() => {
    setState(prev => {
      if (!prev) return null;
      return { ...prev, currentAddress: decrementAddress(prev.currentAddress) };
    });
  }, []);

  const toggleFavorite = useCallback(async () => {
    if (!state) return;
    
    const isFav = state.favorites.includes(state.currentAddress);
    if (isFav) {
      await persistence.removeFavorite(pageId, state.currentAddress);
      setState(prev => prev ? {
        ...prev,
        favorites: prev.favorites.filter(f => f !== prev.currentAddress)
      } : null);
    } else {
      await persistence.addFavorite(pageId, state.currentAddress);
      setState(prev => prev ? {
        ...prev,
        favorites: [...prev.favorites, prev.currentAddress]
      } : null);
    }
  }, [state, pageId]);

  const isFavorite = state?.favorites.includes(state.currentAddress) ?? false;

  const updateSettings = useCallback((settings: Record<string, unknown>) => {
    setState(prev => prev ? { ...prev, settings: { ...prev.settings, ...settings } } : null);
  }, []);

  return {
    address: state?.currentAddress ?? '',
    favorites: state?.favorites ?? [],
    settings: state?.settings ?? {},
    isLoading,
    isFavorite,
    setAddress,
    goRandom,
    goNext,
    goPrev,
    toggleFavorite,
    updateSettings,
  };
}

