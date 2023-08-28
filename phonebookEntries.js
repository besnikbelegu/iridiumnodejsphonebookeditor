const fs = require('fs');
const path = require('path');

/* The line `let phonebookEntries = [];` is declaring a variable named `phonebookEntries` and
initializing it as an empty array. This array will be used to store the phone book entries in the
`PhoneBookDB` object. */
let phonebookEntries = [];

/* The `PhoneBookDB` object is a JavaScript object that represents a phone book database. It contains several properties and methods: */
const PhoneBookDB = {
  phonebookEntries,
  addToDB: (entry) => {
    phonebookEntries.push(entry);
  },
  /* The `readCSV` function is responsible for reading data from a CSV file. */
  readCSV: (filename) => {
    const filePath = path.join(__dirname, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const rows = fileContents.split('\n');
    return rows;//rows.map(row => row.split(','));
  },
  /* The `writeToCSV` function is responsible for writing data to a CSV file. */
  writeToCSV: (filename, data) => {
    console.log(data);
    const csvContent = data.map(row => row.replace(/\n$/, '')).join("\n");
    fs.writeFileSync(path.join(__dirname, "contacts", filename), csvContent, 'utf8');
  },
  displayPhoneEntryAsTable: (rows) => {
    // console.log('Displaying phone book entries as a table');
    // console.log(rows);

    // Initialize an array to hold the parsed objects
    const tableData = [];

    // Helper function to process a single row
    const processRow = (parsedData) => {
      const nv = '-'.repeat(8);
      // Create an object with named fields
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

    // Loop through each row and parse it
    for (const row of rows) {
      let parsedData;
      if (Array.isArray(row)) {
        // Skip empty rows
        if (!row.some(field => field && field.trim())) continue;
        parsedData = row;
      } else {
        // Skip empty rows
        if (!row.trim()) continue;
        parsedData = row.split(',');
      }
      processRow(parsedData);
    }

    // Output as a table
    console.table(tableData);
  }


}

module.exports = { PhoneBookDB }