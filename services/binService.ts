import axios from "axios";

interface CreateBinPayload {
  lat: number;
  lng: number;
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
area?:string;
  notes?: string;
  image?: File | null;
  binsCount?:number | null;
}

export async function createBin(data: CreateBinPayload) {
  try {
    const formData = new FormData();

    formData.append("lat", data.lat.toString());
    formData.append("lng", data.lng.toString());

    if (data.accuracy !== undefined && data.accuracy !== null) {
      formData.append("accuracy", data.accuracy.toString());
    }

    if (data.altitude !== undefined && data.altitude !== null) {
      formData.append("altitude", data.altitude.toString());
    }

    if (data.wasteType) formData.append("wasteType", data.wasteType);
    if (data.binsCount !== undefined && data.binsCount !== null) formData.append("binsCount", data.binsCount.toString());
    if (data.area) formData.append("area", data.area);
    if (data.binStatus) formData.append("binStatus", data.binStatus);
    if (data.binCapacity) formData.append("binCapacity", data.binCapacity);
    if (data.fillLevel) formData.append("fillLevel", data.fillLevel);
    if (data.streetType) formData.append("streetType", data.streetType);
    if (data.sidewalkStatus)
      formData.append("sidewalkStatus", data.sidewalkStatus);
    if (data.streetWidth)
      formData.append("streetWidth", data.streetWidth);
    if (data.isHotspot) formData.append("isHotspot", data.isHotspot);

    if (data.notes) formData.append("notes", data.notes);

    if (data.image) {
      formData.append("image", data.image);
    }

    const res = await axios.post("/api/bins", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || "CREATE BIN FAILED");
  }
}