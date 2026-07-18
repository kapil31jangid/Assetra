import { useEffect, useMemo, useState } from "react";

import type { Id } from "../../types";

const wishlistStorageKey = "assetra.mock.wishlist";

const readWishlist = (): Id[] => {
  const raw = window.localStorage.getItem(wishlistStorageKey);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Id[];
  } catch {
    window.localStorage.removeItem(wishlistStorageKey);
    return [];
  }
};

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState<Id[]>(() => readWishlist());

  useEffect(() => {
    window.localStorage.setItem(wishlistStorageKey, JSON.stringify(wishlist));
  }, [wishlist]);

  return useMemo(
    () => ({
      wishlist,
      isWishlisted: (productId: Id) => wishlist.includes(productId),
      toggleWishlist: (productId: Id) => {
        setWishlist((current) =>
          current.includes(productId)
            ? current.filter((item) => item !== productId)
            : [...current, productId],
        );
      },
    }),
    [wishlist],
  );
};
