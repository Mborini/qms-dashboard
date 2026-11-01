import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth"; // عدّل المسار إذا لزم

/* =========================================================
   جلب avtrToken الخاص بالمستخدم من السشن
========================================================= */

async function getUserFromSession() {
  const session = await getServerSession(authOptions);

  const token = session?.user?.avtrToken ?? null;
  const expiresAt = session?.user?.avtrTokenExpiresAt ?? null;
  const user = session?.user?.username ?? session?.user?.name ?? null;

  return { token, expiresAt, user };
}

export async function POST(request, { params }) {
  try {
    // =============================
    // الحصول على ID
    // =============================

    const { id } = await params;

    // =============================
    // التوكن من السشن
    // =============================

    const { token, expiresAt, user } = await getUserFromSession();

    const tokenExpiredResponse = () =>
      NextResponse.json(
        {
          error: "AVTR token expired",
          code: "TOKEN_EXPIRED",
          message: "انتهت صلاحية التوكن، أعد تسجيل الدخول",
        },
        { status: 401 }
      );

    // التوكن فاضي أو منتهي: ممنوع نسدد بأي توكن ثاني
    if (!token) {
      return tokenExpiredResponse();
    }

    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
      return tokenExpiredResponse();
    }

    // =============================
    // رابط AVTR
    // =============================

    const url = `https://api.avtr.jo/api/service-provider/failures/${id}/validate`;

    console.log("=================================");
    console.log("AVTR VALIDATE");
    console.log("Failure ID:", id);
    console.log("User:", user);
    console.log("URL:", url);
    console.log("=================================");

    // =============================
    // الاتصال بـ AVTR
    // =============================

    let response;

    try {
      response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          accepted: true,
        }),

        // Timeout 15 seconds
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      console.error("=================================");
      console.error("AVTR FETCH ERROR");
      console.error("Name:", error?.name);
      console.error("Message:", error?.message);
      console.error("Code:", error?.code);
      console.error("Cause:", error?.cause);
      console.error("=================================");

      // Timeout
      if (
        error?.name === "TimeoutError" ||
        error?.code === "ETIMEDOUT" ||
        error?.cause?.code === "ETIMEDOUT"
      ) {
        return NextResponse.json(
          {
            error: "AVTR API timeout",
            message: "تعذر الاتصال بخادم AVTR خلال الوقت المحدد",
          },
          { status: 504 }
        );
      }

      // Connection Error
      return NextResponse.json(
        {
          error: "AVTR API connection failed",
          message: error?.message || "Fetch failed",
        },
        { status: 502 }
      );
    }

    // =============================
    // قراءة Response
    // =============================

    let data;

    try {
      data = await response.json();
    } catch {
      data = { message: "Invalid or empty response from AVTR" };
    }

    console.log("AVTR STATUS:", response.status);
    console.log("AVTR RESPONSE:", data);

    // AVTR رفض التوكن (منتهي من طرفهم)
    if (response.status === 401) {
      return tokenExpiredResponse();
    }

    // =============================
    // إرسال نتيجة AVTR
    // =============================

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("=================================");
    console.error("GENERAL SERVER ERROR");
    console.error(error);
    console.error("=================================");

    return NextResponse.json(
      {
        error: "Server error",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}