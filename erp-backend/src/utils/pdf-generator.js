// src/utils/pdf-generator.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate PDF file from report data
 */
/**
 * Generate PDF file from report data with professional styling
 */
export async function generatePDFFromReport(reportData, reportType) {
  try {
    // 4. Intelligent Page Handling: Auto-Orientation
    const colCount = reportData.data && reportData.data.length > 0 ? Object.keys(reportData.data[0]).length : 0;
    const isLandscape = colCount > 6;
    const orientation = isLandscape ? 'landscape' : 'portrait';

    const doc = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20; // 0.5-inch to 1-inch uniform margin

    // --- 1. Standardized Document Layout (Header) ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Header Left: Company Logo / Name
    doc.setTextColor(30, 64, 175); // Deep blue (#1e40af)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('EMPCL ERP', margin, 25);

    // Header Center: Report Title
    doc.setTextColor(15, 23, 42); // Dark gray (#0f172a)
    doc.setFontSize(18);
    const titleWidth = doc.getTextWidth(reportData.title.toUpperCase());
    doc.text(reportData.title.toUpperCase(), (pageWidth - titleWidth) / 2, 25);

    // Header Right: Date, Time & User
    doc.setTextColor(100, 116, 139); // Slate (#64748b)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const genDate = reportData.generated_at ? new Date(reportData.generated_at).toLocaleString() : new Date().toLocaleString();
    const rightText1 = `Generated: ${genDate}`;
    const rightText2 = `User: System Admin`;
    doc.text(rightText1, pageWidth - margin - doc.getTextWidth(rightText1), 20);
    doc.text(rightText2, pageWidth - margin - doc.getTextWidth(rightText2), 26);

    // Divider Line
    doc.setDrawColor(226, 232, 240); // Light gray (#e2e8f0)
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);

    let currentY = 45;

    // --- Report Scope & Filters ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);

    if (reportData.period && reportData.period.start_date !== 'N/A') {
      doc.text(`Period: ${reportData.period.start_date} to ${reportData.period.end_date}`, margin, currentY);
      currentY += 8;
    } else if (reportData.filters && reportData.filters['Date Range']) {
      doc.text(`Period: ${reportData.filters['Date Range']}`, margin, currentY);
      currentY += 8;
    }

    if (reportData.filters && Object.keys(reportData.filters).filter(k => k !== 'Date Range').length > 0) {
      doc.setFont('helvetica', 'normal');
      let filterString = Object.entries(reportData.filters)
        .filter(([k]) => k !== 'Date Range')
        .map(([k, v]) => `${k}: ${v}`)
        .join('  |  ');
      doc.text(`Filters: ${filterString}`, margin, currentY);
      currentY += 12;
    } else {
      currentY += 4;
    }

    let footData = [];

    // --- Data Table with 2. Smart Table Alignment & 3. Professional Styling ---
    if (reportData.data && reportData.data.length > 0) {
      const headers = Object.keys(reportData.data[0]);
      const tableData = reportData.data.map(row => Object.values(row));

      // Calculate Footer "Grand Total" Row if summary matches headers
      if (reportData.summary) {
        const footRow = headers.map(h => {
          // Attempt to map summary keys to header names (e.g. Total_Amount matches total_amount)
          const searchKey = h.toLowerCase().replace(/_/g, '');
          const sumKey = Object.keys(reportData.summary).find(k => k.toLowerCase().replace(/_/g, '').includes(searchKey) || searchKey.includes(k.toLowerCase().replace(/_/g, '')));

          if (h.toLowerCase().includes('total') || h.toLowerCase().includes('amount') || h.toLowerCase().includes('qty') || h.toLowerCase().includes('value')) {
            if (sumKey) return String(reportData.summary[sumKey]);
          }
          if (h === headers[0]) return 'GRAND TOTAL';
          return '';
        });
        footData.push(footRow);
      }

      autoTable(doc, {
        head: [headers.map(h => h.replace(/_/g, ' ').toUpperCase())],
        body: tableData,
        foot: footData.length > 0 ? footData : null,
        startY: currentY,
        theme: 'grid',
        margin: { left: margin, right: margin },
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4,
          lineColor: [226, 232, 240], // 1px solid light gray
          lineWidth: 0.1,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [30, 41, 59], // Dark background (#1e293b)
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left' // Default, will override in didParseCell
        },
        footStyles: {
          fillColor: [241, 245, 249], // Very light gray for totals
          textColor: [15, 23, 42],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Zebra Striping: subtle light-gray (#f8fafc)
        },
        // 4. Intelligent Page Handling: Page Break Prevention
        pageBreak: 'auto',
        rowPageBreak: 'avoid',

        didParseCell: function (data) {
          // 2. Smart Table Alignment Rules
          const colTitle = data.column.dataKey !== undefined && headers[data.column.dataKey] ? String(headers[data.column.dataKey]).toUpperCase() : '';
          const cellContent = data.cell.raw ? String(data.cell.raw).toUpperCase() : '';

          let align = 'left'; // Text Columns: Left-aligned (Default)

          // Number & Currency Columns: Strictly Right-aligned
          if (
            colTitle.includes('QTY') ||
            colTitle.includes('AMOUNT') ||
            colTitle.includes('PRICE') ||
            colTitle.includes('COST') ||
            colTitle.includes('TOTAL') ||
            colTitle.includes('BALANCE') ||
            colTitle.includes('DEBIT') ||
            colTitle.includes('CREDIT') ||
            (!isNaN(parseFloat(data.cell.raw)) && isFinite(data.cell.raw) && !colTitle.includes('NO') && !colTitle.includes('ID') && !colTitle.includes('REF'))
          ) {
            align = 'right';
          }

          // Date & Status Columns: Center-aligned
          if (
            colTitle.includes('DATE') ||
            colTitle.includes('STATUS') ||
            colTitle.includes('TYPE') ||
            cellContent === 'COMPLETED' ||
            cellContent === 'PENDING' ||
            cellContent === 'DELIVERED' ||
            cellContent === 'SHIPPED'
          ) {
            align = 'center';
          }

          data.cell.styles.halign = align;
        }
      });

      currentY = doc.lastAutoTable.finalY + 15;
    }

    // --- Fallback Summary Section (If Table Footer isn't enough) ---
    if (reportData.summary && footData.length === 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('REPORT SUMMARY', margin, currentY);
      currentY += 8;

      const summaryEntries = Object.entries(reportData.summary);
      let summaryX = margin;

      doc.setFontSize(10);
      summaryEntries.forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').toUpperCase() + ':';
        doc.setFont('helvetica', 'bold');
        doc.text(label, summaryX, currentY);

        doc.setFont('helvetica', 'normal');
        doc.text(String(value ?? '0'), summaryX + doc.getTextWidth(label) + 2, currentY);

        summaryX += 60;
        if (summaryX > pageWidth - margin - 40) {
          summaryX = margin;
          currentY += 8;
        }
      });
    }

    // --- 1. Standardized Document Layout (Footer) ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184); // Muted gray

      // Footer Left: Confidentiality Notice
      doc.text('CONFIDENTIAL - SYSTEM GENERATED REPORT', margin, pageHeight - 8);

      // Footer Right: Page Numbering
      const pageText = `Page ${i} of ${pageCount}`;
      doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - 8);
    }

    return doc.output('arraybuffer');

  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate professional PDF: ' + error.message);
  }
}

