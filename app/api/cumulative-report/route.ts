import { NextResponse } from "next/server";

const API_BASE_URL =
  "https://api.avtr.jo/api/service-provider";

// =====================================================
// PERFORMANCE CONFIG
// =====================================================

const PAGE_SIZE = 100;

const MIN_CONCURRENCY = 24;

const MAX_CONCURRENCY = 40;

const REQUEST_TIMEOUT = 15000;

const MAX_RETRIES = 3;

const RETRY_DELAY = 300;

const SCALE_UP_AFTER = 50;

const TOKEN =
  process.env.Main_AVTR_TOKEN_Admin;

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/json",
};

// =====================================================
// TYPES
// =====================================================

type FailureItem = {
  id?: string | number;
  districtName?: string | null;
  status?: string | null;
};

type DistrictStats = {
  districtName: string;

  total: number;

  pendingAcceptance: number;

  inProgress: number;

  fieldVerification: number;

  resolved: number;

  acceptedRejection: number;

  rejectedSolution: number;

  avtrReview: number;

  achievementCount: number;

  achievementPercentage: number;
};

type DistrictAccumulator = {
  total: number;

  pendingAcceptance: number;

  inProgress: number;

  fieldVerification: number;

  resolved: number;

  acceptedRejection: number;

  rejectedSolution: number;

  avtrReview: number;
};

// =====================================================
// SLEEP
// =====================================================

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

// =====================================================
// RETRYABLE ERROR
// =====================================================

function isRetryableError(
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("fetch failed") ||
    message.includes("connect") ||
    message.includes("socket") ||
    message.includes("econnreset") ||
    message.includes("econnrefused") ||
    message.includes("und_err") ||
    message.includes("429") ||
    message.includes("500") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504")
  );
}

// =====================================================
// FETCH WITH RETRY
// =====================================================

