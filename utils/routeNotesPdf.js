// utils/routeNotesPdf.js

import { getNoteType } from "@/data/routeNotes";

// ========================================================
// Helpers
// ========================================================

const escapeHtml = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ========================================================
// Note Type
// ========================================================

const getNoteTypeName = (value) => {
  const type = getNoteType(value);

  return type?.label || value || "-";
};

// ========================================================
// Streets
// ========================================================

const buildStreets = (streets = []) => {
  if (!Array.isArray(streets)) {
    return "-";
  }

  if (streets.length === 0) {
    return "-";
  }

  return streets
    .map((street) => {
      const name =
        street?.name ||
        street?.street ||
        "-";

      const containers =
        street?.containerCount ??
        street?.containers ??
        0;

      return `
        <div class="street-row">

          <span class="street-name">
            ${escapeHtml(name)}
          </span>

          <span class="container-count">
            ${escapeHtml(containers)}
            حاوية
          </span>

        </div>
      `;
    })
    .join("");
};

// ========================================================
// Table Rows
// ========================================================

const buildTableRows = (notes) => {
  return notes
    .map((note, index) => {
      return `
        <tr>

          <td class="number">
            ${index + 1}
          </td>

          <td>
            ${escapeHtml(
              note?.district || "-"
            )}
          </td>

          <td>
            ${escapeHtml(
              note?.block || "-"
            )}
          </td>

          <td class="vehicle">
            ${escapeHtml(
              note?.vehicle || "-"
            )}
          </td>

          <td class="note-type">
            ${escapeHtml(
              getNoteTypeName(
                note?.noteType
              )
            )}
          </td>

          <td class="streets-cell">

            ${
              note?.streets?.length
                ? `
                  <div class="streets">
                    ${buildStreets(
                      note.streets
                    )}
                  </div>
                `
                : "-"
            }

          </td>

        </tr>
      `;
    })
    .join("");
};

// ========================================================
// Create Report
// ========================================================

