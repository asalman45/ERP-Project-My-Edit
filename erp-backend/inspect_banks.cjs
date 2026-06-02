const xlsx = require('xlsx');
const path = require('path');

const files = [
  'MBL JULY - DEC 2025.xlsx',
  'MBL 1st Jan to 19th Mar 20261.xlsx',
  'BAHL Statements.xlsx'
];

files.forEach(file => {
  try {
    const filePath = path.join(process.cwd(), file);
    console.log(`\n--- File: ${file} ---`);
    const workbook = xlsx.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('First 15 rows:');
    data.slice(0, 15).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
