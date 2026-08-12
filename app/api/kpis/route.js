import { NextResponse } from "next/server";

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
// TOKEN
// =====================================================

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImMyZmI4NGI3LTAzNGMtNDY2Ny04YzM0LTk2NjIyMzZhOWI0MSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6Ik1vaGFtbWFkLkJvcmluaUBlZnNtZS5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiTW9oYW1tYWQgIEJvcmluaSIsIlVzZXJUeXBlIjoiU2VydmljZVByb3ZpZGVyIiwiUm9sZUlkIjoiNDUiLCJSb2xlTmFtZSI6IlN1cGVydmlzb3IiLCJTZXJ2aWNlUHJvdmlkZXJJZCI6IjMiLCJTZXJ2aWNlUHJvdmlkZXJOYW1lIjoiRUZTIiwiUHJpdmlsZWdlIjpbIlZpZXdVc2VycyIsIlZpZXdGYWlsdXJlcyIsIkVkaXRGYWlsdXJlcyIsIlZpZXdLUElzIiwiVmlld1JvbGVzIiwiVmlld1pvbmVzIiwiVmlld0NvbXBsYWludHMiLCJNYW5hZ2VGaWVsZEVtcGxveWVlRGlzdHJpY3RzIl0sImV4cCI6MTc4NzcyODYyMywiaXNzIjoiUW1zSXNzdWVyIiwiYXVkIjoiUW1zQXVkaWVuY2UifQ.pXSnU9lfWQzIuMjcDEPvOsGyhLFc9yW7tyJt9WXWtZo"


// =====================================================
// HEADERS
// =====================================================

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/json",
};


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
    const { searchParams } = new URL(
      request.url,
    );

    // =================================================
    // PARAMETERS
    // =================================================

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
            // FINAL USER
            // =========================================

            const finalUser =
              resolutionActivity?.userName ??
              lastActivity?.userName ??
              "غير معروف";


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

              userName:
                finalUser,

              resolutionUser:
                resolutionActivity?.userName ||
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

              status:
                item.status,

              kpiNameAr:
                item.kpiNameAr ||
                null,

              userName:
                "غير معروف",

              resolutionUser:
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
    // GROUPED DATA
    // =================================================

    const grouped = {};


    validItems.forEach((item) => {
      const district =
        item.districtName ||
        "بدون منطقة";

      const block =
        item.blockName ||
        "بدون حي";

      const status =
        item.status ||
        "غير معروف";


      // ===============================================
      // DISTRICT
      // ===============================================

      if (!grouped[district]) {
        grouped[district] = {
          total: 0,
          blocks: {},
        };
      }


      // ===============================================
      // BLOCK
      // ===============================================

      if (
        !grouped[district].blocks[
          block
        ]
      ) {
        grouped[district].blocks[
          block
        ] = {
          total: 0,
          statuses: {},
        };
      }


      // ===============================================
      // TOTALS
      // ===============================================

      grouped[district].total++;

      grouped[district].blocks[
        block
      ].total++;


      // ===============================================
      // STATUS
      // ===============================================

      if (
        !grouped[district]
          .blocks[block]
          .statuses[status]
      ) {
        grouped[district]
          .blocks[block]
          .statuses[status] = {
            total: 0,
            ids: [],
            users: {},
          };
      }


      const statusData =
        grouped[district]
          .blocks[block]
          .statuses[status];


      // ===============================================
      // STATUS TOTAL
      // ===============================================

      statusData.total++;


      // ===============================================
      // FAILURE ID
      // ===============================================

      statusData.ids.push(
        item.id,
      );


      // ===============================================
      // USER
      // ===============================================

      const user =
        item.userName ||
        "غير معروف";


      if (!statusData.users[user]) {
        statusData.users[user] = {
          count: 0,
          ids: [],
        };
      }


      statusData.users[user].count++;


      statusData.users[user].ids.push(
        item.id,
      );
    });


    // =================================================
    // RESPONSE
    // =================================================

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