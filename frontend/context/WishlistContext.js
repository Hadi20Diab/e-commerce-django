'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistApi } from '../lib/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext({
  wishlist: [],
  wishlistIds: new Set(),
  toggleWishlist: async () => {},
  refreshWishlist: async () => {},
});

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      return;
    }
    try {
      const res = await wishlistApi.list();
      const items = res.data.results ?? res.data;
      setWishlist(items);
      setWishlistIds(new Set(items.map((i) => i.product.id)));
    } catch {
      // silently fail — user may not be logged in yet
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(async (productId) => {
    const isInWishlist = wishlistIds.has(productId);
    if (isInWishlist) {
      await wishlistApi.remove(productId);
    } else {
      await wishlistApi.add(productId);
    }
    await fetchWishlist();
    return !isInWishlist;
  }, [wishlistIds, fetchWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistIds, toggleWishlist, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
