import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const token = process.env.Main_AVTR_TOKEN_Admin;
     

    if (!token) {
      return NextResponse.json(
        {
          error:
            "AVTR_TOKEN is not configured",
        },
        {
          status: 500,
        }
      );
    }

    const {
      searchParams,
    } = new URL(
      request.url
    );

    // =====================================================
    // Filters
    // =====================================================

    const districtNames =
      searchParams.get(
        "districtNames"
      ) || "";

    const kpiNameAr =
      searchParams.get(
        "kpiNameAr"
      ) || "";

    const status =
      searchParams.get(
        "status"
      ) || "";

    // =====================================================
    // Date
    // نفس منطق API الأصلي بالضبط
    // =====================================================

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      now.getMonth() + 1;

    const day =
      now.getDate();

    const dateFrom =
      searchParams.get(
        "dateFrom"
      ) ||
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}T21:00:00.000Z`;

    const dateTo =
      searchParams.get(
        "dateTo"
      ) ||
      `${year}-${String(
        month
      ).padStart(
        2,
        "0"
      )}-${String(
        day
      ).padStart(
        2,
        "0"
      )}T20:59:59.999Z`;

    const sortBy =
      searchParams.get(
        "sortBy"
      ) ||
      "reportedDate";

    const sortDirection =
      searchParams.get(
        "sortDirection"
      ) ||
      "desc";

    // =====================================================
    // Pagination
    // =====================================================

    const pageSize = 100;

    let allFailures = [];

    let offset = 0;

    let total = 0;

    do {
      const url =
        `https://api.avtr.jo/api/service-provider/failures?` +
        `limit=${pageSize}` +
        `&offset=${offset}` +
        `&districtNames=${encodeURIComponent(
          districtNames
        )}` +
        `&dateFrom=${encodeURIComponent(
          dateFrom
        )}` +
        `&dateTo=${encodeURIComponent(
          dateTo
        )}` +
        `&sortBy=${encodeURIComponent(
          sortBy
        )}` +
        `&sortDirection=${encodeURIComponent(
          sortDirection
        )}`;

    
      const response =
        await fetch(
          url,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              Accept:
                "application/json",
            },

            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failures API Error:",
          response.status,
          errorText
        );

        throw new Error(
          `Failures API Error: ${response.status}`
        );
      }

      const result =
        await response.json();

      total =
        result.total || 0;

      allFailures.push(
        ...(result.items || [])
      );

      offset +=
        pageSize;

    } while (
      allFailures.length <
      total
    );

    // =====================================================
    // Details
    // =====================================================

    const items =
      await Promise.all(
        allFailures.map(
          async (item) => {
            try {
              const detailsResponse =
                await fetch(
                  `https://api.avtr.jo/api/service-provider/failures/${item.id}`,
                  {
                    headers: {
                      Authorization:
                        `Bearer ${token}`,

                      Accept:
                        "application/json",
                    },

                    cache:
                      "no-store",
                  }
                );

              if (
                !detailsResponse.ok
              ) {
                return {
                  id:
                    item.id,

                  kpiNameAr:
                    item.kpiNameAr ??
                    null,

                  latitude:
                    item.latitude ??
                    null,

                  longitude:
                    item.longitude ??
                    null,

                  districtName:
                    item.districtName ??
                    null,

                  blockName:
                    item.blockName ??
                    null,

                  status:
                    item.status ??
                    null,
                };
              }

              const details =
                await detailsResponse.json();

              return {
                id:
                  item.id,

                kpiNameAr:
                  details.kpiNameAr ??
                  item.kpiNameAr ??
                  null,

                latitude:
                  details.latitude ??
                  item.latitude ??
                  null,

                longitude:
                  details.longitude ??
                  item.longitude ??
                  null,

                districtName:
                  details.districtName ??
                  item.districtName ??
                  null,

                blockName:
                  details.blockName ??
                  item.blockName ??
                  null,

                status:
                  details.status ??
                  item.status ??
                  null,
              };

            } catch (error) {
              console.error(
                `Details Error for ${item.id}:`,
                error
              );

              return {
                id:
                  item.id,

                kpiNameAr:
                  item.kpiNameAr ??
                  null,

                latitude:
                  item.latitude ??
                  null,

                longitude:
                  item.longitude ??
                  null,

                districtName:
                  item.districtName ??
                  null,

                blockName:
                  item.blockName ??
                  null,

                status:
                  item.status ??
                  null,
              };
            }
          }
        )
      );

    // =====================================================
    // KPI Filter
    // =====================================================

    let filteredItems =
      items;

    if (kpiNameAr) {
      const selectedKpi =
        kpiNameAr.trim();

      filteredItems =
        filteredItems.filter(
          (item) => {
            const itemKpi =
              String(
                item.kpiNameAr ||
                  ""
              ).trim();

            return (
              itemKpi ===
              selectedKpi
            );
          }
        );
    }

    // =====================================================
    // Status Filter
    // =====================================================

    if (status) {
      const selectedStatus =
        status.trim();

      filteredItems =
        filteredItems.filter(
          (item) => {
            const itemStatus =
              String(
                item.status ||
                  ""
              ).trim();

            return (
              itemStatus ===
              selectedStatus
            );
          }
        );
    }

    // =====================================================
    // Valid Coordinates
    // =====================================================

    const validItems =
      filteredItems.filter(
        (item) => {
          const latitude =
            Number(
              item.latitude
            );

          const longitude =
            Number(
              item.longitude
            );

          return (
            Number.isFinite(
              latitude
            ) &&
            Number.isFinite(
              longitude
            )
          );
        }
      );

    // =====================================================
    // Available Districts
    // =====================================================

    const districts = [
      ...new Set(
        items
          .map(
            (item) =>
              item.districtName
          )
          .filter(Boolean)
      ),
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ar"
        )
    );

    // =====================================================
    // Available KPIs
    // =====================================================

    const kpis = [
      ...new Set(
        items
          .map(
            (item) =>
              item.kpiNameAr
          )
          .filter(Boolean)
      ),
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ar"
        )
    );

    // =====================================================
    // Available Statuses
    // =====================================================

    const statuses = [
      ...new Set(
        items
          .map(
            (item) =>
              item.status
          )
          .filter(Boolean)
      ),
    ];

    
    // =====================================================
    // Response
    // =====================================================

    return NextResponse.json({
      total:
        validItems.length,

      items:
        validItems,

      filters: {
        districts,
        kpis,
        statuses,
      },
    });

  } catch (error) {
    console.error(
      "MAP API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "حدث خطأ في API",
      },
      {
        status: 500,
      }
    );
  }
}