async function fetchWithRetry(
  url: string
) {
  let lastError: unknown = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      const response = await fetch(
        url,
        {
          headers,
          cache: "no-store",
          signal:
            AbortSignal.timeout(
              REQUEST_TIMEOUT
            ),
        }
      );

      // -----------------------------------------------
      // RETRYABLE HTTP STATUS
      // -----------------------------------------------

      if (
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500
      ) {
        throw new Error(
          `API returned status ${response.status}`
        );
      }

      // -----------------------------------------------
      // NORMAL ERROR
      // -----------------------------------------------

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status}`
        );
      }

      return response;
    } catch (error) {
      lastError = error;

      // -----------------------------------------------
      // NO RETRY NEEDED
      // -----------------------------------------------

      if (
        !isRetryableError(error) ||
        attempt >= MAX_RETRIES
      ) {
        break;
      }

      // -----------------------------------------------
      // EXPONENTIAL BACKOFF
      // -----------------------------------------------

      await sleep(
        RETRY_DELAY *
          Math.pow(
            2,
            attempt - 1
          )
      );
    }
  }

  throw (
    lastError ||
    new Error(
      "Request failed"
    )
  );
}

// =====================================================
// BUILD URL
// =====================================================

function buildFailuresUrl(
  dateFrom: string,
  dateTo: string,
  offset: number
) {
  const params =
    new URLSearchParams();

  params.set(
    "limit",
    String(PAGE_SIZE)
  );

  params.set(
    "offset",
    String(offset)
  );

  params.set(
    "districtNames",
    ""
  );

  params.set(
    "dateFrom",
    dateFrom
  );

  params.set(
    "dateTo",
    dateTo
  );

  params.set(
    "sortBy",
    "reportedDate"
  );

  params.set(
    "sortDirection",
    "desc"
  );

  return (
    `${API_BASE_URL}/failures?` +
    params.toString()
  );
}

// =====================================================
// FETCH ONE PAGE
// =====================================================

async function fetchFailuresPage(
  dateFrom: string,
  dateTo: string,
  offset: number
): Promise<{
  items: FailureItem[];
  total: number;
}> {
  const url =
    buildFailuresUrl(
      dateFrom,
      dateTo,
      offset
    );

  const response =
    await fetchWithRetry(url);

  const result =
    await response.json();

  const items =
    Array.isArray(
      result?.items
    )
      ? result.items
      : [];

  const total =
    Number(result?.total) || 0;

  return {
    items,
    total,
  };
}

// =====================================================
// PROCESS PAGE
// =====================================================

function processPage(
  items: FailureItem[],
  grouped: Record<
    string,
    DistrictAccumulator
  >
) {
  for (
    const item of items
  ) {
    const district =
      item.districtName?.trim()
        ? `منطقة ${item.districtName.trim()}`
        : "مخالفات حسب مؤشرات الأداء";

    let data =
      grouped[district];

    // =================================================
    // CREATE DISTRICT
    // =================================================

    if (!data) {
      data = {
        total: 0,

        pendingAcceptance: 0,

        inProgress: 0,

        fieldVerification: 0,

        resolved: 0,

        acceptedRejection: 0,

        rejectedSolution: 0,

        avtrReview: 0,
      };

      grouped[district] =
        data;
    }

    // =================================================
    // TOTAL
    // =================================================

    data.total++;

    // =================================================
    // STATUS
    // =================================================

    switch (
      item.status
    ) {
      // ===============================================
      // في انتظار القبول
      // لا تدخل في Achievement
      // ===============================================

      case "PendingSpValidation":

        data.pendingAcceptance++;

        break;

      // ===============================================
      // قيد التنفيذ
      // لا تدخل في Achievement
      // ===============================================

      case "InProgress":

        data.inProgress++;

        break;

      // ===============================================
      // في انتظار التحقق الميداني
      // تدخل في Achievement
      // ===============================================

      case "PendingFieldMonitorVerification":

        data.fieldVerification++;

        break;

      // ===============================================
      // تم الحل
      // تدخل في Achievement
      // ===============================================

      case "Resolved":

        data.resolved++;

        break;

      // ===============================================
      // قيد مراجعة AVTR
      // تدخل في Achievement
      // ===============================================

      case "PendingSupervisorReview":

        data.avtrReview++;

        break;

      // ===============================================
      // تم قبول الرفض
      //
      // ResolutionRejected
      //
      // لا تدخل في Achievement
      // ===============================================

      case "ResolutionRejected":

        data.acceptedRejection++;

        break;

      // ===============================================
      // تم رفض الحل
      //
      // Rejected
      //
      // تدخل في Achievement
      // ===============================================

      case "Rejected":

        data.rejectedSolution++;

        break;

      default:

        break;
    }
  }
}

// =====================================================
// FETCH + AGGREGATE
// =====================================================

async function fetchAndAggregateFailures(
  dateFrom: string,
  dateTo: string
): Promise<{
  grouped: Record<
    string,
    DistrictAccumulator
  >;
  total: number;
  loaded: number;
  elapsed: number;
}> {
  const startTime =
    Date.now();

  // ===================================================
  // FIRST REQUEST
  // ===================================================

  const firstPage =
    await fetchFailuresPage(
      dateFrom,
      dateTo,
      0
    );

  const total =
    firstPage.total;

  const firstItems =
    firstPage.items;

  // ===================================================
  // ACCUMULATOR
  // ===================================================

  const grouped: Record<
    string,
    DistrictAccumulator
  > = {};

  // ===================================================
  // PROCESS FIRST PAGE
  // ===================================================

  processPage(
    firstItems,
    grouped
  );

  let loaded =
    firstItems.length;

  // ===================================================
  // NO MORE DATA
  // ===================================================

  if (
    total <=
    firstItems.length
  ) {
    return {
      grouped,
      total,
      loaded,
      elapsed:
        Date.now() -
        startTime,
    };
  }

  // ===================================================
  // PAGE COUNT
  // ===================================================

  const pageCount =
    Math.ceil(
      total /
        PAGE_SIZE
    );

  const offsets: number[] =
    new Array(
      pageCount - 1
    );

  for (
    let i = 1;
    i < pageCount;
    i++
  ) {
    offsets[i - 1] =
      i * PAGE_SIZE;
  }

  // ===================================================
  // SHARED QUEUE
  // ===================================================

  let nextIndex = 0;

  // ===================================================
  // ADAPTIVE CONCURRENCY
  // ===================================================

  let concurrency =
    MIN_CONCURRENCY;

  let successfulSinceScale =
    0;

  let failedRequests = 0;

  // ===================================================
  // PROCESS ONE REQUEST
  // ===================================================

  async function processNext() {
    while (true) {
      const index =
        nextIndex++;

      if (
        index >=
        offsets.length
      ) {
        return;
      }

      const offset =
        offsets[index];

      try {
        const page =
          await fetchFailuresPage(
            dateFrom,
            dateTo,
            offset
          );

        // ---------------------------------------------
        // PROCESS DIRECTLY
        // ---------------------------------------------

        processPage(
          page.items,
          grouped
        );

        loaded +=
          page.items.length;

        successfulSinceScale++;

        // ---------------------------------------------
        // INCREASE CONCURRENCY
        // ---------------------------------------------

        if (
          successfulSinceScale >=
            SCALE_UP_AFTER &&
          concurrency <
            MAX_CONCURRENCY
        ) {
          concurrency =
            Math.min(
              concurrency + 4,
              MAX_CONCURRENCY
            );

          successfulSinceScale = 0;

          console.log(
            `Increasing concurrency to ${concurrency}`
          );
        }
      } catch (error) {
        failedRequests++;

        console.error(
          `Failed offset ${offset}:`,
          error instanceof Error
            ? error.message
            : error
        );

        throw error;
      }
    }
  }

  // ===================================================
  // DYNAMIC BATCH EXECUTION
  // ===================================================

  while (
    nextIndex <
    offsets.length
  ) {
    const currentWorkers =
      Math.min(
        concurrency,
        offsets.length -
          nextIndex
      );

    await Promise.all(
      Array.from(
        {
          length:
            currentWorkers,
        },
        () =>
          processNext()
      )
    );
  }

  // ===================================================
  // SAFETY CHECK
  // ===================================================

  if (
    loaded <
    total
  ) {
    throw new Error(
      `Incomplete data: loaded ${loaded} of ${total}`
    );
  }

  const elapsed =
    Date.now() -
    startTime;

  console.log(
    `Loaded ${loaded}/${total}`
  );

  console.log(
    `Pages: ${pageCount}`
  );

  console.log(
    `Failed requests: ${failedRequests}`
  );

  console.log(
    `Final concurrency: ${concurrency}`
  );

  console.log(
    `Fetch completed in ${elapsed}ms`
  );

  return {
    grouped,
    total,
    loaded,
    elapsed,
  };
}

// =====================================================
// OPERATIONAL DATE
// =====================================================

function buildOperationalDates(
  dateFrom: string,
  dateTo: string
) {
  const from =
    new Date(
      `${dateFrom}T00:00:00.000Z`
    );

  const to =
    new Date(
      `${dateTo}T20:59:59.999Z`
    );

  if (
    Number.isNaN(
      from.getTime()
    ) ||
    Number.isNaN(
      to.getTime()
    )
  ) {
    throw new Error(
      "التاريخ المدخل غير صالح"
    );
  }

  // ===================================================
  // نفس منطق التاريخ بدون تغيير
  // ===================================================

  from.setUTCDate(
    from.getUTCDate() - 1
  );

  from.setUTCHours(
    21,
    0,
    0,
    0
  );

  return {
    dateFrom:
      from.toISOString(),

    dateTo:
      to.toISOString(),
  };
}

// =====================================================
// BUILD DISTRICTS
// =====================================================

function buildDistricts(
  grouped: Record<
    string,
    DistrictAccumulator
  >
): DistrictStats[] {
  return Object.entries(
    grouped
  )
    .map(
      ([
        districtName,
        data,
      ]) => {
        // =============================================
        // ACHIEVEMENT
        //
        // يدخل فقط:
        // 1. fieldVerification
        // 2. resolved
        // 3. avtrReview
        // 4. rejectedSolution
        //
        // لا يدخل:
        // pendingAcceptance
        // inProgress
        // acceptedRejection
        // =============================================

        const achievementCount =
  data.fieldVerification +
  data.resolved +
  data.avtrReview +
  data.rejectedSolution;
        const achievementPercentage =
          data.total > 0
            ? Number(
                (
                  (
                    achievementCount /
                    data.total
                  ) *
                  100
                ).toFixed(1)
              )
            : 0;

        return {
          districtName,

          total:
            data.total,

          pendingAcceptance:
            data.pendingAcceptance,

          inProgress:
            data.inProgress,

          fieldVerification:
            data.fieldVerification,

          resolved:
            data.resolved,

          acceptedRejection:
            data.acceptedRejection,

          rejectedSolution:
            data.rejectedSolution,

          avtrReview:
            data.avtrReview,

          achievementCount,

          achievementPercentage,
        };
      }
    )
    .sort(
      (a, b) =>
        b.total -
        a.total
    );
}

// =====================================================
// MAIN GET
// =====================================================

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(
        request.url
      );

    const dateFromInput =
      searchParams.get(
        "dateFrom"
      );

    const dateToInput =
      searchParams.get(
        "dateTo"
      );

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !dateFromInput ||
      !dateToInput
    ) {
      return NextResponse.json(
        {
          error:
            "dateFrom و dateTo مطلوبان",
        },
        {
          status: 400,
        }
      );
    }

    if (
      dateFromInput >
      dateToInput
    ) {
      return NextResponse.json(
        {
          error:
            "تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية",
        },
        {
          status: 400,
        }
      );
    }

    // =================================================
    // BUILD OPERATIONAL PERIOD
    // =================================================

    const {
      dateFrom,
      dateTo,
    } =
      buildOperationalDates(
        dateFromInput,
        dateToInput
      );

    console.log(
      "===================================="
    );

    console.log(
      "CUMULATIVE REPORT"
    );

    console.log(
      "Selected From:",
      dateFromInput
    );

    console.log(
      "Selected To:",
      dateToInput
    );

    console.log(
      "API Date From:",
      dateFrom
    );

    console.log(
      "API Date To:",
      dateTo
    );

    console.log(
      "===================================="
    );

    // =================================================
    // FETCH
    // =================================================

    const {
      grouped,
      total,
      loaded,
      elapsed,
    } =
      await fetchAndAggregateFailures(
        dateFrom,
        dateTo
      );

    // =================================================
    // DISTRICTS
    // =================================================

    const districts =
      buildDistricts(
        grouped
      );

    // =================================================
    // GRAND TOTALS
    // =================================================

    let grandTotal = 0;

    let grandPendingAcceptance =
      0;

    let grandInProgress =
      0;

    let grandFieldVerification =
      0;

    let grandResolved =
      0;

    let grandAcceptedRejection =
      0;

    let grandRejectedSolution =
      0;

    let grandAvtrReview =
      0;

    // =================================================
    // SUM
    // =================================================

    for (
      const district of districts
    ) {
      grandTotal +=
        district.total;

      grandPendingAcceptance +=
        district.pendingAcceptance;

      grandInProgress +=
        district.inProgress;

      grandFieldVerification +=
        district.fieldVerification;

      grandResolved +=
        district.resolved;

      grandAcceptedRejection +=
        district.acceptedRejection;

      grandRejectedSolution +=
        district.rejectedSolution;

      grandAvtrReview +=
        district.avtrReview;
    }

    // =================================================
    // ACHIEVEMENT
    // =================================================

  const grandAchievement =
  grandAcceptedRejection +
  grandFieldVerification +
  grandResolved +
  grandAvtrReview;

    const grandAchievementPercentage =
      grandTotal > 0
        ? Number(
            (
              (
                grandAchievement /
                grandTotal
              ) *
              100
            ).toFixed(1)
          )
        : 0;

    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      // ===============================================
      // DATES
      // ===============================================

      dateFrom:
        dateFromInput,

      dateTo:
        dateToInput,

      apiDateFrom:
        dateFrom,

      apiDateTo:
        dateTo,

      // ===============================================
      // TOTAL
      // ===============================================

      total:
        grandTotal,

      // ===============================================
      // STATUS
      // ===============================================

      pendingAcceptance:
        grandPendingAcceptance,

      inProgress:
        grandInProgress,

      fieldVerification:
        grandFieldVerification,

      resolved:
        grandResolved,

      acceptedRejection:
        grandAcceptedRejection,

      rejectedSolution:
        grandRejectedSolution,

      avtrReview:
        grandAvtrReview,

      // ===============================================
      // ACHIEVEMENT
      // ===============================================

      achievementCount:
        grandAchievement,

      achievementPercentage:
        grandAchievementPercentage,

      // ===============================================
      // DISTRICTS
      // ===============================================

      districts,

      // ===============================================
      // PERFORMANCE
      // ===============================================

      performance: {
        loaded,

        requested:
          total,

        elapsedMs:
          elapsed,

        pages:
          Math.ceil(
            total /
              PAGE_SIZE
          ),
      },
    });
  } catch (error) {
    console.error(
      "CUMULATIVE REPORT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إنشاء التقرير التراكمي",
      },
      {
        status: 500,
      }
    );
  }
}