/**
 * Generate PDF for Monthly Inventory & Sales Report with exact formatting
 */
export async function generatePDFFromMonthlyReport(reportData) {
  try {
    const orientation = 'landscape';
    const doc = new jsPDF(orientation, 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // --- 1. Standardized Document Layout (Header) ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('EMPCL ERP', margin, 25);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    const titleWidth = doc.getTextWidth(reportData.title.toUpperCase());
    doc.text(reportData.title.toUpperCase(), (pageWidth - titleWidth) / 2, 25);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const genDate = new Date().toLocaleString();
    const rightText1 = `Generated: ${genDate}`;
    const rightText2 = `User: System Admin`;
    doc.text(rightText1, pageWidth - margin - doc.getTextWidth(rightText1), 20);
    doc.text(rightText2, pageWidth - margin - doc.getTextWidth(rightText2), 26);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);

    let currentY = 45;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`Company: ${reportData.company_name}`, margin, currentY);
    currentY += 10;

    // Prepare table data
    const tableData = reportData.products.map((product, index) => {
      return [
        index + 1,
        product.product_code,
        product.part_name,
        product.opening_stock,
        product.produced_quantity,
        product.total_inventory,
        ...reportData.sale_dates.map(date => product.daily_sales[date] || 0),
        product.total_sales,
        product.closing_stock
      ];
    });

    // Prepare headers
    const headers = [
      'Model',
      'Part Number',
      'Part Name',
      'Opening (Qty)',
      'Produced (Qty)',
      'Total Inv (Qty)',
      ...reportData.sale_dates.map(date => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      }),
      'Total Sold (Qty)',
      'Closing (Qty)'
    ];

    // Footer Grand Total Row
    let footRow = new Array(headers.length).fill('');
    footRow[2] = 'GRAND TOTAL';

    let totalOpening = 0, totalProduced = 0, totalInventoryTotal = 0, totalSalesTotal = 0, totalClosing = 0;

    reportData.products.forEach(p => {
      totalOpening += Number(p.opening_stock || 0);
      totalProduced += Number(p.produced_quantity || 0);
      totalInventoryTotal += Number(p.total_inventory || 0);
      totalSalesTotal += Number(p.total_sales || 0);
      totalClosing += Number(p.closing_stock || 0);
    });

    footRow[3] = totalOpening;
    footRow[4] = totalProduced;
    footRow[5] = totalInventoryTotal;
    footRow[footRow.length - 2] = totalSalesTotal;
    footRow[footRow.length - 1] = totalClosing;

    autoTable(doc, {
      head: [headers],
      body: tableData,
      foot: [footRow],
      startY: currentY,
      theme: 'grid',
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 3,
        lineColor: [226, 232, 240], // 1px solid light gray
        lineWidth: 0.1,
        overflow: 'linebreak',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 41, 59], // Dark background (#1e293b)
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Zebra striping
      },
      pageBreak: 'auto',
      rowPageBreak: 'avoid',

      didParseCell: function (data) {
        // Smart Table Alignment Rules & Custom Highlights
        let align = 'right'; // Default numbers to right

        if (data.column.index === 0 || data.column.index === 1 || data.column.index === 2) {
          align = 'left';
        }

        data.cell.styles.halign = align;

        // Custom Highlighting for Monthly Report
        if (data.section === 'body') {
          if (data.column.index === 4 && Number(data.cell.raw) > 0) {
            data.cell.styles.fillColor = [254, 252, 232]; // Subtle yellow
          }
          if (data.column.index === headers.length - 1 && Number(data.cell.raw) < 10) {
            data.cell.styles.textColor = [220, 38, 38]; // Red text
          }
          const cellRawStr = data.cell.raw ? String(data.cell.raw) : '';
          if (data.column.index === 2 && (cellRawStr.includes('NMR') || cellRawStr.includes('NLR'))) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      }
    });

    // --- 1. Standardized Document Layout (Footer) ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);

      doc.text('CONFIDENTIAL - SYSTEM GENERATED REPORT', margin, pageHeight - 8);
      const pageText = `Page ${i} of ${pageCount}`;
      doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - 8);
    }

    return doc.output('arraybuffer');

  } catch (error) {
    console.error('Monthly report PDF generation error:', error);
    throw new Error('Failed to generate monthly report PDF: ' + error.message);
  }
}