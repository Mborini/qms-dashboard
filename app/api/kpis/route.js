// app/api/kpis/route.js

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

// =====================================================
// CONFIG
// =====================================================

const API_BASE_URL = "https://api.avtr.jo/api/service-provider";

// عدد الطلبات التي تعمل بنفس الوقت
const CONCURRENCY = 8;

// عدد مرات إعادة المحاولة
const MAX_RETRIES = 3;

// مدة انتظار الطلب الواحد
const REQUEST_TIMEOUT = 15000;

// الانتظار بين المحاولات
const RETRY_DELAY = 1000;

// حجم Pagination
const PAGE_SIZE = 100;


// =====================================================
// SLEEP
// =====================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// =====================================================
// RETRYABLE ERROR
// =====================================================

function isRetryableError(error) {
  if (!error) return false;

  const message = String(error.message || "").toLowerCase();

  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("fetch failed") ||
    message.includes("connect") ||
    message.includes("socket") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("und_err")
  );
}


// =====================================================
// FETCH WITH RETRY + TIMEOUT
// =====================================================

async function fetchWithRetry(url, options = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,

        signal: AbortSignal.timeout(REQUEST_TIMEOUT),

        cache: "no-store",
      });

      // =================================================
      // Retry على أخطاء السيرفر
      // =================================================

      if (
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500
      ) {
        const error = new Error(
          `API returned status ${response.status}`,
        );

        lastError = error;

        if (attempt < MAX_RETRIES) {
          const delay =
            RETRY_DELAY * Math.pow(2, attempt - 1);

          console.log(
            `Retry ${attempt}/${MAX_RETRIES} after ${delay}ms`,
          );

          await sleep(delay);

          continue;
        }

        throw error;
      }

      // =================================================
      // أخطاء Authentication / Bad Request
      // لا داعي لإعادة المحاولة
      // =================================================

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status}`,
        );
      }

      return response;
    } catch (error) {
      lastError = error;

      console.error(
        `Request failed - attempt ${attempt}/${MAX_RETRIES}:`,
        error?.message,
      );

      // إذا لم يكن الخطأ قابلًا لإعادة المحاولة
      if (!isRetryableError(error)) {
        throw error;
      }

      // آخر محاولة
      if (attempt >= MAX_RETRIES) {
        break;
      }

      // Exponential Backoff
      const delay =
        RETRY_DELAY * Math.pow(2, attempt - 1);

      console.log(
        `Waiting ${delay}ms before retry...`,
      );

      await sleep(delay);
    }
  }

  throw lastError || new Error("Request failed");
}


// =====================================================
// CONCURRENCY RUNNER
// =====================================================

async function mapWithConcurrency(
  items,
  concurrency,
  mapper,
) {
  const results = new Array(items.length);

  let currentIndex = 0;

  async function worker() {
    while (true) {
      const index = currentIndex++;

      if (index >= items.length) {
        return;
      }

      try {
        results[index] = await mapper(
          items[index],
          index,
        );
      } catch (error) {
        console.error(
          `Worker failed for item ${items[index]?.id}:`,
          error?.message,
        );

        results[index] = null;
      }
    }
  }

  const workers = Array.from(
    {
      length: Math.min(
        concurrency,
        items.length,
      ),
    },
    () => worker(),
  );

  await Promise.all(workers);

  return results;
}


// =====================================================
// GET
// =====================================================

export async function GET(request) {
  try {
    // =================================================
    // SESSION + MAIN TOKEN
    // =================================================

    const session = await getServerSession(authOptions);

  console.log("KPI token debug:", {
    hasSession: !!session,
    hasUserToken: !!(session )?.user?.avtrToken,
    hasMainToken: !!(session )?.user?.avtrMainToken,
    userTokenPrefix: (session )?.user?.avtrToken?.slice(0, 8),
  });
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مسجّل دخول" },
        { status: 401 },
      );
    }

    const token = session.user.avtrMainToken;
    const tokenExpiresAt =
      session.user.avtrMainTokenExpiresAt;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "التوكن الرئيسي غير موجود، سجّل دخول من جديد",
        },
        { status: 401 },
      );
    }

    if (
      tokenExpiresAt &&
      new Date(tokenExpiresAt).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "انتهت صلاحية التوكن، سجّل دخول من جديد",
        },
        { status: 401 },
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    // =================================================
    // PARAMETERS
    // =================================================

    const { searchParams } = new URL(
      request.url,
    );

    const districtNames =
      searchParams.get("districtNames") || "";

    const now = new Date();

    const year = now.getFullYear();

    const month = now.getMonth() + 1;

    const day = now.getDate();

    const dateFrom =
      searchParams.get("dateFrom") ||
      `${year}-${String(month).padStart(
        2,
        "0",
      )}-${String(day).padStart(
        2,
        "0",
      )}T21:00:00.000Z`;

    const dateTo =
      searchParams.get("dateTo") ||
      `${year}-${String(month).padStart(
        2,
        "0",
      )}-${String(day).padStart(
        2,
        "0",
      )}T20:59:59.999Z`;

    const sortBy =
      searchParams.get("sortBy") ||
      "reportedDate";

    const sortDirection =
      searchParams.get("sortDirection") ||
      "desc";


    // =================================================
    // GET ALL FAILURES - PAGINATION
    // =================================================

    const allFailures = [];

    let offset = 0;

    let total = 0;

    do {
      const url =
        `${API_BASE_URL}/failures?` +
        `limit=${PAGE_SIZE}` +
        `&offset=${offset}` +
        `&districtNames=${encodeURIComponent(
          districtNames,
        )}` +
        `&dateFrom=${encodeURIComponent(
          dateFrom,
        )}` +
        `&dateTo=${encodeURIComponent(
          dateTo,
        )}` +
        `&sortBy=${encodeURIComponent(
          sortBy,
        )}` +
        `&sortDirection=${encodeURIComponent(
          sortDirection,
        )}`;

      console.log(
        `Fetching failures offset=${offset}`,
      );

      const response =
        await fetchWithRetry(url, {
          headers,
        });

      const result =
        await response.json();

      total = result.total || 0;

      allFailures.push(
        ...(result.items || []),
      );

      offset += PAGE_SIZE;

      // حماية من loop غير منتهٍ
      if (
        !result.items ||
        result.items.length === 0
      ) {
        break;
      }
    } while (
      allFailures.length < total
    );


    // =================================================
    // NO DATA
    // =================================================

    if (allFailures.length === 0) {
      return NextResponse.json({
        total: 0,
        items: [],
      });
    }


    // =================================================
    // GET DETAILS
    // CONCURRENCY + RETRY
    // =================================================

    console.log(
      `Fetching details for ${allFailures.length} failures with concurrency ${CONCURRENCY}`,
    );

    const items =
      await mapWithConcurrency(
        allFailures,
        CONCURRENCY,
        async (item) => {
          try {
            const detailsResponse =
              await fetchWithRetry(
                `${API_BASE_URL}/failures/${item.id}`,
                {
                  headers,
                },
              );

            const details =
              await detailsResponse.json();

            const activities =
              details.activities || [];

            // =========================================
            // LAST ACTIVITY
            // =========================================

            const lastActivity =
              activities.at(-1);


            // =========================================
            // LAST RESOLUTION
            // =========================================

            const resolutionActivity =
              activities
                .slice()
                .reverse()
                .find(
                  (activity) =>
                    activity.activityType ===
                    "ResolutionSubmitted",
                );


            // =========================================
            // SERVICE PROVIDER REJECTION
            // =========================================
            // الموظف الذي قام برفض المخالفة من C&C

            const spRejectedActivity =
              activities
                .slice()
                .reverse()
                .find(
                  (activity) =>
                    activity.activityType ===
                    "SpRejected",
                );


            // =========================================
            // FINAL USER
            // =========================================

            let finalUser = "غير معروف";

            // إذا كانت المخالفة InProgress
            // وكان هناك SpRejected من موظف C&C
            // نعتبر موظف SpRejected هو الموظف المسؤول
            if (
              item.status === "InProgress" &&
              spRejectedActivity?.userName
            ) {
              finalUser =
                spRejectedActivity.userName;
            } else {
              // باقي الحالات تستخدم المنطق السابق
              finalUser =
                resolutionActivity?.userName ??
                lastActivity?.userName ??
                "غير معروف";
            }


            // =========================================
            // RETURN
            // =========================================

            return {
              id: item.id,

              districtName:
                item.districtName,

              blockName:
                item.blockName,

              status:
                item.status,

              kpiNameAr:
                details.kpiNameAr,

              // الموظف المسؤول عن المخالفة
              userName:
                finalUser,

              complaintSource:
                item.complaintSource ?? null,

              // آخر موظف قام بـ ResolutionSubmitted
              resolutionUser:
                resolutionActivity?.userName ||
                null,

              // موظف C&C الذي قام بـ SpRejected
              spRejectedUser:
                spRejectedActivity?.userName ||
                null,

              activities,
            };
          } catch (error) {
            // =========================================
            // IMPORTANT
            // لا نخلي مخالفة واحدة تسقط كل النتائج
            // =========================================

            console.error(
              `Failed to fetch details for failure ${item.id}:`,
              error?.message,
            );

            return {
              id: item.id,

              districtName:
                item.districtName,

              blockName:
                item.blockName,

              complaintSource:
                item.complaintSource ?? null,

              status:
                item.status,

              kpiNameAr:
                item.kpiNameAr ||
                null,

              userName:
                "غير معروف",

              resolutionUser:
                null,

              spRejectedUser:
                null,

              activities: [],
            };
          }
        },
      );


    // =================================================
    // REMOVE NULL RESULTS
    // =================================================

    const validItems =
      items.filter(Boolean);


    // =================================================
    // RESPONSE
    // =================================================
    // ملاحظة: شلت كتلة grouped لأنها كانت تُحسب
    // وما تُستخدم بالرد. إذا بدك ترجعها، قلّي.

    return NextResponse.json({
      total: validItems.length,

      items: validItems,
    });
  } catch (error) {
    // =================================================
    // GLOBAL ERROR
    // =================================================

    console.error(
      "KPI API ERROR:",
      error,
    );


    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ أثناء جلب البيانات",
      },
      {
        status: 500,
      },
    );
  }
}