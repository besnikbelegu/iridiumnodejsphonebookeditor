// Description: Utility functions for reading and writing CSV files.

function readCSV(filename) {
  const filePath = path.join(__dirname, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const rows = fileContents.split('\n');
  return rows.map(row => row.split(','));
}

async function addMultipleEntriesFromCSV(filename) {
  const entries = readCSV(filename);
  for (let entry of entries) {
    let encodedEntry = processAndDecode(entry.join(','), 'encode');
    console.log(`Adding entry: ${encodedEntry}`);
    // port.write(`AT+CAPBW=${encodedEntry}\r\n`);
    await waitForResponse();
  }
  console.log('All entries from CSV added.');
  promptUser();
}
function writeToCSV(filename, data) {
  const csvContent = data.map(e => e.join(",")).join("\n");
  fs.writeFileSync(path.join(__dirname, filename), csvContent, 'utf8');
}
module.exports = {
  addMultipleEntriesFromCSV,
  readCSV,
  writeToCSV
}