import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { pool } from "@/app/src/lib/db";

// ✅ KML Generator
function generateKML(rows: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
      ${rows
        .map(
          (bin) => `
        <Placemark>
          <name>Bin ${bin.id}</name>
          <description><![CDATA[
            <b>المنطقة:</b> ${bin.area_name} <br/>
            <b>الحالة:</b> ${bin.bin_status} <br/>
            <b>نوع النفايات:</b> ${bin.waste_type} <br/>
            <b>التعبئة:</b> ${bin.fill_level} <br/>
            <b>التعبئة:</b> ${bin.bin_capacity} <br/>
            <b>التعبئة:</b> ${bin.street_type} <br/>
            <b>التعبئة:</b> ${bin.sidewalk_status} <br/>
            <b>التعبئة:</b> ${bin.street_width} <br/>
            <b>التعبئة:</b> ${bin.is_hotspot} <br/>
            <b>الملاحظات:</b> ${bin.notes || "-"}
          ]]></description>
          <Point>
            <coordinates>${bin.lng},${bin.lat},${bin.altitude || 0}</coordinates>
          </Point>
        </Placemark>
      `
        )
        .join("")}
    </Document>
  </kml>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const areaId = searchParams.get("area");
  const type = searchParams.get("type") || "excel";

  if (!areaId) {
    return NextResponse.json({ error: "area مطلوب" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `
  SELECT 
    bins.id,
    bins.lat,
    bins.lng,
    bins.accuracy,
    bins.altitude,
    bins.waste_type,
    bins.bin_status,
    bins.bin_capacity,
    bins.fill_level,
    bins.street_type,
    bins.sidewalk_status,
    bins.street_width,
    bins.is_hotspot,bins.bins_Count,
    bins.notes,
    bins.image_url,
    bins.created_at,
    
    collection_areas.name AS area_name
  FROM bins
  INNER JOIN collection_areas
    ON bins.area = collection_areas.id
  WHERE bins.area = $1
ORDER BY bins.id ASC

  `,
    [areaId],
  );

  // ✅ KML
  if (type === "kml") {
    const kml = generateKML(rows);

    return new Response(kml, {
      headers: {
        "Content-Type": "application/vnd.google-earth.kml+xml",
        "Content-Disposition": `attachment; filename="bins-${areaId}.kml"`,
      },
    });
  }

  // ✅ Excel (بدون أي تغيير)
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bins");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="bins-${areaId}.xlsx"`,
    },
  });
}