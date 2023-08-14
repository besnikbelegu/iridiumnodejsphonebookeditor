const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const _port = '/dev/tty.usbmodem213101';
const port = new SerialPort({
  path: _port,
  baudRate: 19200,
  autoOpen: true
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
const MAX_RETRIES = 10;
let retryCount = 0;

// A function that waits for response data
function waitForResponse() {
  return new Promise((resolve) => {
    let dataBuffer = '';

    // Handler for the 'data' event
    const dataHandler = (data) => {
      dataBuffer += data;  // Append received data to the buffer
      console.log(`Received: ${dataBuffer}`)
      if (dataBuffer.includes('OK') || dataBuffer.includes('ERROR')) {
        parser.removeListener('data', dataHandler);  // Detach the data handler
        if (dataBuffer.includes('ERROR')) {
          console.error('Command failed.', dataBuffer);
        } else {
          if (dataBuffer.includes('OK')) {
            dataBuffer = dataBuffer.split('OK')[0].trim();
          }
          console.log('Command succeeded.');
          if (dataBuffer.includes('+CAPBR:')) {
            if (dataBuffer.includes(",")) {
              // Extract data after the first colon
              const rawData = dataBuffer.split('+CAPBR:')[1].trim();
              console.log('received a capbr');
              console.log(`Decoded: ${processAndDecode(rawData)}`);
            } else {
              console.log(dataBuffer.split('+CAPBR:')[1].trim());
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
  rl.question('Enter AT command without AT+ (or type "exit" to quit): ', async (command) => {
    if (command.toLowerCase() === 'exit') {
      port.close();
      rl.close();
      return;
    }

    console.log(`Sending: AT+${command.toUpperCase()}`);
    port.write(`AT+${command.toUpperCase()}\r\n`);

    await waitForResponse();
    promptUser();
  });
}

function cleanInput(data) {
  return data.replace(/[^0-9a-fA-F]/g, '');  // Removing anything that isn't hexadecimal
}

function decodeUCS2(ucs2String) {
  let characters = [];
  for (let i = 0; i < ucs2String.length; i += 4) {
    let code = parseInt(ucs2String.substr(i, 4), 16);
    characters.push(String.fromCharCode(code));
  }
  return characters.join('');
}
function processAndDecode(data) {
  // Split at commas
  const segments = data.split(',');

  // Decode each segment if it has hexadecimal characters, otherwise keep as is
  const decodedSegments = segments.map(segment => {
    if (/^[0-9a-fA-F]+$/.test(segment)) {
      return decodeUCS2(segment);
    }
    return segment;
  });

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
