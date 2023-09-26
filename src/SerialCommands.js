const { readCSV, writeToCSV, phonebookEntries, displayPhoneEntryAsTable } = require('./models/PhoneBookDB').PhoneBookDB;
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { processAndDecode } = require('./utils/EncodeDecode');
const { read, delete: deleteCmd, deleteAll, new: newCmd, readAll, ResponseTypes } = require('./commands/ATCommands');
const readlineSync = require('readline-sync');
const config = require('./utils/config');
const fs = require('fs');

const _port = config.PORT;
const port = new SerialPort({
  path: _port,
  baudRate: config.BAUDRATE,
  autoOpen: config.AUTOOPEN,
  autoBaud: config.AUTOBAUD
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
const MAX_RETRIES = 10;
let retryCount = 0;
let totalEntries = 0;

port.on('open', async () => {
  console.log(`Connected to ${_port}`);
  retryCount = 0;
  await mainLoop();
});

port.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});

port.on('disconnect', () => {
  console.log('Device disconnected');
});

port.on('close', () => {
  console.log(`Disconnected from ${_port}`);
});

const waitForResponse = () => {
  return new Promise((resolve, reject) => {
    let dataBuffer = '';
    const dataHandler = (data) => {
      // console.log(`Received data: ${data}`);
      dataBuffer += data;
      if (dataBuffer.includes(ResponseTypes.OK) || dataBuffer.includes(ResponseTypes.ERROR)) {
        parser.removeListener('data', dataHandler);
        if (dataBuffer.includes(ResponseTypes.ERROR)) {
          console.error(`Command failed: ${dataBuffer}`);
          reject(new Error('Command failed'));
        } else {
          if (dataBuffer.includes(ResponseTypes.OK)) {
            dataBuffer = dataBuffer.split(ResponseTypes.OK)[0].trim();
          }
          if (dataBuffer.includes(ResponseTypes.CAPBR)) {
            // console.log(`ResponseTypes.CAPBR: ${dataBuffer}`)
            if (dataBuffer.includes(",")) {
              const rawData = dataBuffer.split(ResponseTypes.CAPBR)[1].trim();
              processAndDecode(rawData);
            } else {
              dataBuffer = dataBuffer.split(ResponseTypes.OK)[0].trim();
              dataBuffer = dataBuffer.split(ResponseTypes.CAPBR)[1].trim();
              if (!isNaN(dataBuffer)) {
                totalEntries = dataBuffer;
                if (totalEntries > 0) {
                  readPhoneBookEntry(totalEntries);
                  return;
                } else {
                  console.log('No entries found!');
                }
              }
            }
          } else if (dataBuffer.includes(ResponseTypes.CAPBD)) {
            // console.log(`ResponseTypes.CAPBD: ${dataBuffer}`)
            if (dataBuffer.includes("CAPBD=ALL")) {
              // Do nothing or log something specific to CAPBD
              console.log('Deleted all phonebook entries!');
            } else {
              console.log(`Entry deleted successfully: ${dataBuffer}`);
            }
          } else {
            // Only log "Command executed successfully" if none of the above conditions are met
            if (!dataBuffer.includes(ResponseTypes.CAPBW) && !dataBuffer.includes(ResponseTypes.CAPBD)) {
              console.log(`Command executed successfully: ${dataBuffer}`);
            }
          }
          resolve(dataBuffer);
        }
      }
    };
    parser.on('data', dataHandler);
  });
};

/**
 * The function `readPhoneBookEntry` reads phone book entries one by one and displays the progress as a
 * percentage.
 * @param _totalEntries - The total number of phone book entries that need to be read.
 * @param [_currentEntry=0] - The current entry number being processed in the phone book.
 */