const createReportElement = ({
  notes,
  district,
}) => {
  const report =
    document.createElement("div");

  report.id =
    "route-notes-pdf-report";

  report.dir = "rtl";

  // مهم جدًا:
  // العنصر يكون فعليًا داخل الصفحة
  // وليس display:none
  // ولا opacity:0

  report.style.position =
    "absolute";

  report.style.left = "0";

  report.style.top = "0";

  report.style.width =
    "794px";

  report.style.background =
    "#ffffff";

  report.style.zIndex =
    "999999";

  report.style.padding =
    "32px";

  report.style.boxSizing =
    "border-box";

  const now = new Date();

  const date =
    now.toLocaleDateString(
      "ar-JO",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

  const time =
    now.toLocaleTimeString(
      "ar-JO",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  report.innerHTML = `

    <div class="report-container">

      <!-- ==========================================
           Header
           ========================================== -->

      <div class="header">

        <div class="title">
          تقرير ملاحظات مسارات المركبات
        </div>

        <div class="subtitle">
          ROUTE NOTES REPORT
        </div>

      </div>


      <!-- ==========================================
           Information
           ========================================== -->

      <div class="information">

        <div class="information-item">

          <div class="information-label">
            التاريخ
          </div>

          <div class="information-value">
            ${escapeHtml(date)}
          </div>

        </div>


        <div class="information-item">

          <div class="information-label">
            وقت الإصدار
          </div>

          <div class="information-value">
            ${escapeHtml(time)}
          </div>

        </div>


        <div class="information-item">

          <div class="information-label">
            المنطقة
          </div>

          <div class="information-value">
            ${escapeHtml(
              district ||
                "جميع المناطق"
            )}
          </div>

        </div>


        <div class="information-item">

          <div class="information-label">
            عدد الملاحظات
          </div>

          <div class="information-value">
            ${notes.length}
          </div>

        </div>

      </div>


      <!-- ==========================================
           Table
           ========================================== -->

      <table class="report-table">

        <colgroup>

          <col style="width: 6%;" />

          <col style="width: 14%;" />

          <col style="width: 14%;" />

          <col style="width: 15%;" />

          <col style="width: 17%;" />

          <col style="width: 34%;" />

        </colgroup>

        <thead>

          <tr>

            <th>
              #
            </th>

            <th>
              المنطقة
            </th>

            <th>
              القطعة
            </th>

            <th>
              المركبة
            </th>

            <th>
              نوع الملاحظة
            </th>

            <th>
              الشوارع / عدد الحاويات
            </th>

          </tr>

        </thead>

        <tbody>

          ${buildTableRows(notes)}

        </tbody>

      </table>


      <!-- ==========================================
           Footer
           ========================================== -->

      <div class="footer">

        <span>
          Route Notes
        </span>

        <span>
          إجمالي الملاحظات:
          ${notes.length}
        </span>

        <span>
          تقرير رسمي
        </span>

      </div>

    </div>
  `;

  // ======================================================
  // CSS
  // ======================================================

  const style =
    document.createElement("style");

  style.textContent = `

    #route-notes-pdf-report {

      direction: rtl;

      background: #ffffff;

      color: #111111;

      font-family:
        Arial,
        Tahoma,
        "Segoe UI",
        sans-serif;

    }

    .report-container {

      width: 100%;

      background: #ffffff;

    }


    /* ================================================
       Header
       ================================================ */

    .header {

      text-align: center;

      margin-bottom: 18px;

    }

    .title {

      font-size: 24px;

      font-weight: 700;

      line-height: 1.4;

      color: #111111;

    }

    .subtitle {

      margin-top: 4px;

      font-size: 11px;

      color: #666666;

      direction: ltr;

    }


    /* ================================================
       Information
       ================================================ */

    .information {

      width: 100%;

      display: flex;

      flex-direction: row;

      border-bottom:
        2px solid #555555;

      padding-bottom: 10px;

      margin-bottom: 18px;

    }

    .information-item {

      flex: 1;

      text-align: center;

      border-left:
        1px solid #dddddd;

    }

    .information-item:last-child {

      border-left: none;

    }

    .information-label {

      font-size: 10px;

      color: #777777;

      margin-bottom: 4px;

    }

    .information-value {

      font-size: 13px;

      font-weight: 700;

      color: #111111;

    }


    /* ================================================
       Table
       ================================================ */

    .report-table {

      width: 100%;

      border-collapse:
        collapse;

      table-layout:
        fixed;

      direction: rtl;

      font-size: 10px;

    }

    .report-table th {

      background:
        #e8e8e8;

      border:
        1px solid #666666;

      padding:
        8px 5px;

      font-size: 10px;

      font-weight: 700;

      text-align:
        center;

      vertical-align:
        middle;

    }

    .report-table td {

      border:
        1px solid #999999;

      padding:
        7px 5px;

      font-size: 10px;

      vertical-align:
        middle;

      line-height:
        1.4;

    }

    .report-table tbody tr:nth-child(even) {

      background:
        #fafafa;

    }


    /* ================================================
       Columns
       ================================================ */

    .number {

      text-align:
        center;

      font-weight:
        700;

    }

    .vehicle {

      direction:
        ltr;

      text-align:
        center;

      white-space:
        nowrap;

    }

    .note-type {

      text-align:
        center;

      font-weight:
        700;

    }

    .streets-cell {

      padding:
        5px !important;

    }


    /* ================================================
       Streets
       ================================================ */

    .street-row {

      display:
        flex;

      flex-direction:
        row;

      align-items:
        center;

      justify-content:
        space-between;

      gap:
        10px;

      padding:
        4px 0;

      border-bottom:
        1px dotted #cccccc;

    }

    .street-row:last-child {

      border-bottom:
        none;

    }

    .street-name {

      flex: 1;

      font-weight:
        600;

    }

    .container-count {

      white-space:
        nowrap;

      font-size:
        9px;

      color:
        #555555;

    }


    /* ================================================
       Footer
       ================================================ */

    .footer {

      display:
        flex;

      justify-content:
        space-between;

      margin-top:
        15px;

      padding-top:
        8px;

      border-top:
        1px solid #888888;

      font-size:
        9px;

      color:
        #666666;

    }

  `;

  document.head.appendChild(style);

  document.body.appendChild(report);

  return {
    report,
    style,
  };
};

// ========================================================
// Export PDF
// ========================================================

export const exportRouteNotesPdf = async ({
  notes = [],
  district = null,
}) => {
  // ======================================================
  // Validate
  // ======================================================

  if (!Array.isArray(notes)) {
    console.error(
      "Route Notes: notes is not an array"
    );

    return;
  }

  if (notes.length === 0) {
    alert(
      "لا توجد ملاحظات لتصديرها."
    );

    return;
  }

  // ======================================================
  // Dynamic imports
  // ======================================================

  const html2canvasModule =
    await import("html2canvas");

  const jsPDFModule =
    await import("jspdf");

  const html2canvas =
    html2canvasModule.default ||
    html2canvasModule;

  const jsPDF =
    jsPDFModule.jsPDF;

  // ======================================================
  // Create DOM
  // ======================================================

  const {
    report,
    style,
  } =
    createReportElement({
      notes,
      district,
    });

  try {

    // ====================================================
    // Wait for DOM rendering
    // ====================================================

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(
            resolve,
            300
          );
        });
      });
    });

    // ====================================================
    // Create Canvas
    // ====================================================

    const canvas =
      await html2canvas(
        report,
        {

          scale: 2,

          useCORS: true,

          allowTaint: true,

          backgroundColor:
            "#ffffff",

          logging: false,

          width:
            report.scrollWidth,

          height:
            report.scrollHeight,

          windowWidth:
            report.scrollWidth,

          windowHeight:
            report.scrollHeight,

        }
      );

    // ====================================================
    // Validate Canvas
    // ====================================================

    if (
      !canvas ||
      canvas.width === 0 ||
      canvas.height === 0
    ) {

      throw new Error(
        "Canvas was generated empty."
      );

    }

    // ====================================================
    // Create PDF
    // ====================================================

    const pdf =
      new jsPDF({

        orientation:
          "portrait",

        unit:
          "mm",

        format:
          "a4",

        compress:
          true,

      });

    // ====================================================
    // A4 dimensions
    // ====================================================

    const pageWidth =
      pdf.internal.pageSize.getWidth();

    const pageHeight =
      pdf.internal.pageSize.getHeight();

    const margin =
      8;

    const usableWidth =
      pageWidth -
      margin * 2;

    const usableHeight =
      pageHeight -
      margin * 2;

    // ====================================================
    // Canvas dimensions
    // ====================================================

    const canvasWidth =
      canvas.width;

    const canvasHeight =
      canvas.height;

    const ratio =
      usableWidth /
      canvasWidth;

    const imageHeight =
      canvasHeight *
      ratio;

    // ====================================================
    // Single page
    // ====================================================

    if (
      imageHeight <=
      usableHeight
    ) {

      pdf.addImage(

        canvas,

        "JPEG",

        margin,

        margin,

        usableWidth,

        imageHeight,

        undefined,

        "FAST"

      );

    }

    // ====================================================
    // Multiple pages
    // ====================================================

    else {

      let sourceY = 0;

      const pagePixelHeight =
        usableHeight /
        ratio;

      let pageNumber = 0;

      while (
        sourceY <
        canvasHeight
      ) {

        if (
          pageNumber > 0
        ) {

          pdf.addPage();

        }

        const sliceHeight =
          Math.min(
            pagePixelHeight,
            canvasHeight -
              sourceY
          );

        const pageCanvas =
          document.createElement(
            "canvas"
          );

        pageCanvas.width =
          canvasWidth;

        pageCanvas.height =
          sliceHeight;

        const ctx =
          pageCanvas.getContext(
            "2d"
          );

        if (!ctx) {
          throw new Error(
            "Could not create canvas context."
          );
        }

        ctx.fillStyle =
          "#ffffff";

        ctx.fillRect(
          0,
          0,
          pageCanvas.width,
          pageCanvas.height
        );

        ctx.drawImage(

          canvas,

          0,
          sourceY,

          canvasWidth,
          sliceHeight,

          0,
          0,

          canvasWidth,
          sliceHeight

        );

        const pageImageHeight =
          sliceHeight *
          ratio;

        pdf.addImage(

          pageCanvas,

          "JPEG",

          margin,

          margin,

          usableWidth,

          pageImageHeight,

          undefined,

          "FAST"

        );

        sourceY +=
          sliceHeight;

        pageNumber++;
      }
    }

    // ====================================================
    // Download
    // ====================================================

    pdf.save(
      "تقرير_ملاحظات_المسارات.pdf"
    );

  } catch (error) {

    console.error(
      "PDF EXPORT ERROR:",
      error
    );

    alert(
      "حدث خطأ أثناء إنشاء ملف PDF. راجع Console لمعرفة التفاصيل."
    );

  } finally {

    // ====================================================
    // Cleanup
    // ====================================================

    if (
      report &&
      report.parentNode
    ) {

      report.parentNode.removeChild(
        report
      );

    }

    if (
      style &&
      style.parentNode
    ) {

      style.parentNode.removeChild(
        style
      );

    }

  }
};