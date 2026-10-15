/**
 * Favourites store — simple Context + Set for tracking favourite food IDs.
 */
import React, { createContext, useCallback, useContext, useState } from 'react';

interface FavouritesContextValue {
  favourites: Set<string>;
  toggleFavourite: (foodId: string) => void;
  isFavourite: (foodId: string) => boolean;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<Set<string>>(new Set());

  const toggleFavourite = useCallback((foodId: string) => {
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(foodId)) next.delete(foodId);
      else next.add(foodId);
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (foodId: string) => favourites.has(foodId),
    [favourites]
  );

  return (
    <FavouritesContext.Provider value={{ favourites, toggleFavourite, isFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside <FavouritesProvider>');
  return ctx;
}
