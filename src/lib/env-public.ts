/**
 * Variables accesibles en el cliente (NEXT_PUBLIC_*).
 */

const getEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env: ${key}`);
  return value.trim();
};

export const publicEnv = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
} as const;
