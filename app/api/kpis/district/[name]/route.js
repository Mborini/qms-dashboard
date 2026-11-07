
// app/api/kpis/district/[name]/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, pool } from "@/app/lib/auth";
import { ensureMainAvtrToken } from "@/app/lib/avtr";
import {
  fetchAllFailures,
  defaultTodayRange,
} from "@/app/lib/kpis";

const ALLOWED_STATUSES = [
  "ResolutionRejected",
  "PendingSpValidation",
  "InProgress",
];

function normalizeDistricts(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }

  return [];
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مسجّل دخول" },
        { status: 401 },
      );
    }

    const { name } = await params;

    let district = "";

    try {
      district = decodeURIComponent(name || "").trim();
    } catch {
      district = String(name || "").trim();
    }

    if (!district) {
      return NextResponse.json(
        { error: "اسم المنطقة مطلوب" },
        { status: 400 },
      );
    }

    // التحقق من صلاحية المنطقة
    const isAdmin = Number(session.user.roleId) === 1;

    if (!isAdmin) {
      const allowed = normalizeDistricts(
        session.user.districtNames,
      );

      if (!allowed.includes(district)) {
        return NextResponse.json(
          { error: "غير مصرّح لك بهذه المنطقة" },
          { status: 403 },
        );
      }
    }

    // جلب التوكن
    const main = await ensureMainAvtrToken(pool);

    if (!main?.token) {
      return NextResponse.json(
        { error: "التوكن الرئيسي غير موجود" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const defaultRange = defaultTodayRange();

    const dateFrom =
      searchParams.get("dateFrom") || defaultRange.dateFrom;

    const dateTo =
      searchParams.get("dateTo") || defaultRange.dateTo;

    const sortBy =
      searchParams.get("sortBy") || "reportedDate";

    const sortDirection =
      searchParams.get("sortDirection") || "desc";

    // الـ API نفسه يفلتر الحالات المطلوبة
    const failures = await fetchAllFailures({
      token: main.token,
      districtNames: district,
      statuses: ALLOWED_STATUSES,
      dateFrom,
      dateTo,
      sortBy,
      sortDirection,
    });

    const ids = failures.map((item) => item.id);
    return NextResponse.json({
      total: ids.length,
      ids,
    });

  } catch (error) {
    console.error("KPI DISTRICT API ERROR:", error);

    return NextResponse.json(
      {
        error: error?.message || "حدث خطأ أثناء جلب البيانات",
      },
      { status: 500 },
    );
  }
}
