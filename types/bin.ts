export interface BinPayload {
  lat: number;
  lng: number;

  gpsLat?: number | null;
  gpsLng?: number | null;
  accuracy?: number | null;
  altitude?: number | null;

  wasteType?: string;
  binStatus?: string;
  binCapacity?: string;
  fillLevel?: string;
  streetType?: string;
  sidewalkStatus?: string;
  streetWidth?: string;
  isHotspot?: string;

  notes?: string;
  image?: File | null;
}

export interface BinApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
}