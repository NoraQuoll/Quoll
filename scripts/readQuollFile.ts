import * as xlsx from 'xlsx';
import * as fs from 'fs';

// Function to read an XLSX file and convert it to JSON
function readExcelToJSON(filePath: string) {
    // Read the workbook
    const workbook = xlsx.readFile(filePath);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get the first sheet
    const sheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    return jsonData;
}

// File path to your XLSX file
const filePath = './Wombex x Quoll _ Final.xlsx';

// Read the XLSX file and convert it to JSON
const jsonData = readExcelToJSON(filePath);

// Write the JSON data to a file
const outputFilePath = 'bscQuollWMX.json';
fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');

console.log(`Excel data has been converted to JSON and saved to ${outputFilePath}`);
