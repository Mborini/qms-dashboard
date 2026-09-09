import * as XLSX from "xlsx-js-style";

type MaintenanceRecord = {
  id: number;

  vehicle_id: number;
  plate_number: string;
  weight: number | null;
  capacity: number | null;
  manufacture_year: number | null;
  model: string | null;
  area: string | null;

  kpi_id: number;
  kpi_name: string;

  sub_kpi_id: number;
  sub_kpi_name: string;

  entry_at: string;
  exit_at: string | null;

  status: "open" | "closed";

  description: string | null;
  notes: string | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
};

type ExportFilters = {
  search?: string;
  date?: string;
  vehicle?: string;
  kpi?: string;
  subKpi?: string;
  status?: string;
};

// =========================================================
// COLORS
// =========================================================

const COLORS = {
  primary: "1F4E78",
  secondary: "2F75B5",

  veryLightBlue: "F4F8FC",

  border: "D9E2F3",
  rowBorder: "E5E7EB",

  text: "1F2937",
  muted: "6B7280",

  white: "FFFFFF",

  openText: "C55A11",
  openBg: "FCE4D6",

  closedText: "548235",
  closedBg: "E2F0D9",

  alternateRow: "F8FAFC",
};

// =========================================================
// BORDER
// =========================================================

const border = {
  top: {
    style: "thin",
    color: {
      rgb: COLORS.border,
    },
  },

  bottom: {
    style: "thin",
    color: {
      rgb: COLORS.border,
    },
  },

  left: {
    style: "thin",
    color: {
      rgb: COLORS.border,
    },
  },

  right: {
    style: "thin",
    color: {
      rgb: COLORS.border,
    },
  },
};

const dataBorder = {
  top: {
    style: "thin",
    color: {
      rgb: COLORS.rowBorder,
    },
  },

  bottom: {
    style: "thin",
    color: {
      rgb: COLORS.rowBorder,
    },
  },

  left: {
    style: "thin",
    color: {
      rgb: COLORS.rowBorder,
    },
  },

  right: {
    style: "thin",
    color: {
      rgb: COLORS.rowBorder,
    },
  },
};

// =========================================================
// DATE FORMAT
// =========================================================

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  const seconds = String(
    date.getSeconds()
  ).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// =========================================================
// DURATION
// DD Day HH:MM:SS
// =========================================================

