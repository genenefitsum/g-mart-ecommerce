import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiAddToWishlist, apiGetWishlist, apiRemoveFromWishlist } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children, onRequireAuth }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalItems = items.length;

  const productIdSet = useMemo(() => {
    return new Set(items.map((p) => String(p.id)));
  }, [items]);

  const loadWishlist = async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiGetWishlist();
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // When user logs in/out, refresh wishlist.
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addToWishlist = async (product) => {
    if (!user) {
      if (typeof onRequireAuth === "function") onRequireAuth();
      return { ok: false };
    }

    const productId = String(product?.id ?? "");
    if (!productId) return { ok: false };

    try {
      const data = await apiAddToWishlist(productId);
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
      setIsWishlistOpen(true);
      return { ok: Boolean(data?.ok) };
    } catch {
      return { ok: false };
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return { ok: false };
    const id = String(productId ?? "");
    if (!id) return { ok: false };

    try {
      const data = await apiRemoveFromWishlist(id);
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
      return { ok: Boolean(data?.ok) };
    } catch {
      return { ok: false };
    }
  };

  const toggleWishlist = async (product) => {
    const id = String(product?.id ?? "");
    if (!id) return { ok: false };

    if (productIdSet.has(id)) {
      return removeFromWishlist(id);
    }
    return addToWishlist(product);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        totalItems,
        isWishlistOpen,
        setIsWishlistOpen,
        loadWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        hasInWishlist: (productId) => productIdSet.has(String(productId)),
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return ctx;
};
