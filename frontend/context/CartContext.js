'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartApi } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart(null); return; }
    setLoading(true);
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    const res = await cartApi.add(productId, quantity);
    setCart(res.data);
    return res.data;
  };

  const updateItem = async (itemId, quantity) => {
    const res = await cartApi.update(itemId, quantity);
    setCart(res.data);
  };

  const removeItem = async (itemId) => {
    const res = await cartApi.remove(itemId);
    setCart(res.data);
  };

  const clearCart = async () => {
    await cartApi.clear();
    setCart(null);
  };

  const refreshCart = fetchCart;

  const itemCount = cart?.total_items ?? 0;

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateItem, removeItem, clearCart, refreshCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