function formatDuration(
  entryAt: string,
  exitAt: string | null
): string {
  const start =
    new Date(entryAt).getTime();

  if (Number.isNaN(start)) {
    return "00 Day 00:00:00";
  }

  const end = exitAt
    ? new Date(exitAt).getTime()
    : Date.now();

  if (Number.isNaN(end)) {
    return "00 Day 00:00:00";
  }

  const difference = Math.max(
    0,
    end - start
  );

  const totalSeconds = Math.floor(
    difference / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  const pad = (value: number) =>
    String(value).padStart(2, "0");

  return `${pad(days)} Day ${pad(hours)}:${pad(
    minutes
  )}:${pad(seconds)}`;
}

// =========================================================
// EXPORT
// =========================================================

export async function exportMaintenanceExcel({
  records,
  filters,
}: {
  records: MaintenanceRecord[];
  filters?: ExportFilters;
}): Promise<void> {
  if (
    !records ||
    records.length === 0
  ) {
    throw new Error(
      "لا توجد سجلات مطابقة للفلاتر لتصديرها"
    );
  }

  // =======================================================
  // WORKBOOK
  // =======================================================

  const workbook =
    XLSX.utils.book_new();

  // =======================================================
  // DATA
  // =======================================================

  const rows: any[][] = [];

  // =======================================================
  // ROW 1 - TITLE
  // =======================================================

  rows.push([
    "سجل صيانة المركبات",
  ]);

  // =======================================================
  // ROW 2 - REPORT INFO
  // =======================================================

  rows.push([
    `Export Date: ${new Date().toLocaleString(
      "en-JO"
    )} | Total Records: ${records.length}`,
  ]);

  // =======================================================
  // ROW 3 - HEADERS
  // =======================================================

  rows.push([
    "#",
    "رقم المركبة",
    "الموديل",
    "المنطقة",
    "نوع الصيانة",
    "التصنيف الفرعي للصيانة",
    "وقت الدخول",
    "وقت الخروج",
    "مدة الصيانة",
    "الحالة",
    "وصف الصيانة",
    "الملاحظات",
    "تم الإدخال بواسطة",
    "تم التحديث بواسطة",
  ]);

  // =======================================================
  // ROW 4+ - RECORDS
  // =======================================================

  records.forEach(
    (record, index) => {
      rows.push([
        index + 1,

        record.plate_number ||
          "-",

        record.model ||
          "-",

        record.area ||
          "-",

        record.kpi_name ||
          "-",

        record.sub_kpi_name ||
          "-",

        formatDateTime(
          record.entry_at
        ),

        formatDateTime(
          record.exit_at
        ),

        formatDuration(
          record.entry_at,
          record.exit_at
        ),

        record.status === "open"
          ? "مفتوحة"
          : "مغلقة",

        record.description ||
          "-",

        record.notes ||
          "-",

        record.created_by ||
          "-",

        record.updated_by ||
          "-",
      ]);
    }
  );

  // =======================================================
  // CREATE WORKSHEET
  // =======================================================

  const worksheet =
    XLSX.utils.aoa_to_sheet(rows);

  // =======================================================
  // MERGES
  // =======================================================

  worksheet["!merges"] = [
    // Title
    {
      s: {
        r: 0,
        c: 0,
      },

      e: {
        r: 0,
        c: 13,
      },
    },

    // Report information
    {
      s: {
        r: 1,
        c: 0,
      },

      e: {
        r: 1,
        c: 13,
      },
    },
  ];

  // =======================================================
  // COLUMN WIDTHS
  // =======================================================

  const headers = rows[2];

  const columnWidths =
    headers.map(
      (
        _header: any,
        columnIndex: number
      ) => {
        // -----------------------------------------------
        // # COLUMN
        // -----------------------------------------------

        if (columnIndex === 0) {
          return {
            wch: 5,
          };
        }

        // -----------------------------------------------
        // FIND LONGEST CONTENT
        // -----------------------------------------------

        let maxLength = 0;

        rows.forEach((row) => {
          const value =
            row[columnIndex];

          if (
            value === null ||
            value === undefined
          ) {
            return;
          }

          const text =
            String(value).trim();

          maxLength =
            Math.max(
              maxLength,
              text.length
            );
        });

        // -----------------------------------------------
        // DESCRIPTION / NOTES
        // -----------------------------------------------

        if (
          columnIndex === 10 ||
          columnIndex === 11
        ) {
          return {
            wch: Math.min(
              Math.max(
                maxLength + 2,
                15
              ),
              40
            ),
          };
        }

        // -----------------------------------------------
        // NORMAL COLUMNS
        // -----------------------------------------------

        return {
          wch: Math.min(
            Math.max(
              maxLength + 2,
              10
            ),
            28
          ),
        };
      }
    );

  worksheet["!cols"] =
    columnWidths;

  // =======================================================
  // ROW HEIGHTS
  // =======================================================

  worksheet["!rows"] = [
    // Title
    {
      hpt: 38,
    },

    // Report info
    {
      hpt: 26,
    },

    // Headers
    {
      hpt: 34,
    },
  ];

  // =======================================================
  // TITLE STYLE
  // =======================================================

  worksheet["A1"].s = {
    font: {
      name: "Arial",
      sz: 18,
      bold: true,

      color: {
        rgb: COLORS.white,
      },
    },

    fill: {
      patternType: "solid",

      fgColor: {
        rgb: COLORS.primary,
      },
    },

    alignment: {
      horizontal: "center",
      vertical: "center",
    },

    border,
  };

  // =======================================================
  // REPORT INFO STYLE
  // =======================================================

  worksheet["A2"].s = {
    font: {
      name: "Arial",
      sz: 10,

      color: {
        rgb: COLORS.muted,
      },
    },

    fill: {
      patternType: "solid",

      fgColor: {
        rgb: COLORS.veryLightBlue,
      },
    },

    alignment: {
      horizontal: "center",
      vertical: "center",
    },

    border,
  };

  // =======================================================
  // HEADER STYLE
  // =======================================================

  const headerRow = 2;

  for (
    let col = 0;
    col < 14;
    col++
  ) {
    const cell =
      worksheet[
        XLSX.utils.encode_cell({
          r: headerRow,
          c: col,
        })
      ];

    if (!cell) {
      continue;
    }

    cell.s = {
      font: {
        name: "Arial",
        sz: 11,
        bold: true,

        color: {
          rgb: COLORS.white,
        },
      },

      fill: {
        patternType: "solid",

        fgColor: {
          rgb: COLORS.secondary,
        },
      },

      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },

      border,
    };
  }

  // =======================================================
  // DATA STYLING
  // =======================================================

  // Data starts at Excel row 4
  // Zero-based row index = 3

  const firstDataRow = 3;

  records.forEach(
    (record, index) => {
      const rowNumber =
        firstDataRow + index;

      // -----------------------------------------------
      // ROW HEIGHT
      // -----------------------------------------------

      if (!worksheet["!rows"]) {
        worksheet["!rows"] = [];
      }

      worksheet["!rows"][
        rowNumber
      ] = {
        hpt: 32,
      };

      // -----------------------------------------------
      // CELLS
      // -----------------------------------------------

      for (
        let col = 0;
        col < 14;
        col++
      ) {
        const cell =
          worksheet[
            XLSX.utils.encode_cell({
              r: rowNumber,
              c: col,
            })
          ];

        if (!cell) {
          continue;
        }

        cell.s = {
          font: {
            name: "Arial",
            sz: 10,

            color: {
              rgb: COLORS.text,
            },
          },

          // ALL CONTENT CENTER
          alignment: {
            horizontal: "center",
            vertical: "center",

            // Description and notes can wrap
            wrapText:
              col === 10 ||
              col === 11,
          },

          border: dataBorder,
        };

        // ---------------------------------------------
        // ALTERNATE ROW
        // ---------------------------------------------

        if (index % 2 === 1) {
          cell.s.fill = {
            patternType: "solid",

            fgColor: {
              rgb: COLORS.alternateRow,
            },
          };
        }
      }

      // =================================================
      // STATUS CELL
      // =================================================

      const statusCell =
        worksheet[
          XLSX.utils.encode_cell({
            r: rowNumber,
            c: 9,
          })
        ];

      if (statusCell) {
        if (
          record.status === "open"
        ) {
          statusCell.s = {
            font: {
              name: "Arial",
              sz: 10,
              bold: true,

              color: {
                rgb: COLORS.openText,
              },
            },

            fill: {
              patternType: "solid",

              fgColor: {
                rgb: COLORS.openBg,
              },
            },

            alignment: {
              horizontal: "center",
              vertical: "center",
            },

            border: dataBorder,
          };
        } else {
          statusCell.s = {
            font: {
              name: "Arial",
              sz: 10,
              bold: true,

              color: {
                rgb: COLORS.closedText,
              },
            },

            fill: {
              patternType: "solid",

              fgColor: {
                rgb: COLORS.closedBg,
              },
            },

            alignment: {
              horizontal: "center",
              vertical: "center",
            },

            border: dataBorder,
          };
        }
      }
    }
  );

  // =======================================================
  // AUTO FILTER
  // =======================================================

  // Header is Excel row 3
  // Data ends at Excel row 3 + records.length

  worksheet["!autofilter"] = {
    ref: `A3:N${
      3 + records.length
    }`,
  };

  // =======================================================
  // FREEZE HEADER
  // =======================================================

  // Freeze first 3 rows:
  // Title
  // Report info
  // Headers

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 3,
  };

  // =======================================================
  // RTL
  // =======================================================

  worksheet["!sheetViews"] = [
    {
      rightToLeft: true,
    },
  ];

  // =======================================================
  // SUMMARY
  // =======================================================

  const summaryRow =
    firstDataRow +
    records.length +
    1;

  XLSX.utils.sheet_add_aoa(
    worksheet,

    [
      [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        `إجمالي السجلات: ${records.length}`,
        "",
        "",
        "",
        "",
        "",
      ],
    ],

    {
      origin: `A${summaryRow + 1}`,
    }
  );

  const summaryCell =
    worksheet[
      XLSX.utils.encode_cell({
        r: summaryRow,
        c: 8,
      })
    ];

  if (summaryCell) {
    summaryCell.s = {
      font: {
        name: "Arial",
        sz: 11,
        bold: true,

        color: {
          rgb: COLORS.primary,
        },
      },

      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };
  }

  // =======================================================
  // SHEET NAME
  // =======================================================

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "سجل الصيانة"
  );

  // =======================================================
  // DOWNLOAD
  // =======================================================

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  const fileName =
    `maintenance-history-${date}.xlsx`;

  XLSX.writeFile(
    workbook,
    fileName
  );
}