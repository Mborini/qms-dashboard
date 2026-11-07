
// app/lib/kpis.js
// جلب المخالفات المطلوبة فقط من API مباشرة

const API_BASE_URL = "https://api.avtr.jo/api/service-provider";

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 15000;
const RETRY_DELAY = 1000;
const PAGE_SIZE = 100;
const CONCURRENCY = 8;

const ALLOWED_STATUSES = [
  "ResolutionRejected",
  "PendingSpValidation",
  "InProgress",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(error) {
  const message = String(error?.message || "").toLowerCase();

  return [
    "timeout",
    "timed out",
    "fetch failed",
    "connect",
    "socket",
    "econnreset",
    "econnrefused",
    "und_err",
  ].some((part) => message.includes(part));
}

export async function fetchWithRetry(url, options = {}) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        cache: "no-store",
      });

      if (
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500
      ) {
        lastError = new Error(`API returned status ${response.status}`);

        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * 2 ** (attempt - 1));
          continue;
        }

        throw lastError;
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt >= MAX_RETRIES) {
        break;
      }

      await sleep(RETRY_DELAY * 2 ** (attempt - 1));
    }
  }

  throw lastError || new Error("Request failed");
}

// الفترة الافتراضية: 1/8/2026 حتى الآن بتوقيت عمّان
export function defaultTodayRange() {
  return {
    dateFrom: "2026-07-31T21:00:00.000Z",
    dateTo: new Date().toISOString(),
  };
}

function getSelectedStatuses(statuses = []) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    return ALLOWED_STATUSES;
  }

  return statuses.filter((status) => ALLOWED_STATUSES.includes(status));
}

function buildFailuresUrl({
  districtNames,
  statuses,
  dateFrom,
  dateTo,
  sortBy,
  sortDirection,
  offset,
}) {
  const params = new URLSearchParams({
    districtNames,
    statuses: statuses.join(","),
    limit: String(PAGE_SIZE),
    offset: String(offset),
    dateFrom,
    dateTo,
    sortBy,
    sortDirection,
  });

  return `${API_BASE_URL}/failures?${params.toString()}`;
}

async function fetchPage(params, offset, headers) {
  const url = buildFailuresUrl({
    ...params,
    offset,
  });

  const response = await fetchWithRetry(url, { headers });
  return response.json();
}

// جلب أول صفحة ثم بقية الصفحات بالتوازي
export async function fetchAllFailures({
  token,
  districtNames,
  statuses = ALLOWED_STATUSES,
  dateFrom,
  dateTo,
  sortBy = "reportedDate",
  sortDirection = "desc",
}) {
  const selectedStatuses = getSelectedStatuses(statuses);

  if (!selectedStatuses.length) {
    return [];
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  const params = {
    districtNames,
    statuses: selectedStatuses,
    dateFrom,
    dateTo,
    sortBy,
    sortDirection,
  };

  // أول طلب لمعرفة العدد الإجمالي
  const firstPage = await fetchPage(params, 0, headers);
  const allFailures = [...(firstPage.items || [])];
  const total = Number(firstPage.total || 0);

  if (allFailures.length >= total || !total) {
    return allFailures;
  }

  // تجهيز أرقام الصفحات المتبقية
  const offsets = [];

  for (
    let offset = PAGE_SIZE;
    offset < total;
    offset += PAGE_SIZE
  ) {
    offsets.push(offset);
  }

  // جلب الصفحات على دفعات متوازية
  for (let i = 0; i < offsets.length; i += CONCURRENCY) {
    const batch = offsets.slice(i, i + CONCURRENCY);

    const pages = await Promise.all(
      batch.map((offset) => fetchPage(params, offset, headers)),
    );

    for (const page of pages) {
      if (page.items?.length) {
        allFailures.push(...page.items);
      }
    }
  }

  return allFailures;
}

// إرجاع العدد وأرقام المخالفات فقط
export async function countFailuresForDistrict(params) {
  const failures = await fetchAllFailures(params);
  const ids = failures.map((failure) => failure.id);

  return {
    total: ids.length,
    ids,
  };
}
