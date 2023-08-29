const fs = require('fs');
const path = require('path');

let phonebookEntries = [];

const PhoneBookDB = {
  phonebookEntries,
  addToDB: (entry) => {
    phonebookEntries.push(entry);
  },
  readCSV: (filename) => {
    const filePath = path.join(__dirname, '../../contacts', filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return fileContents.split('\n');
  },
  writeToCSV: (filename, data) => {
    const csvContent = data.map(row => row.replace(/\n$/, '')).join("\n");
    fs.writeFileSync(path.join(__dirname, '../../contacts', filename), csvContent, 'utf8');
  },
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
