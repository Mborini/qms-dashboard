"use client";

import * as XLSX from "xlsx-js-style";

import {
  getNoteType,
} from "@/data/routeNotes";

// ========================================================
// COLORS
// ========================================================

const COLORS = {
  darkBlue: "1F4E78",
  lightBlue: "EAF3F8",
  lighterBlue: "D6E8F5",
  white: "FFFFFF",
  border: "9EADBA",
  text: "1F2937",
};

// ========================================================
// SAFE VALUE
// ========================================================

const safeValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return String(value);
};

// ========================================================
// NOTE TYPE
// ========================================================

const getNoteTypeLabel = (value) => {
  const type = getNoteType(value);

  return (
    type?.label ||
    value ||
    "-"
  );
};

// ========================================================
// ARABIC DAY
// ========================================================

const getArabicDay = (date) => {
  const days = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  return days[date.getDay()];
};

// ========================================================
// DATE
// ========================================================

const formatDate = (date) => {
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year =
    date.getFullYear();

  return `${day}-${month}-${year}`;
};

// ========================================================
// TIME
// ========================================================

const formatTime = (date) => {
  return date.toLocaleTimeString(
    "ar-JO",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
};

// ========================================================
// FILE DATE
// ========================================================

const formatFileDate = (date) => {
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const year =
    date.getFullYear();

  return `${day}-${month}-${year}`;
};

// ========================================================
// SANITIZE FILE NAME
// ========================================================

const sanitizeFileName = (value) => {
  return String(value)
    .replace(
      /[\\/:*?"<>|]/g,
      ""
    )
    .replace(
      /\s+/g,
      "_"
    )
    .trim();
};

// ========================================================
// DISTRICT TITLE
// ========================================================

const getDistrictTitle = (notes) => {
  const districts = [
    ...new Set(
      notes
        .map(
          (note) =>
            note?.district
        )
        .filter(Boolean)
    ),
  ];

  if (
    districts.length === 1
  ) {
    return districts[0];
  }

  return "جميع المناطق";
};

// ========================================================
// BORDER
// ========================================================

const thinBorder = {
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

// ========================================================
// EXPORT
// ========================================================

export const exportRouteNotesExcel = ({
  notes = [],
}) => {

  // ======================================================
  // VALIDATION
  // ======================================================

  if (
    !Array.isArray(notes) ||
    notes.length === 0
  ) {
    alert(
      "لا توجد ملاحظات لتصديرها."
    );

    return;
  }

  // ======================================================
  // DATE / TIME
  // ======================================================

  const now =
    new Date();

  const date =
    formatDate(now);

  const day =
    getArabicDay(now);

  const time =
    formatTime(now);

  const fileDate =
    formatFileDate(now);

  // ======================================================
  // DISTRICT
  // ======================================================

  const district =
    getDistrictTitle(
      notes
    );

  // ======================================================
  // DATA
  // ======================================================

  const data = [];

  // ======================================================
  // ROWS
  //
  // 0 = TITLE
  // 1 = INFORMATION
  // 2 = EMPTY
  // 3 = TABLE HEADER
  // 4 = DATA
  // ======================================================

  const DATA_START_ROW = 4;

  let currentExcelRow =
    DATA_START_ROW;

  // ======================================================
  // TITLE
  // ======================================================

  data.push([
    `ملاحظات التتبع - ${district}`,
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  // ======================================================
  // INFORMATION
  //
  // A2:B2 = DATE
  // C2:D2 = DAY
  // E2    = TIME
  // F2:G2 = COUNT
  // ======================================================

  data.push([
    `التاريخ: ${date}`,
    "",

    `اليوم: ${day}`,
    "",

    `الساعة: ${time}`,

    `عدد الملاحظات: ${notes.length}`,
    "",
  ]);

  // ======================================================
  // EMPTY ROW
  // ======================================================

  data.push([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  // ======================================================
  // TABLE HEADER
  // ======================================================

  data.push([
    "#",
    "المنطقة",
    "القطعة",
    "المركبة",
    "نوع الملاحظة",
    "اسم الشارع",
    "عدد الحاويات",
  ]);

  // ======================================================
  // MERGES
  // ======================================================

  const merges = [

    // ----------------------------------------------------
    // TITLE
    // A1:G1
    // ----------------------------------------------------

    {
      s: {
        r: 0,
        c: 0,
      },

      e: {
        r: 0,
        c: 6,
      },
    },

    // ----------------------------------------------------
    // DATE
    // A2:B2
    // ----------------------------------------------------

    {
      s: {
        r: 1,
        c: 0,
      },

      e: {
        r: 1,
        c: 1,
      },
    },

    // ----------------------------------------------------
    // DAY
    // C2:D2
    // ----------------------------------------------------

    {
      s: {
        r: 1,
        c: 2,
      },

      e: {
        r: 1,
        c: 3,
      },
    },

    // ----------------------------------------------------
    // COUNT
    // F2:G2
    // ----------------------------------------------------

    {
      s: {
        r: 1,
        c: 5,
      },

      e: {
        r: 1,
        c: 6,
      },
    },

    // ----------------------------------------------------
    // IMPORTANT
    //
    // E2 = TIME
    // NO MERGE
    // ----------------------------------------------------

  ];

  // ======================================================
  // NOTES
  // ======================================================

  notes.forEach(
    (
      note,
      noteIndex
    ) => {

      // ==================================================
      // STREETS
      // ==================================================

      const streets =
        Array.isArray(
          note?.streets
        )
          ? note.streets
          : [];

      // ==================================================
      // ROW COUNT
      // ==================================================

      const rowCount =
        streets.length > 0
          ? streets.length
          : 1;

      // ==================================================
      // START / END
      // ==================================================

      const startRow =
        currentExcelRow;

      const endRow =
        currentExcelRow +
        rowCount -
        1;

      // ==================================================
      // NO STREETS
      // ==================================================

      if (
        streets.length === 0
      ) {

        data.push([
          noteIndex + 1,

          safeValue(
            note?.district
          ),

          safeValue(
            note?.block
          ),

          safeValue(
            note?.vehicle
          ),

          getNoteTypeLabel(
            note?.noteType
          ),

          "-",

          "-",
        ]);

      }

      // ==================================================
      // STREETS
      // ==================================================

      else {

        streets.forEach(
          (
            street,
            streetIndex
          ) => {

            data.push([

              // # 
              streetIndex === 0
                ? noteIndex + 1
                : "",

              // المنطقة
              streetIndex === 0
                ? safeValue(
                    note?.district
                  )
                : "",

              // القطعة
              streetIndex === 0
                ? safeValue(
                    note?.block
                  )
                : "",

              // المركبة
              streetIndex === 0
                ? safeValue(
                    note?.vehicle
                  )
                : "",

              // نوع الملاحظة
              streetIndex === 0
                ? getNoteTypeLabel(
                    note?.noteType
                  )
                : "",

              // الشارع
              safeValue(
                street?.name ||
                  street?.street
              ),

              // عدد الحاويات
              safeValue(
                street?.containerCount ??
                  street?.containers ??
                  0
              ),

            ]);

          }
        );

      }

      // ==================================================
      // MERGE SHARED DATA
      // ==================================================

      if (
        rowCount > 1
      ) {

        // ------------------------------------------------
        // #
        // ------------------------------------------------

        merges.push({
          s: {
            r: startRow,
            c: 0,
          },

          e: {
            r: endRow,
            c: 0,
          },
        });

        // ------------------------------------------------
        // المنطقة
        // ------------------------------------------------

        merges.push({
          s: {
            r: startRow,
            c: 1,
          },

          e: {
            r: endRow,
            c: 1,
          },
        });

        // ------------------------------------------------
        // القطعة
        // ------------------------------------------------

        merges.push({
          s: {
            r: startRow,
            c: 2,
          },

          e: {
            r: endRow,
            c: 2,
          },
        });

        // ------------------------------------------------
        // المركبة
        // ------------------------------------------------

        merges.push({
          s: {
            r: startRow,
            c: 3,
          },

          e: {
            r: endRow,
            c: 3,
          },
        });

        // ------------------------------------------------
        // نوع الملاحظة
        // ------------------------------------------------

        merges.push({
          s: {
            r: startRow,
            c: 4,
          },

          e: {
            r: endRow,
            c: 4,
          },
        });

      }

      // ==================================================
      // NEXT
      // ==================================================

      currentExcelRow =
        endRow + 1;

    }
  );

  // ======================================================
  // CREATE WORKSHEET
  // ======================================================

  const worksheet =
    XLSX.utils.aoa_to_sheet(
      data
    );

  // ======================================================
  // MERGES
  // ======================================================

  worksheet["!merges"] =
    merges;

  // ======================================================
  // RTL
  // ======================================================

  worksheet["!views"] = [
    {
      rightToLeft: true,
    },
  ];

  // ======================================================
  // FREEZE
  // ======================================================

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 4,
  };

  // ======================================================
  // COLUMN WIDTHS
  // ======================================================

  worksheet["!cols"] = [

    // A - #
    {
      wch: 5,
    },

    // B - المنطقة
    {
      wch: 14,
    },

    // C - القطعة
    {
      wch: 14,
    },

    // D - المركبة
    {
      wch: 16,
    },

    // E - نوع الملاحظة
    {
      wch: 19,
    },

    // F - الشارع
    {
      wch: 28,
    },

    // G - الحاويات
    {
      wch: 13,
    },

  ];

  // ======================================================
  // TITLE STYLE
  // ======================================================

  worksheet["A1"].s = {

    font: {
      name: "Arial",
      sz: 20,
      bold: true,

      color: {
        rgb: COLORS.white,
      },
    },

    fill: {
      fgColor: {
        rgb: COLORS.darkBlue,
      },
    },

    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },

    border:
      thinBorder,

  };

  // ======================================================
  // INFORMATION STYLE
  // ======================================================

  for (
    let col = 0;
    col < 7;
    col++
  ) {

    const address =
      XLSX.utils.encode_cell({
        r: 1,
        c: col,
      });

    const cell =
      worksheet[address];

    if (!cell) {
      continue;
    }

    cell.s = {

      font: {
        name: "Arial",
        sz: 12,
        bold: true,

        color: {
          rgb: COLORS.darkBlue,
        },
      },

      fill: {
        fgColor: {
          rgb: COLORS.lightBlue,
        },
      },

      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },

      border:
        thinBorder,

    };

  }

  // ======================================================
  // TABLE HEADER
  // ======================================================

  for (
    let col = 0;
    col < 7;
    col++
  ) {

    const address =
      XLSX.utils.encode_cell({
        r: 3,
        c: col,
      });

    const cell =
      worksheet[address];

    if (!cell) {
      continue;
    }

    cell.s = {

      font: {
        name: "Arial",
        sz: 13,
        bold: true,

        color: {
          rgb: COLORS.white,
        },
      },

      fill: {
        fgColor: {
          rgb: COLORS.darkBlue,
        },
      },

      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },

      border: {

        top: {
          style: "medium",
          color: {
            rgb: COLORS.white,
          },
        },

        bottom: {
          style: "medium",
          color: {
            rgb: COLORS.white,
          },
        },

        left: {
          style: "thin",
          color: {
            rgb: COLORS.white,
          },
        },

        right: {
          style: "thin",
          color: {
            rgb: COLORS.white,
          },
        },

      },

    };

  }

  // ======================================================
  // BODY
  // ======================================================

  const lastRow =
    data.length - 1;

  for (
    let row = DATA_START_ROW;
    row <= lastRow;
    row++
  ) {

    const fillColor =
      (row -
        DATA_START_ROW) %
        2 ===
      0
        ? COLORS.lightBlue
        : COLORS.lighterBlue;

    for (
      let col = 0;
      col < 7;
      col++
    ) {

      const address =
        XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

      const cell =
        worksheet[address];

      if (!cell) {
        continue;
      }

      cell.s = {

        font: {
          name: "Arial",
          sz: 12,
          bold: false,

          color: {
            rgb: COLORS.text,
          },
        },

        fill: {
          fgColor: {
            rgb: fillColor,
          },
        },

        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },

        border:
          thinBorder,

      };

    }

  }

  // ======================================================
  // ROW HEIGHTS
  // ======================================================

  worksheet["!rows"] = [];

  // Title
  worksheet["!rows"][0] = {
    hpt: 42,
  };

  // Information
  worksheet["!rows"][1] = {
    hpt: 30,
  };

  // Empty
  worksheet["!rows"][2] = {
    hpt: 10,
  };

  // Header
  worksheet["!rows"][3] = {
    hpt: 38,
  };

  // Data
  for (
    let row = DATA_START_ROW;
    row <= lastRow;
    row++
  ) {

    worksheet["!rows"][row] = {
      hpt: 34,
    };

  }

  // ======================================================
  // AUTO FILTER
  // ======================================================

  worksheet["!autofilter"] = {
    ref:
      `A4:G${lastRow + 1}`,
  };

  // ======================================================
  // PAGE SETUP
  // ======================================================

  worksheet["!pageSetup"] = {

    orientation:
      "landscape",

    paperSize:
      9,

    fitToWidth:
      1,

    fitToHeight:
      0,

  };

  // ======================================================
  // WORKBOOK
  // ======================================================

  const workbook =
    XLSX.utils.book_new();

  // ======================================================
  // PROPERTIES
  // ======================================================

  workbook.Props = {

    Title:
      `ملاحظات التتبع - ${district}`,

    Subject:
      "تقرير ملاحظات تتبع المركبات",

    Author:
      "Route Notes",

    Company:
      "Route Notes",

    CreatedDate:
      now,

  };

  // ======================================================
  // ADD SHEET
  // ======================================================

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "ملاحظات التتبع"
  );

  // ======================================================
  // FILE NAME
  // ======================================================

  const safeDistrict =
    sanitizeFileName(
      district
    );

  const fileName =
    `${safeDistrict}_${fileDate}_ملاحظات_التتبع.xlsx`;

  // ======================================================
  // DOWNLOAD
  // ======================================================

  XLSX.writeFile(
    workbook,
    fileName
  );
};