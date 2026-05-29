export type { Location } from "sketch-map-sdk";

export interface NominatimItem {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type: string;
}
