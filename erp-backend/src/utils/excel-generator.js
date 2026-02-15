// src/utils/excel-generator.js
import ExcelJS from 'exceljs';

/**
 * Generate Excel file from report data
 */
export async function generateExcelFromReport(reportData, reportType) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportData.title);

    // Add header
    worksheet.addRow([reportData.title]);
    worksheet.addRow(['Generated at:', reportData.generated_at]);
    
    if (reportData.period) {
      worksheet.addRow(['Period:', `${reportData.period.start_date} to ${reportData.period.end_date}`]);
    }
    
    if (reportData.filters) {
      worksheet.addRow(['Filters:']);
      Object.entries(reportData.filters).forEach(([key, value]) => {
        worksheet.addRow([`${key}:`, value]);
      });
    }

    worksheet.addRow([]); // Empty row

    // Add summary section
    if (reportData.summary) {
      worksheet.addRow(['SUMMARY']);
      if (Array.isArray(reportData.summary)) {
        // For cost analysis with array of summaries
        worksheet.addRow(['Transaction Type', 'Count', 'Total Quantity', 'Total Value', 'Avg Cost']);
        reportData.summary.forEach(item => {
          worksheet.addRow([
            item.txn_type,
            item.transaction_count,
            item.total_quantity,
            item.total_value,
            item.avg_cost
          ]);
        });
      } else {
        // For single summary object
        Object.entries(reportData.summary).forEach(([key, value]) => {
          worksheet.addRow([key.replace(/_/g, ' ').toUpperCase(), value]);
        });
      }
      worksheet.addRow([]); // Empty row
    }

    // Add data section
    if (reportData.data && reportData.data.length > 0) {
      worksheet.addRow(['DATA']);
      const headers = Object.keys(reportData.data[0]);
      worksheet.addRow(headers.map(h => h.replace(/_/g, ' ').toUpperCase()));
      
      reportData.data.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
      });
    }

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(1).alignment = { horizontal: 'center' };
    
    // Set column widths
    worksheet.columns.forEach((column, index) => {
      column.width = Math.max(15, Math.min(30, column.width || 15));
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;

  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
}

/**
 * Generate Excel for Monthly Inventory & Sales Report with exact formatting
 */
export async function generateExcelFromMonthlyReport(reportData) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportData.title);

    // Add title - large and centered
    const titleRow = worksheet.addRow([reportData.title]);
    titleRow.font = { bold: true, size: 20 };
    titleRow.alignment = { horizontal: 'center' };
    worksheet.mergeCells('A1:Z1');

    // Add company name
    const companyRow = worksheet.addRow([reportData.company_name]);
    companyRow.font = { bold: true, size: 12 };
    companyRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3E6' } // Light green
    };

    // Add empty row
    worksheet.addRow([]);

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

    // Add headers
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFADD8E6' } // Light blue
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    reportData.products.forEach((product, index) => {
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

      const dataRow = worksheet.addRow(row);
      
      // Alternate row colors
      if (index % 2 === 1) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F8FF' } // Light blue alternate
        };
      }

      // Highlight production quantities in yellow
      const productionCell = dataRow.getCell(5); // Column E
      if (product.produced_quantity > 0) {
        productionCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Yellow
        };
      }

      // Highlight closing stock in red if low
      const closingStockCell = dataRow.getCell(5 + reportData.sale_dates.length + 1); // Last column
      if (product.closing_stock < 10) {
        closingStockCell.font = { color: { argb: 'FFFF0000' } }; // Red text
      }

      // Highlight special part names in red
      const partNameCell = dataRow.getCell(3); // Column C
      if (product.part_name && (product.part_name.includes('NMR') || product.part_name.includes('NLR'))) {
        partNameCell.font = { color: { argb: 'FFFF0000' } }; // Red text
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 8 },   // Model
      { width: 20 },  // Part Number
      { width: 40 },  // Part Name
      { width: 15 },  // Opening Stock
      { width: 15 },  // Produced Quantity
      { width: 15 },  // Total Inventory
      ...reportData.sale_dates.map(() => ({ width: 12 })), // Daily Sales columns
      { width: 15 },  // Total Sales
      { width: 15 }   // Closing Stock
    ];

    // Set alignment
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3) { // Skip title and header rows
        row.eachCell((cell, colNumber) => {
          if (colNumber >= 4) { // Numeric columns
            cell.alignment = { horizontal: 'right' };
          } else {
            cell.alignment = { horizontal: 'left' };
          }
        });
      }
    });

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;

  } catch (error) {
    console.error('Error generating monthly report Excel:', error);
    throw error;
  }
}