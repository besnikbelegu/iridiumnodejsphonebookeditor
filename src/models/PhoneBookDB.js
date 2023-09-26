const fs = require('fs');
const path = require('path');

let phonebookEntries = [];

const PhoneBookDB = {
  phonebookEntries,
  addToDB: (entry) => {
    phonebookEntries.push(entry);
  },
  /* The `readCSV` function is responsible for reading the contents of a CSV file. It takes a `filename` parameter, which is the name of the file to be read. */
  readCSV: (filename) => {
    const filePath = path.join(__dirname, '../../contacts', filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return fileContents.split(/\r?\n/).filter(Boolean);
  },
  /* The `writeToCSV` function is responsible for writing data to a CSV file. It takes two parameters: `filename` (the name of the file to write to) and `data` (an array of rows to be written to the file). */
  writeToCSV: (filename, data) => {
    const csvContent = data.map(row => row.replace(/\n$/, '')).join("\n");
    fs.writeFileSync(path.join(__dirname, '../../contacts', filename), csvContent, 'utf8');
  },
  /* The `displayPhoneEntryAsTable` function takes an array of rows as input and displays the data in a table format using the `console.table` method. */
  displayPhoneEntryAsTable: (rows) => {
    const tableData = [];
    const processRow = (parsedData) => {
      const nv = '-'.repeat(8);
      const dataObject = {
        "Name": parsedData[0] || nv,
        "Home Number": parsedData[1] || nv,
        "Work Number": parsedData[2] || nv,
        "Mobile Number": parsedData[3] || nv,
        "Other Number": parsedData[4] || nv,
        "Email": parsedData[5] || nv,
        "Notes": parsedData[6] ? parsedData[6].replace('\n', nv) : nv
      };
      tableData.push(dataObject);
    };
    for (const row of rows) {
      const parsedData = row.split(',');
      processRow(parsedData);
    }
    console.table(tableData);
  }
};

module.exports = { PhoneBookDB };
