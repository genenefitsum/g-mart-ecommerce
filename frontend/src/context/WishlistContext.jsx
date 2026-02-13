import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiAddToWishlist, apiGetWishlist, apiRemoveFromWishlist } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const WishlistContext = createContext(null);

const GUEST_STORAGE_KEY = "gmart_guest_wishlist_v1";

function readGuestWishlist() {
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p === "object")
      .map((p) => ({
        id: String(p.id ?? ""),
        name: p.name ?? "",
        category: p.category ?? "",
        price: Number(p.price ?? 0),
        image: p.image ?? "",
      }))
      .filter((p) => p.id);
  } catch {
    return [];
  }
}

function writeGuestWishlist(items) {
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function clearGuestWishlist() {
  try {
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const WishlistProvider = ({ children, onRequireAuth }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const totalItems = items.length;

  const productIdSet = useMemo(() => {
    return new Set(items.map((p) => String(p.id)));
  }, [items]);

  const loadWishlist = async () => {
    if (!user) {
      setItems(readGuestWishlist());
      setError("");
      return;
    }

    setIsLoading(true);
    try {
      setError("");
      const data = await apiGetWishlist();
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setError(data?.error || "Failed to load wishlist");
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeItem = (product) => {
    const id = String(product?.id ?? product?._id ?? "");
    return {
      id,
      name: product?.name ?? "",
      category: product?.category ?? "",
      price: Number(product?.price ?? 0),
      image: product?.image ?? product?.imageUrl ?? "",
    };
  };

  useEffect(() => {
    // When user logs in/out, refresh wishlist.
    // If the user just logged in and there are guest wishlist items, sync them first.
    const guestItems = readGuestWishlist();

    if (user && guestItems.length) {
      setIsLoading(true);
      ;(async () => {
        try {
          await Promise.allSettled(guestItems.map((p) => apiAddToWishlist(p.id)));
          clearGuestWishlist();
        } finally {
          await loadWishlist();
          setIsLoading(false);
        }
      })();
      return;
    }

    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addToWishlist = async (product) => {
    const normalized = normalizeItem(product);
    const productId = String(normalized?.id ?? "");
    if (!productId) return { ok: false };

    // Open immediately + optimistic add for instant feedback.
    setIsWishlistOpen(true);
    const wasInWishlist = productIdSet.has(productId);
    if (!wasInWishlist) {
      setItems((prev) => {
        const exists = prev.some((p) => String(p.id) === productId);
        const next = exists ? prev : [...prev, normalized];

        // Persist guest wishlist locally when not signed in.
        if (!user) writeGuestWishlist(next);
        return next;
      });
    }

    // Guest mode: behave like cart (local-only).
    if (!user) {
      return { ok: true, guest: true };
    }

    try {
      const data = await apiAddToWishlist(productId);
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
        setError("");
      } else {
        setError(data?.error || "Failed to save wishlist")
      }
      return { ok: Boolean(data?.ok) };
    } catch (err) {
      // Keep the optimistic add so the drawer behaves like Cart.
      // If the API is temporarily unavailable, the item remains visible.
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Could not save wishlist right now"
      setError(message)
      return { ok: false };
    }
  };

  const removeFromWishlist = async (productId) => {
    const id = String(productId ?? "");
    if (!id) return { ok: false };

    // Optimistic remove.
    setItems((prev) => {
      const next = prev.filter((p) => String(p.id) !== id);
      if (!user) writeGuestWishlist(next);
      return next;
    });

    if (!user) {
      return { ok: true, guest: true };
    }

    try {
      const data = await apiRemoveFromWishlist(id);
      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
      return { ok: Boolean(data?.ok) };
    } catch {
      // Best-effort refresh to recover.
      loadWishlist();
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
        error,
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
