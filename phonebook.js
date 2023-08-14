const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline')
const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const _port = 'COM4';

const port = new SerialPort({
  path: _port,
  baudRate: 9600,
  autoOpen: false
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
const MAX_RETRIES = 10;
let retryCount = 0;
let responseReceived = false;

// Read data from the port
parser.on('data', (data) => {
  console.log(`Received: ${data}`);
  responseReceived = true;

  if (data.includes('ERROR')) {
    console.log('Command failed.');
    // Handle error or retry logic here
  } else if (data.includes('OK')) {
    console.log('Command succeeded.');
    // Handle success logic here
  }
  // Add any other expected response patterns as needed
});

port.on('open', () => {
  const _port = 'COM4';
  console.log('Connected to ', _port);

  // setTimeout(() => {
  //   if (!responseReceived) {
  //     console.error('No response from device. Check the device or the command.');
  //     port.close();
  //   }
  // }, 10000); // 10 seconds timeout

  retryCount = 0; // reset the count on successful connection
  // Read phonebook. Replace with the actual command.
  // port.write('AT+CAPBR=?\r\n');
  promptUser();
});

port.on('error', (err) => {
  console.error(`Error: ${err.message}`);
});

port.on('close', () => {
  console.log('Disconnected from', _port);
});

// Function to get user input
function promptUser() {
  // const rl = readlineInterface.createInterface({
  //   input: process.stdin,
  //   output: process.stdout
  // });

  rl.question('Enter AT command (or type "exit" to quit): ', (command) => {
    if (command.toLowerCase() === 'exit') {
      port.close();
      rl.close();
    } else {
      port.write(`${command}\r\n`);
      promptUser();  // Get next command
    }
  });
}

// Open the port
// port.open((err) => {
//   if (err) {
//     return console.error(`Error opening port: ${err.message}`);
//   }
// });

// Function to attempt connection
function attemptConnection() {
  port.open((err) => {
    if (err) {
      console.error(`Error opening port: ${err.message}`);
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying... (${retryCount}/${MAX_RETRIES})`);
        setTimeout(attemptConnection, 5000); // Wait 5 seconds and try again
      } else {
        console.error('Max retries reached. Exiting.');
        process.exit();
      }
    }
  });
}

// Start the connection attempt
attemptConnection();
