// src/utils/pdf-generator.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate PDF file from report data
 */
export async function generatePDFFromReport(reportData, reportType) {
  try {
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Add title
    doc.setFontSize(20);
    doc.text(reportData.title, 20, 20);
    
    // Add generation info
    doc.setFontSize(10);
    doc.text(`Generated at: ${reportData.generated_at}`, 20, 30);
    
    if (reportData.period) {
      doc.text(`Period: ${reportData.period.start_date} to ${reportData.period.end_date}`, 20, 35);
    }
    
    // Add filters if any
    if (reportData.filters) {
      doc.text('Filters:', 20, 45);
      let yPos = 50;
      Object.entries(reportData.filters).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 25, yPos);
        yPos += 5;
      });
    }
    
    let currentY = 70;
    
    // Add summary section
    if (reportData.summary) {
      doc.setFontSize(14);
      doc.text('Summary', 20, currentY);
      currentY += 10;
      
      doc.setFontSize(10);
      Object.entries(reportData.summary).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 25, currentY);
        currentY += 5;
      });
      currentY += 5;
    }
    
    // Add data table
    if (reportData.data && reportData.data.length > 0) {
      doc.setFontSize(14);
      doc.text('Data', 20, currentY);
      currentY += 10;
      
      // Prepare table data
      const tableData = reportData.data.map(row => {
        // Convert object to array of values
        return Object.values(row);
      });
      
      // Get headers from first row
      const headers = Object.keys(reportData.data[0]);
      
      // Add table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 20, right: 20 },
      });
    }
    
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
    }
    
    return doc.output('arraybuffer');
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
}

/**
 * Generate PDF for Monthly Inventory & Sales Report with exact formatting
 */
export async function generatePDFFromMonthlyReport(reportData) {
  try {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Set font
    doc.setFont('helvetica');
    
    // Add title - large and centered
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.title, 150, 20, { align: 'center' });
    
    // Add company name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(reportData.company_name, 20, 35);
    
    // Prepare table data
    const tableData = reportData.products.map((product, index) => {
      const row = [
        index + 1, // Model/Row number
        product.product_code, // Part Number
        product.part_name, // Part Name
        product.opening_stock, // Opening Stock
        product.produced_quantity, // Quantity Produced
        product.total_inventory, // Total Inventory
        ...reportData.sale_dates.map(date => product.daily_sales[date] || 0), // Daily Sales
        product.total_sales, // Total Sales
        product.closing_stock // Closing Stock
      ];
      return row;
    });
    
    // Prepare headers
    const headers = [
      'Model',
      'Part Number', 
      'Part Name',
      'Opening (Nos)',
      'Quantity Produced During the Month (Nos)',
      'Total Inventory (Nos)',
      ...reportData.sale_dates.map(date => {
        const dateObj = new Date(date);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
      }),
      'Total Quantity Sold During The Month (Units)',
      'Closing Stock (Nos)'
    ];
    
    // Add table with custom styling
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 45,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [173, 216, 230], // Light blue background
        textColor: 0,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [240, 248, 255], // Light blue alternate rows
      },
      columnStyles: {
        0: { halign: 'center' }, // Model column
        1: { halign: 'left' }, // Part Number
        2: { halign: 'left' }, // Part Name
        3: { halign: 'right' }, // Opening Stock
        4: { halign: 'right' }, // Produced Quantity
        5: { halign: 'right' }, // Total Inventory
        // Sales columns
        ...Object.fromEntries(
          reportData.sale_dates.map((_, index) => [6 + index, { halign: 'right' }])
        ),
        // Total Sales and Closing Stock
        [6 + reportData.sale_dates.length]: { halign: 'right' }, // Total Sales
        [7 + reportData.sale_dates.length]: { halign: 'right' }  // Closing Stock
      },
      didParseCell: function(data) {
        // Highlight production quantities in yellow
        if (data.column.index === 4 && data.cell.raw > 0) {
          data.cell.styles.fillColor = [255, 255, 0]; // Yellow
        }
        
        // Highlight closing stock in red if low
        if (data.column.index === 7 + reportData.sale_dates.length && data.cell.raw < 10) {
          data.cell.styles.textColor = [255, 0, 0]; // Red text
        }
        
        // Highlight special part names in red
        if (data.column.index === 2 && data.cell.raw && 
            (data.cell.raw.includes('NMR') || data.cell.raw.includes('NLR'))) {
          data.cell.styles.textColor = [255, 0, 0]; // Red text
        }
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto'
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated by EmpclERP System - Page ${i} of ${pageCount}`, 
               20, doc.internal.pageSize.height - 10);
    }
    
    return doc.output('arraybuffer');
    
  } catch (error) {
    console.error('Monthly report PDF generation error:', error);
    throw new Error('Failed to generate monthly report PDF: ' + error.message);
  }
}