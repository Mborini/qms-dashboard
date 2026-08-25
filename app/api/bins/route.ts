import cloudinary from "@/app/src/cloudinary";
import { pool } from "@/app/src/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const lat = Number(formData.get("lat"));
    const lng = Number(formData.get("lng"));

    const accuracy = formData.get("accuracy");
    const altitude = formData.get("altitude");
    const area = formData.get("area");
    const binsCount = formData.get("binsCount");

    const wasteType = formData.get("wasteType");
    const binStatus = formData.get("binStatus");
    const binCapacity = formData.get("binCapacity");
    const fillLevel = formData.get("fillLevel");
    const streetType = formData.get("streetType");
    const sidewalkStatus = formData.get("sidewalkStatus");
    const streetWidth = formData.get("streetWidth");
    const isHotspot = formData.get("isHotspot");

    const notes = formData.get("notes");

    const image = formData.get("image") as File | null;

    if (!lat || !lng) {
      return NextResponse.json(
        { message: "LAT & LNG are required" },
        { status: 400 },
      );
    }

    // ✅ تحويل القيم
    const accuracyValue = accuracy ? Number(accuracy) : null;
    const altitudeValue = altitude ? Number(altitude) : null;

    const isHotspotValue =
      isHotspot === "نعم" ? true : isHotspot === "لا" ? false : null;

    // ✅ رفع الصورة
    let imageUrl: string | null = null;

    if (image) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadRes = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "bins" }, (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      imageUrl = uploadRes.secure_url;
    }

    // ✅ INSERT
    const result = await pool.query(
      `
      INSERT INTO bins (
        lat, lng, accuracy, altitude,
        waste_type, bin_status, bin_capacity,
        fill_level, street_type, sidewalk_status,
        street_width, is_hotspot,
        notes, image_url,area,bins_Count
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,
        $8,$9,$10,
        $11,$12,
        $13,$14,$15,$16
      )
      RETURNING *;
      `,
      [
        lat,
        lng,
        accuracyValue,
        altitudeValue,
        wasteType,
        binStatus,
        binCapacity,
        fillLevel,
        streetType,
        sidewalkStatus,
        streetWidth,
        isHotspotValue,
        notes,
        imageUrl,
        area,
        binsCount,
      ],
    );

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE BIN ERROR:", error);

    return NextResponse.json(
      { message: "INTERNAL SERVER ERROR" },
      { status: 500 },
    );
  }
}
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT id, lat, lng ,bin_capacity FROM bins
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET BINS ERROR:", error);

    return NextResponse.json(
      { message: "Failed to fetch bins" },
      { status: 500 },
    );
  }
}
