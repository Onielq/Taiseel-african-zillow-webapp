/**
 * Minimal project type used by the shared Land Intelligence map engine.
 * The Zillow search map renders listing cards in its sibling results panel;
 * project markers are intentionally not enabled in this screen.
 */
export type RwandaProjectRecord = {
  id: string;
  name: string;
  developer?: string | null;
  district?: string | null;
  sector?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  parcelUpi?: string | null;
};
