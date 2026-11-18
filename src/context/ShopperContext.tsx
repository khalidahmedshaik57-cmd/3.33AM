"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import type { ReactNode } from "react";
import type { DesignWithVariants } from "@/types";

export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
};

type ShopperContextValue = {
  profile: CustomerProfile | null;
  favorites: DesignWithVariants[];
  hydrated: boolean;
  saveProfile: (profile: CustomerProfile) => void;
  toggleFavorite: (design: DesignWithVariants) => void;
  removeFavorite: (designId: string) => void;
};

const ShopperContext = createContext<ShopperContextValue | null>(null);
const PROFILE_KEY = "333am-customer-profile-v1";
const FAVORITES_KEY = "333am-favorites-v1";
const profileSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string()
});
const designSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  collection: z.string(),
  price: z.number(),
  images: z.array(z.string()),
  featured: z.boolean().optional(),
  variants: z.array(z.object({ id: z.string(), size: z.string(), stock: z.number() }))
});
const favoritesSchema = z.array(designSchema);

export function ShopperProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [favorites, setFavorites] = useState<DesignWithVariants[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedProfile = window.localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const parsed = profileSchema.safeParse(JSON.parse(savedProfile));
        if (parsed.success) setProfile(parsed.data);
        else window.localStorage.removeItem(PROFILE_KEY);
      }
      const savedFavorites = window.localStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        const parsed = favoritesSchema.safeParse(JSON.parse(savedFavorites));
        if (parsed.success) setFavorites(parsed.data);
        else window.localStorage.removeItem(FAVORITES_KEY);
      }
    } catch (error) {
      console.error("Could not load the saved customer profile or favorites", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Could not save favorites to this browser", error);
    }
  }, [favorites, hydrated]);

  const saveProfile = useCallback((value: CustomerProfile) => {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
    setProfile(value);
  }, []);

  const toggleFavorite = useCallback((design: DesignWithVariants) => {
    setFavorites((current) => current.some((item) => item.id === design.id)
      ? current.filter((item) => item.id !== design.id)
      : [...current, design]);
  }, []);

  const removeFavorite = useCallback((designId: string) => {
    setFavorites((current) => current.filter((item) => item.id !== designId));
  }, []);

  const value = useMemo(
    () => ({ profile, favorites, hydrated, saveProfile, toggleFavorite, removeFavorite }),
    [profile, favorites, hydrated, saveProfile, toggleFavorite, removeFavorite]
  );
  return <ShopperContext.Provider value={value}>{children}</ShopperContext.Provider>;
}

export function useShopper() {
  const context = useContext(ShopperContext);
  if (!context) throw new Error("useShopper must be used within ShopperProvider");
  return context;
}