async function readPhoneBookEntry(_totalEntries, _currentEntry = 0) {
  try {
    if (_currentEntry < _totalEntries) {
      await sendCommand(`${read}${_currentEntry}`);
      await waitForResponse();
      _currentEntry++;
      // Calculate the percentage of completed entries
      const percentageComplete = Math.round(((_currentEntry / _totalEntries) * 100).toFixed(2));

      // Display the percentage in the same line
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Reading entries... ${percentageComplete}% complete`);
      readPhoneBookEntry(_totalEntries, _currentEntry);
    } else {
      process.stdout.write('\n');
      console.log('All entries processed.');
      totalEntries = 0;
      // console.log(`Complete phonebook: ${phonebookEntries}`);
      displayPhoneEntryAsTable(phonebookEntries);
      // promptUser();
      await mainLoop();
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

}
/**
 * The function `executeCommand` is an asynchronous function that takes user input as a parameter and executes different commands based on the input.
 * @param userInput - The `userInput` parameter is a string that represents the command entered by the
 * user. It is used to determine which action to execute in the switch statement.
 * @returns The `executeCommand` function does not have a return statement, so it does not explicitly return anything.
 */
async function executeCommand(userInput) {
  try {
    switch (userInput) {
      case 'save':
        console.log(`'${userInput}' command executing!`)
        if (phonebookEntries.length <= 0) await executeCommand('read');
        if (phonebookEntries.length > 0) {
          let filename = readlineSync.question('Enter filename: ');
          console.log(`Writing to CSV file ${filename}.csv`);
          writeToCSV(`${filename}.csv`, phonebookEntries);
          console.log("Command executed. Ready for the next command.");
        } else {

          console.error('!!!!No contacts to download! Please use \'read\' command before downloading!!!!');
        }
        break;
      case 'read':
        console.log(`'${userInput}' command executing!`)
        phonebookEntries.length = 0;
        await sendCommand(readAll);
        await waitForResponse();
        console.log("Command executed. Ready for the next command.");
        break;
      case 'delete':
        console.log(`'${userInput}' command executing!`)
        displayPhoneEntryAsTable(phonebookEntries);
        console.log(`99. DELETE ALL ENTRIES`);
        let entry = readlineSync.questionInt('Enter entry number to delete: ');
        switch (entry) {
          case 99:
            console.log('Deleting all entries');
            await sendCommand(deleteAll);
            await waitForResponse();
            phonebookEntries.length = 0;
            break;
          default:
            if (!isNaN(entry)) {
              console.log('Deleting entry', entry);
              await sendCommand(`${deleteCmd}${entry}`);
              await waitForResponse();
              phonebookEntries.splice(entry, 1);
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
        await sendCommand(`${newCmd}${encoded_newentry}`);
        await waitForResponse();
        break;
      case 'import':
        const files = fs.readdirSync('./contacts');
        if (files.length === 0) {
          console.log("No files available for import.");
          return;
        }
        console.log(`Available files total ${files.length} files:`);
        files.forEach((file, index) => {
          console.log(`${index + 1}. ${file}`);
        });
        const fileChoice = readlineSync.questionInt(
          `Enter the number of the file you want to import ${files.length == 1 ? '(Default: 1):' : ':'} `,
          {
            defaultInput: '1'
          });
        if (fileChoice < 1 || fileChoice > files.length) {
          console.log("Invalid choice. Please try again.");
          return;
        }

        const selectedFile = files[fileChoice - 1];
        console.log(`Importing from ${selectedFile}...`);

        await addMultipleEntriesFromCSV(`${selectedFile}`);
        break;
      default:
        console.log(`Sending a custom command: AT+${userInput.toUpperCase()}`);
        await sendCommand(`AT+${userInput.toUpperCase()}`);
        await waitForResponse();
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

}
/**
 * The mainLoop function presents a menu to the user and executes different commands based on their choice until the user chooses to exit.
 */
async function mainLoop() {
  try {
    let exit = false;
    while (!exit) {
      console.log('Please choose an option:');
      console.log('1. Read all entries');
      console.log('2. Save to CSV');
      console.log('3. Import from CSV');
      console.log('4. Delete an entry');
      console.log('5. Exit');
      const choice = readlineSync.questionInt('Enter the number of your choice (Default: 5): ', { defaultInput: '5' });

      switch (choice) {
        case 1:
          console.log("Reading all entries...");
          await executeCommand('read');
          break;
        case 2:
          console.log("Saving to CSV...");
          await executeCommand('save');
          break;
        case 3:
          console.log("Importing from CSV...");
          await executeCommand('import');
          break;
        case 4:
          console.log("Deleting an entry...");
          await executeCommand('delete');
          break;
        case 5:
          console.log("Exiting...");
          exit = true;
          port.close();
          break;
        default:
          console.log("Invalid choice. Please enter a number between 1 and 5.");
          break;
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

}

/**
 * The function `sendCommand` sends a command to a port and handles any errors that occur.
 * @param cmd - The `cmd` parameter is a string that represents the command to be sent. It will be written to a port, followed by a carriage return and line feed characters (`\r\n`).
 */
async function sendCommand(cmd) {
  try {
    port.write(`${cmd}\r\n`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}
async function gracefulShutdown() {
  return new Promise((resolve, reject) => {
    console.log("Initiating graceful shutdown...");
    // Close the SerialPort
    if (port && port.isOpen) {
      port.close((err) => {
        if (err) {
          console.error(`Error while closing the port: ${err.message}`);
          reject(err);
          return;
        }
        console.log("Serial port closed successfully.");
        resolve();
      });
    } else {
      console.log("Serial port is already closed or not initialized.");
      resolve();
    }
  });
}
/**
 * The function `addMultipleEntriesFromCSV` reads entries from a CSV file, processes and encodes each entry, sends a command with the encoded entry, and displays the progress of adding entries as a percentage.
 * @param filename - The `filename` parameter is the name of the CSV file that contains the entries to be added.
 */
async function addMultipleEntriesFromCSV(filename) {
  try {
    const entries = readCSV(filename);
    const totalEntries = entries.length;
    let completedEntries = 0;

    displayPhoneEntryAsTable(entries);

    for (let entry of entries) {
      let encodedEntry = processAndDecode(entry, 'encode');
      // console.log(`Adding entry: ${encodedEntry}`);
      await sendCommand(`${newCmd}${encodedEntry}`);
      await waitForResponse();

      // Increment the counter for completed entries
      completedEntries++;

      // Calculate the percentage of completed entries
      const percentageComplete = ((completedEntries / totalEntries) * 100).toFixed(2);

      // Output the percentage
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Adding entry '${entry}' ${percentageComplete}% total complete`);
    }

    // Move to the next line after the loop is done
    process.stdout.write(`All entries from CSV added.\n`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}


// Function to list serial ports
/** The function `listPorts` lists the available serial ports on the system and returns an array of USB modems.
 * @returns The function `listPorts` returns an array of objects representing the available USB modem ports.
 */
const listPorts = async () => {
  try {
    const ports = await SerialPort.list();
    const modemName = process.platform !== 'win32' ? 'usbmodem' : 'COM';
    const usbmodems = ports.filter(_port => _port.path && _port.path.includes('usbmodem'));
    console.log("Available Serial Ports:");
    usbmodems.forEach((_port, index) => {
      console.log(`${index + 1}. ${_port.path} - ${_port.manufacturer || 'N/A'}`);
    });
    return usbmodems;
  } catch (err) {
    console.error("Error listing ports:", err);
  }
};

// Function to select a port
/*** The function `selectPort` allows the user to select a port by entering its number and returns the path of the selected port.
 * @param ports - An array of objects representing available ports. Each object should have a "path" property that represents the path of the port.
 * @returns The function `selectPort` returns the path of the selected port.
 */
const selectPort = (ports) => {
  const choice = readlineSync.questionInt("Select a port by entering its number (Default: 1): ", { defaultInput: '1' });
  const index = choice - 1;
  if (ports[index]) {
    console.log(`You selected ${ports[index].path}`);
    // Here you can open the port and proceed with your application logic
    return ports[index].path;
  } else if (choice === 0) {
    console.log(`You selected ${port.path}`);
    // Here you can open the port and proceed with your application logic
    return port.path;
  } else {
    console.log("Invalid choice. Try again.");
    return selectPort(ports);
  }
};
module.exports = {
  /* This method attempts to establish a connection to a port. */
  attemptConnection: async () => {
    try {
      const ports = await listPorts();
      process.env.PORT = selectPort(ports);
      if (port.isOpen) await port.close();
      await port.open();
    } catch (err) {
      console.error(`Error opening port: ${err.message}`);
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying... (${retryCount} / ${MAX_RETRIES})`);
        setTimeout(attemptConnection, 5000);
      } else {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
};
