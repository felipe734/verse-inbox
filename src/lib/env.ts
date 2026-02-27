import { publicEnv } from "@/lib/env-public";

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value.trim();
};

export { publicEnv };

export const serverEnv = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return getEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
};
