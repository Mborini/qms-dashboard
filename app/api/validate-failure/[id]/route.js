import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  try {
    // =============================
    // الحصول على ID
    // =============================

    const { id } = await params;

    // =============================
    // قراءة الباسوورد
    // =============================

    const body = await request.json();

    const { password } = body;

    if (!password) {
      return NextResponse.json(
        {
          error: "Password is required",
        },
        {
          status: 400,
        }
      );
    }

    // =============================
    // تحديد المستخدم والـ Token
    // =============================

    let token = null;
    let user = null;

    if (password === process.env.ADMIN_PASSWORD) {
      token = process.env.ADMIN_AVTR_TOKEN;
      user = "admin";
    } else if (password === process.env.ZYAD_PASSWORD) {
      token = process.env.ZYAD_AVTR_TOKEN;
      user = "zyad";
    } else if (password === process.env.NAYF_PASSWORD) {
      token = process.env.NAYF_AVTR_TOKEN;
      user = "nayf";
    }

    // =============================
    // الباسوورد غير صحيح
    // =============================

    if (!token) {
      return NextResponse.json(
        {
          error: "Invalid password",
        },
        {
          status: 401,
        }
      );
    }

    // =============================
    // التأكد من وجود Token
    // =============================

    if (
      user === "admin" &&
      !process.env.ADMIN_AVTR_TOKEN
    ) {
      return NextResponse.json(
        {
          error: "Admin token missing",
        },
        {
          status: 500,
        }
      );
    }

    if (
      user === "zyad" &&
      !process.env.ZYAD_AVTR_TOKEN
    ) {
      return NextResponse.json(
        {
          error: "Zyad token missing",
        },
        {
          status: 500,
        }
      );
    }

    if (
      user === "nayf" &&
      !process.env.NAYF_AVTR_TOKEN
    ) {
      return NextResponse.json(
        {
          error: "Nayf token missing",
        },
        {
          status: 500,
        }
      );
    }

    // =============================
    // رابط AVTR
    // =============================

    const url =
      `https://api.avtr.jo/api/service-provider/failures/${id}/validate`;

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
      response = await fetch(
        url,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },

          body: JSON.stringify({
            accepted: true,
          }),

          // Timeout 15 seconds
          signal: AbortSignal.timeout(15000),
        }
      );
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "AVTR FETCH ERROR"
      );

      console.error(
        "Name:",
        error?.name
      );

      console.error(
        "Message:",
        error?.message
      );

      console.error(
        "Code:",
        error?.code
      );

      console.error(
        "Cause:",
        error?.cause
      );

      console.error(
        "================================="
      );

      // =============================
      // Timeout
      // =============================

      if (
        error?.name === "TimeoutError" ||
        error?.code === "ETIMEDOUT" ||
        error?.cause?.code === "ETIMEDOUT"
      ) {
        return NextResponse.json(
          {
            error: "AVTR API timeout",
            message:
              "تعذر الاتصال بخادم AVTR خلال الوقت المحدد",
          },
          {
            status: 504,
          }
        );
      }

      // =============================
      // Connection Error
      // =============================

      return NextResponse.json(
        {
          error: "AVTR API connection failed",
          message: error?.message || "Fetch failed",
        },
        {
          status: 502,
        }
      );
    }

    // =============================
    // قراءة Response
    // =============================

    let data;

    try {
      data = await response.json();
    } catch {
      data = {
        message: await response.text(),
      };
    }

    // =============================
    // Log
    // =============================

    console.log(
      "AVTR STATUS:",
      response.status
    );

    console.log(
      "AVTR RESPONSE:",
      data
    );

    // =============================
    // إرسال نتيجة AVTR
    // =============================

    return NextResponse.json(
      data,
      {
        status: response.status,
      }
    );

  } catch (error) {

    // =============================
    // General Error
    // =============================

    console.error(
      "================================="
    );

    console.error(
      "GENERAL SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    return NextResponse.json(
      {
        error: "Server error",
        message:
          error?.message || "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}