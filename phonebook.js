const readlineSync = require('readline-sync');
const { decodeUCS2, encodeUCS2 } = require('./UCS2EncodeDecode');
const fs = require('fs');
const path = require('path');

let phonebookEntries = [];
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const _port = '/dev/tty.usbmodem21401';
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
  // promptUser();
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
    port.write(`AT+CAPBR=${_currentEntry}\r\n`);
    await waitForResponse();
    _currentEntry++;
    readPhoneBookEntry(_totalEntries, _currentEntry);
  } else {
    console.log('All entries processed.');
    totalEntries = 0;
    // promptUser();
    await mainLoop();
  }
}

function waitForResponse() {
  return new Promise((resolve) => {
    let dataBuffer = '';

    const dataHandler = (data) => {
      dataBuffer += data;
      if (dataBuffer.includes('OK') || dataBuffer.includes('ERROR')) {
        parser.removeListener('data', dataHandler);
        if (dataBuffer.includes('ERROR')) {
          console.error('Command failed.', dataBuffer);
        } else {
          if (dataBuffer.includes('OK')) {
            dataBuffer = dataBuffer.split('OK')[0].trim();
          }
          if (dataBuffer.includes('+CAPBR:')) {
            if (dataBuffer.includes(",")) {
              const rawData = dataBuffer.split('+CAPBR:')[1].trim();
              console.log(`${processAndDecode(rawData)}`);
            } else {
              dataBuffer = dataBuffer.split('OK')[0].trim();
              dataBuffer = dataBuffer.split('+CAPBR:')[1].trim()
              if (!isNaN(dataBuffer))
                totalEntries = dataBuffer;
              console.log('Total: ', totalEntries, 'entries');
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

    parser.on('data', dataHandler);
  });
}
async function mainLoop() {
  let exit = false;

  while (!exit) {
    let command = readlineSync.question('Enter AT command without AT+ \n(or type "exit" to quit;\nread to get all entries\nimport, delete or new): ');
    let userInput = command.toLowerCase();

    if (userInput.length > 0) {
      console.log("Please wait while the command is being executed...");
      switch (userInput) {
        case 'exit':
          port.close();
          return;
        case 'download':
          console.log(`'${userInput}' command executing!`)
          let filename = readlineSync.question('Enter filename: ');
          console.log(`Writing to CSV file ${filename}.csv`);
          writeToCSV(`${filename}.csv`, phonebookEntries);
          phonebookEntries = [];
          console.log("Command executed. Ready for the next command.");
          break;
        case 'read':
          console.log(`'${userInput}' command executing!`)
          phonebookEntries = [];
          port.write('AT+CAPBR=?\r\n');
          await waitForResponse();
          console.log("Command executed. Ready for the next command.");
          break;
        case 'delete':
          console.log(`'${userInput}' command executing!`)
          let entry = readlineSync.question('Enter entry number to delete (\'all\' to clear the phonebook): ');
          switch (entry.toLowerCase()) {
            case 'all':
              console.log('Deleting all entries');
              port.write('AT+CAPBD=ALL\r\n');
              await waitForResponse();
              break;
            default:
              if (!isNaN(entry)) {
                console.log('Deleting entry', entry);
                port.write(`AT+CAPBD=${entry}\r\n`);
                await waitForResponse();
              } else {
                console.log('Invalid entry number.');
              }
              break;
          }
          break;
        case 'new':
          console.log(`'${userInput}' command executing!`)
          let newentry = readlineSync.question('Enter the entry details: ');
          let encoded_newentry = processAndDecode(newentry, 'encode');
          console.log(`This is the new entry: ${encoded_newentry}`);
          port.write(`AT+CAPBW=${encoded_newentry}\r\n`);
          await waitForResponse();
          break;
        case 'import':
          console.log(`'${userInput}' command executing!`)
          let importfile = readlineSync.question('Enter the filename from which you want to import: ');
          importfile = `${importfile}.csv`;
          console.log(`Importing from ${importfile}`);
          await addMultipleEntriesFromCSV(importfile);
          break;
        default:
          console.log(`Sending: AT+${userInput.toUpperCase()}`);
          port.write(`AT+${userInput.toUpperCase()}\r\n`);
          await waitForResponse();
          break;
      }
    }
  }
}

port.on('open', async () => {
  console.log('Connected to ', _port);
  retryCount = 0;
  await mainLoop();
});
// Create a debug stream that simply logs all incoming data
// port.on('data', (data) => {
//   console.log(`[DEBUG] Received data: ${data}`);
// });
// async function promptUser() {
//   console.log('prompt user called...')
//   let command = readlineSync.question('Enter AT command without AT+ \n(or type "exit" to quit;\nread to get all entries\nimport, delete or new): ');
//   let userInput = command.toLowerCase();
//   if (userInput.length > 0) {
//     // Display a message to inform the user to wait
//     console.log("Please wait while the command is being executed...");
//     switch (userInput) {
//       case 'exit':
//         port.close();
//         return;
//       case 'download':
//         console.log(`'${userInput}' command executing!`)
//         let filename = readlineSync.question('Enter filename: ');
//         console.log(`Writing to CSV file ${filename}.csv`);
//         writeToCSV(`${filename}.csv`, phonebookEntries);
//         phonebookEntries = [];
//         console.log("Command executed. Ready for the next command.");
//         promptUser();
//         break;
//       case 'read':
//         console.log(`'${userInput}' command executing!`)
//         phonebookEntries = [];
//         port.write('AT+CAPBR=?\r\n');
//         await waitForResponse();
//         console.log("Command executed. Ready for the next command.");
//         promptUser();
//         break;
//       case 'delete':
//         console.log(`'${userInput}' command executing!`)
//         let entry = readlineSync.question('Enter entry number to delete (\'all\' to clear the phonebook): ');
//         switch (entry.toLowerCase()) {
//           case 'all':
//             console.log('Deleting all entries');
//             port.write('AT+CAPBD=ALL\r\n');
//             await waitForResponse();
//             promptUser();
//             break;
//           default:
//             if (!isNaN(entry)) {
//               console.log('Deleting entry', entry);
//               port.write(`AT+CAPBD=${entry}\r\n`);
//               await waitForResponse();
//               promptUser();
//             } else {
//               console.log('Invalid entry number.');
//             }
//             break;
//         }
//         break;
//       case 'new':
//         console.log(`'${userInput}' command executing!`)
//         let newentry = readlineSync.question('Enter the entry details: ');
//         let encoded_newentry = processAndDecode(newentry, 'encode');
//         console.log(`This is the new entry: ${encoded_newentry}`);
//         port.write(`AT+CAPBW=${encoded_newentry}\r\n`);
//         await waitForResponse();
//         promptUser();
//         break;
//       case 'import':
//         console.log(`'${userInput}' command executing!`)
//         let importfile = readlineSync.question('Enter the filename from which you want to import: ');
//         importfile = `${importfile}.csv`;
//         console.log(`Importing from ${importfile}`);
//         await addMultipleEntriesFromCSV(importfile);
//         promptUser();
//         break;
//       default:
//         console.log(`Sending: AT+${userInput.toUpperCase()}`);
//         port.write(`AT+${userInput.toUpperCase()}\r\n`);
//         waitForResponse();
//         promptUser();
//         break;
//     }
//   }
// }

function cleanInput(data) {
  return data.replace(/[^0-9a-fA-F]/g, '');
}

function processAndDecode(data, action = 'decode') {
  const segments = data.split(',');
  const decodedSegments = segments.map(segment => {
    if (action === 'decode' && /^[0-9a-fA-F]+$/.test(segment)) {
      return decodeUCS2(segment);
    } else if (action === 'encode') {
      return encodeUCS2(segment);
    }
    return segment;
  });
  if (action === 'decode') {
    phonebookEntries.push(decodedSegments);
  }
  return decodedSegments.join(',');
}

// port.on('open', async () => {
//   console.log('Connected to ', _port);
//   retryCount = 0;
//   await promptUser();
// });

port.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
port.on('disconnect', function () {
  console.log('Device disconnected');
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

attemptConnection();
