const readlineSync = require('readline-sync');
const { decodeUCS2, encodeUCS2 } = require('./UCS2EncodeDecode');
const fs = require('fs');
const path = require('path');
// Add this at the top of your script
let phonebookEntries = [];
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});


const _port = '/dev/tty.usbmodem213101';
const port = new SerialPort({
  path: _port,
  baudRate: 19200,
  autoOpen: true
});

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
    port.write(`AT+CAPBW=${encodedEntry}\r\n`);
    await waitForResponse();
  }
  console.log('All entries from CSV added.');
}
function writeToCSV(filename, data) {
  const csvContent = data.map(e => e.join(",")).join("\n");
  fs.writeFileSync(path.join(__dirname, filename), csvContent, 'utf8');
}

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
const MAX_RETRIES = 10;
let retryCount = 0;
let totalEntries = 0;

async function readPhoneBookEntry(_totalEntries, _currentEntry = 0) {
  if (_currentEntry < _totalEntries) {
    // console.log(`Fetching Phonebook Entry: ${_currentEntry}`);
    port.write(`AT+CAPBR=${_currentEntry}\r\n`);
    await waitForResponse();
    _currentEntry++;
    readPhoneBookEntry(_totalEntries, _currentEntry);
  } else {
    console.log('All entries processed.');
    totalEntries = 0;
    promptUser();
  }
}
// A function that waits for response data
function waitForResponse() {
  return new Promise((resolve) => {
    let dataBuffer = '';

    // Handler for the 'data' event
    const dataHandler = (data) => {
      dataBuffer += data;  // Append received data to the buffer
      // console.log(`Received: ${dataBuffer}`)
      if (dataBuffer.includes('OK') || dataBuffer.includes('ERROR')) {
        parser.removeListener('data', dataHandler);  // Detach the data handler
        if (dataBuffer.includes('ERROR')) {
          console.error('Command failed.', dataBuffer);
        } else {
          if (dataBuffer.includes('OK')) {
            dataBuffer = dataBuffer.split('OK')[0].trim();
          }
          // console.log('Command succeeded.');
          if (dataBuffer.includes('+CAPBR:')) {
            if (dataBuffer.includes(",")) {
              // Extract data after the first colon
              const rawData = dataBuffer.split('+CAPBR:')[1].trim();
              // console.log('received a capbr');
              console.log(`${processAndDecode(rawData)}`);
            } else {
              dataBuffer = dataBuffer.split('OK')[0].trim();
              dataBuffer = dataBuffer.split('+CAPBR:')[1].trim()
              if (!isNaN(dataBuffer))
                totalEntries = dataBuffer;
              console.log('Total: ', totalEntries, 'entries');

              // If there are entries, fetch them.
              if (totalEntries > 0) {
                readPhoneBookEntry(totalEntries);
                return;
              }
            }
          } else {
            console.log(dataBuffer);
          }
        }
        resolve();
      }
    };

    parser.on('data', dataHandler);  // Attach the data handler
  });
}


async function promptUser() {
  let command = readlineSync.question('Enter AT command without AT+ \n(or type "exit" to quit;\nread to get all entries\nimport, delete or new): ');
  let userInput = command.toLowerCase();

  switch (userInput) {
    case 'exit':
      port.close();
      return;
    case 'download':
      // if (phonebookEntries.length === 0)
      //   return console.log('No entries to save.');
      let filename = readlineSync.question('Enter filename: ');
      // Add this after 'All entries processed.' log statement
      // let filename = userInput.split('>')[1];
      console.log(`Writing to CSV file ${filename}.csv`);
      writeToCSV(`${filename}.csv`, phonebookEntries);
      phonebookEntries = []; // Reset the array for future use
      promptUser();
      break;
    case 'read':
      phonebookEntries = [];
      port.write('AT+CAPBR=?\r\n');
      waitForResponse().then(promptUser);
      break;
    case 'delete':
      let entry = readlineSync.question('Enter entry number to delete (\'all\' to clear the phonebook): ');
      switch (entry.toLowerCase()) {
        case 'all':
          console.log('Deleting all entries');
          console.log(`Sending: AT+CAPBD=ALL\r\n`);
          port.write('AT+CAPBD=ALL\r\n');
          await waitForResponse();
          break;
        default:
          if (!isNaN(entry)) {
            console.log('Deleting entry', entry)
            console.log(`Sending: AT+CAPBD=${entry}\r\n`);
            port.write(`AT+CAPBD=${entry}\r\n`);
            await waitForResponse();
          } else {
            console.log('Invalid entry number.');
          }
          break;
      }
      promptUser();
      break;
    case 'new':
      let newentry = readlineSync.question('Enter the entry details: ');
      let encoded_newentry = processAndDecode(newentry, 'encode');
      console.log(`This is the new entry: ${encoded_newentry}`);
      console.log(`Sending: AT+CAPBW=${encoded_newentry}\r\n`);
      port.write(`AT+CAPBW=${encoded_newentry}\r\n`);
      await waitForResponse().then(promptUser);
      break;
    case 'import':
      let importfile = readlineSync.question('Enter the filename from which you want to import: ');
      importfile = `${importfile}.csv`;
      console.log(`Importing from ${importfile}`);
      await addMultipleEntriesFromCSV(importfile);
      promptUser();
      break;
    default:
      console.log(`Sending: AT+${userInput.toUpperCase()}`);
      port.write(`AT+${userInput.toUpperCase()}\r\n`);
      waitForResponse().then(promptUser);
      break;
  }
}

function cleanInput(data) {
  return data.replace(/[^0-9a-fA-F]/g, '');  // Removing anything that isn't hexadecimal
}


function processAndDecode(data, action = 'decode') {
  // Split at commas
  const segments = data.split(',');

  // Decode each segment if it has hexadecimal characters, otherwise keep as is
  const decodedSegments = segments.map(segment => {
    if (action === 'decode' && /^[0-9a-fA-F]+$/.test(segment)) {
      return decodeUCS2(segment);
    } else if (action === 'encode') {
      return encodeUCS2(segment);
    }
    return segment;
  });
  // After the data has been processed, push it to the phonebookEntries array
  if (action === 'decode') {
    phonebookEntries.push(decodedSegments);
  }

  // Join the segments using spaces
  return decodedSegments.join(',');
}


port.on('open', async () => {
  console.log('Connected to ', _port);
  retryCount = 0;
  await promptUser();
});

port.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});

port.on('close', () => {
  console.log('Disconnected from', _port);
});

async function attemptConnection() {
  try {
    await port.open();
  } catch (err) {
    console.error(`Error opening port: ${err.message}`);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
      setTimeout(attemptConnection, 5000);
    } else {
      console.error('Max retries reached. Exiting.');
      process.exit();
    }
  }
}

// Start the connection attempt
attemptConnection();
