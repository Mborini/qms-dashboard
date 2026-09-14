"use client";

import { Button } from "@mantine/core";
import { IconFileSpreadsheet } from "@tabler/icons-react";
import * as XLSX from "xlsx-js-style";

type Movement = {
  id: number;

  movement_date: string;
  shift: string;

  vehicle_id: number;

  work_route: string;

  driver_name: string;

  created_by: number;
  created_at: string;

  plate_number: string;
  capacity: number | null;
  model: string | null;
  type: string | null;

  area_id: number;
  area_name: string;

  created_by_name: string | null;
  created_by_username: string | null;
};

type Props = {
  movements: Movement[];
  filterDate: string | null;
  filterShift: string;
  filterArea?: string;
  filterVehicle?: string;
};

/* =========================================================
   Helpers
========================================================= */

function formatDate(value: string) {
  if (!value) return "-";

  const parts = value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ar-JO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

/* =========================================================
   Styles
========================================================= */

const styles = {
  title: {
    font: {
      name: "Arial",
      sz: 18,
      bold: true,
      color: {
        rgb: "FFFFFF",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "15233C",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
  },

  infoLabel: {
    font: {
      name: "Arial",
      sz: 11,
      bold: true,
      color: {
        rgb: "15233C",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "E9EEF5",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
  },

  infoValue: {
    font: {
      name: "Arial",
      sz: 11,
      color: {
        rgb: "333333",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "F8FAFC",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
  },

  area: {
    font: {
      name: "Arial",
      sz: 13,
      bold: true,
      color: {
        rgb: "FFFFFF",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "2F5597",
      },
    },
    alignment: {
      horizontal: "right",
      vertical: "center",
    },
  },

  header: {
    font: {
      name: "Arial",
      sz: 10,
      bold: true,
      color: {
        rgb: "FFFFFF",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "4472C4",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },
  },

  body: {
    font: {
      name: "Arial",
      sz: 10,
      color: {
        rgb: "222222",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },
  },

  bodyAlt: {
    font: {
      name: "Arial",
      sz: 10,
      color: {
        rgb: "222222",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "F7F9FC",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },
  },

  total: {
    font: {
      name: "Arial",
      sz: 10,
      bold: true,
      color: {
        rgb: "1F1F1F",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "E2F0D9",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
  },

  grandTotal: {
    font: {
      name: "Arial",
      sz: 12,
      bold: true,
      color: {
        rgb: "FFFFFF",
      },
    },
    fill: {
      patternType: "solid",
      fgColor: {
        rgb: "15233C",
      },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
  },
};

/* =========================================================
   Border
========================================================= */

const thinBorder = {
  top: {
    style: "thin",
    color: {
      rgb: "D9E2F3",
    },
  },
  bottom: {
    style: "thin",
    color: {
      rgb: "D9E2F3",
    },
  },
  left: {
    style: "thin",
    color: {
      rgb: "D9E2F3",
    },
  },
  right: {
    style: "thin",
    color: {
      rgb: "D9E2F3",
    },
  },
};

/* =========================================================
   Component
========================================================= */

export default function ExportMovementsExcel({
  movements,
  filterDate,
  filterShift,
  filterArea = "",
  filterVehicle = "",
}: Props) {
  const handleExport = () => {
    if (!movements.length) {
      return;
    }

    /* =====================================================
       Apply filters
    ===================================================== */

    let exportMovements = [...movements];

    if (filterDate) {
      exportMovements =
        exportMovements.filter(
          (movement) =>
            movement.movement_date === filterDate
        );
    }

    if (filterArea.trim()) {
      const search = filterArea
        .trim()
        .toLocaleLowerCase("ar");

      exportMovements =
        exportMovements.filter((movement) =>
          normalize(movement.area_name)
            .toLocaleLowerCase("ar")
            .includes(search)
        );
    }

    if (filterShift.trim()) {
      const search = filterShift
        .trim()
        .toLocaleLowerCase();

      exportMovements =
        exportMovements.filter((movement) =>
          normalize(movement.shift)
            .toLocaleLowerCase()
            .includes(search)
        );
    }

    if (filterVehicle.trim()) {
      const search = filterVehicle
        .trim()
        .toLocaleLowerCase();

      exportMovements =
        exportMovements.filter((movement) =>
          normalize(movement.plate_number)
            .toLocaleLowerCase()
            .includes(search)
        );
    }

    if (!exportMovements.length) {
      return;
    }

    /* =====================================================
       Group by Area
    ===================================================== */

    const areas = new Map<
      string,
      Movement[]
    >();

    exportMovements.forEach((movement) => {
      const area =
        normalize(movement.area_name) ||
        "غير محدد";

      if (!areas.has(area)) {
        areas.set(area, []);
      }

      areas.get(area)!.push(movement);
    });

    const sortedAreas = Array.from(
      areas.entries()
    ).sort(([a], [b]) =>
      a.localeCompare(b, "ar")
    );

    /* =====================================================
       Worksheet
    ===================================================== */

    const rows: any[][] = [];

    /*
     * Row 1
     */

    rows.push([
      "تقرير حركات السيارات",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    /*
     * Row 2
     */

    rows.push([
      "التاريخ",
      filterDate
        ? formatDate(filterDate)
        : "جميع التواريخ",
      "",
      "الشفت",
      filterShift || "جميع الشفتات",
      "",
      "",
      "",
      "",
    ]);

    /*
     * Row 3
     */

    rows.push([
      "عدد الحركات",
      exportMovements.length,
      "",
      "عدد المناطق",
      sortedAreas.length,
      "",
      "",
      "",
      "",
    ]);

    /*
     * Row 4
     */

    rows.push([
      "تاريخ التصدير",
      formatDateTime(
        new Date().toISOString()
      ),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    /*
     * Empty row
     */

    rows.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);

    /* =====================================================
       Headers
    ===================================================== */

    const headers = [
      "#",
      "رقم السيارة",
      "اسم السائق",
      "نوع السيارة",
      "الموديل",
      "السعة",
      "مسار العمل",
      "المسجل",
      "وقت التسجيل",
    ];

    /* =====================================================
       Area tables
    ===================================================== */

    sortedAreas.forEach(
      ([areaName, areaMovements]) => {
        /*
         * Area title
         */

        rows.push([
          `المنطقة: ${areaName}`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        /*
         * Table header
         */

        rows.push(headers);

        /*
         * Data
         */

        areaMovements.forEach(
          (movement, index) => {
            rows.push([
              index + 1,

              movement.plate_number || "-",

              movement.driver_name || "-",

              movement.type || "-",

              movement.model || "-",

              movement.capacity ?? "-",

              movement.work_route || "-",

              movement.created_by_name ||
                movement.created_by_username ||
                "-",

              formatDateTime(
                movement.created_at
              ),
            ]);
          }
        );

        /*
         * Area total
         */

        rows.push([
          `إجمالي ${areaName}`,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          areaMovements.length,
        ]);

        /*
         * Empty row
         */

        rows.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);

        rows.push([
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
      }
    );

    /* =====================================================
       Grand total
    ===================================================== */

    rows.push([
      "الإجمالي العام",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      exportMovements.length,
    ]);

    /* =====================================================
       Create sheet
    ===================================================== */

    const worksheet =
      XLSX.utils.aoa_to_sheet(rows);

    /*
     * RTL
     */

    worksheet["!sheetViews"] = [
      {
        rightToLeft: true,
      },
    ];

    /*
     * Column widths
     */

    worksheet["!cols"] = [
      {
        wch: 8,
      },
      {
        wch: 18,
      },
      {
        wch: 25,
      },
      {
        wch: 20,
      },
      {
        wch: 18,
      },
      {
        wch: 12,
      },
      {
        wch: 42,
      },
      {
        wch: 25,
      },
      {
        wch: 23,
      },
    ];

    /*
     * Row heights
     */

    worksheet["!rows"] = [];

    worksheet["!rows"][0] = {
      hpt: 34,
    };

    worksheet["!rows"][1] = {
      hpt: 24,
    };

    worksheet["!rows"][2] = {
      hpt: 24,
    };

    worksheet["!rows"][3] = {
      hpt: 22,
    };

    /* =====================================================
       Merge title
    ===================================================== */

    worksheet["!merges"] = [
      {
        s: {
          r: 0,
          c: 0,
        },
        e: {
          r: 0,
          c: 8,
        },
      },
    ];

    /*
     * We will merge every area title
     * and grand total labels later.
     */

    let currentRow = 5;

    sortedAreas.forEach(
      ([areaName, areaMovements]) => {
        /*
         * Area title row
         */

        worksheet["!merges"]!.push({
          s: {
            r: currentRow,
            c: 0,
          },
          e: {
            r: currentRow,
            c: 8,
          },
        });

        currentRow += 1;

        /*
         * Header
         */

        currentRow += 1;

        /*
         * Data
         */

        currentRow +=
          areaMovements.length;

        /*
         * Area total
         *
         * Merge columns A:H
         */

        worksheet["!merges"]!.push({
          s: {
            r: currentRow,
            c: 0,
          },
          e: {
            r: currentRow,
            c: 7,
          },
        });

        currentRow += 3;
      }
    );

    /*
     * Grand total merge A:H
     */

    worksheet["!merges"]!.push({
      s: {
        r: currentRow,
        c: 0,
      },
      e: {
        r: currentRow,
        c: 7,
      },
    });

    /* =====================================================
       Style title
    ===================================================== */

    worksheet["A1"].s = {
      ...styles.title,
      border: thinBorder,
    };

    /*
     * Info cells
     */

    const infoCells = [
      "A2",
      "D2",
      "A3",
      "D3",
      "A4",
    ];

    infoCells.forEach((cell) => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          ...styles.infoLabel,
          border: thinBorder,
        };
      }
    });

    const infoValues = [
      "B2",
      "E2",
      "B3",
      "E3",
      "B4",
    ];

    infoValues.forEach((cell) => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          ...styles.infoValue,
          border: thinBorder,
        };
      }
    });

    /* =====================================================
       Style area tables
    ===================================================== */

    let rowIndex = 5;

    sortedAreas.forEach(
      ([areaName, areaMovements]) => {
        /*
         * Area title
         */

        const areaCell =
          worksheet[
            XLSX.utils.encode_cell({
              r: rowIndex,
              c: 0,
            })
          ];

        if (areaCell) {
          areaCell.s = {
            ...styles.area,
            border: {
              top: {
                style: "medium",
                color: {
                  rgb: "15233C",
                },
              },
              bottom: {
                style: "medium",
                color: {
                  rgb: "15233C",
                },
              },
              left: {
                style: "medium",
                color: {
                  rgb: "15233C",
                },
              },
              right: {
                style: "medium",
                color: {
                  rgb: "15233C",
                },
              },
            },
          };
        }

        rowIndex++;

        /*
         * Header
         */

        for (
          let col = 0;
          col < 9;
          col++
        ) {
          const cell =
            worksheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: col,
              })
            ];

          if (cell) {
            cell.s = {
              ...styles.header,
              border: thinBorder,
            };
          }
        }

        /*
         * Header height
         */

        if (
          worksheet["!rows"]
        ) {
          worksheet["!rows"][
            rowIndex
          ] = {
            hpt: 30,
          };
        }

        rowIndex++;

        /*
         * Data
         */

        areaMovements.forEach(
          (_, index) => {
            for (
              let col = 0;
              col < 9;
              col++
            ) {
              const cell =
                worksheet[
                  XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: col,
                  })
                ];

              if (cell) {
                cell.s = {
                  ...(index % 2 === 0
                    ? styles.body
                    : styles.bodyAlt),

                  border:
                    thinBorder,
                };
              }
            }

            if (
              worksheet["!rows"]
            ) {
              worksheet["!rows"][
                rowIndex
              ] = {
                hpt: 25,
              };
            }

            rowIndex++;
          }
        );

        /*
         * Area total
         */

        for (
          let col = 0;
          col < 9;
          col++
        ) {
          const cell =
            worksheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: col,
              })
            ];

          if (cell) {
            cell.s = {
              ...styles.total,
              border: {
                top: {
                  style: "thin",
                  color: {
                    rgb: "A9D18E",
                  },
                },
                bottom: {
                  style: "thin",
                  color: {
                    rgb: "A9D18E",
                  },
                },
                left: {
                  style: "thin",
                  color: {
                    rgb: "A9D18E",
                  },
                },
                right: {
                  style: "thin",
                  color: {
                    rgb: "A9D18E",
                  },
                },
              },
            };
          }
        }

        if (
          worksheet["!rows"]
        ) {
          worksheet["!rows"][
            rowIndex
          ] = {
            hpt: 25,
          };
        }

        rowIndex += 3;
      }
    );

    /* =====================================================
       Grand total style
    ===================================================== */

    for (
      let col = 0;
      col < 9;
      col++
    ) {
      const cell =
        worksheet[
          XLSX.utils.encode_cell({
            r: rowIndex,
            c: col,
          })
        ];

      if (cell) {
        cell.s = {
          ...styles.grandTotal,
          border: {
            top: {
              style: "medium",
              color: {
                rgb: "15233C",
              },
            },
            bottom: {
              style: "medium",
              color: {
                rgb: "15233C",
              },
            },
            left: {
              style: "medium",
              color: {
                rgb: "15233C",
              },
            },
            right: {
              style: "medium",
              color: {
                rgb: "15233C",
              },
            },
          },
        };
      }
    }

    if (worksheet["!rows"]) {
      worksheet["!rows"][rowIndex] = {
        hpt: 30,
      };
    }

    /* =====================================================
       Auto Filter
    ===================================================== */

    /*
     * Since there are multiple separate tables,
     * Excel supports only one sheet-level autoFilter.
     *
     * We leave it disabled so it doesn't create a
     * misleading filter over multiple area tables.
     */

    /* =====================================================
       Workbook
    ===================================================== */

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "حركات السيارات"
    );

    /*
     * Workbook properties
     */

    if (
      workbook.Props
    ) {
      workbook.Props.Title =
        "تقرير حركات السيارات";

      workbook.Props.Subject =
        "تقرير حركات السيارات";

      workbook.Props.Author =
        "Operations System";

      workbook.Props.Company =
        "Operations System";

      workbook.Props.Category =
        "Operations";
    }

    /* =====================================================
       File name
    ===================================================== */

    const datePart =
      filterDate ||
      "جميع_التواريخ";

    const shiftPart =
      filterShift.trim() ||
      "جميع_الشفتات";

    const fileName =
      `تقرير_حركات_السيارات_${datePart}_${shiftPart}.xlsx`;

    /* =====================================================
       Download
    ===================================================== */

    XLSX.writeFile(
      workbook,
      fileName
    );
  };

  /* =======================================================
     Button
  ======================================================= */

  return (
    <Button
      variant="light"
      color="green"
      leftSection={
        <IconFileSpreadsheet
          size={18}
        />
      }
      onClick={handleExport}
      disabled={
        movements.length === 0
      }
    >
      تصدير Excel
    </Button>
  );
}