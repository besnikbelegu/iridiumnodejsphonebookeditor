const SerialPortS = require('./SerialPort');

const port = SerialPortS.port;
const parser = SerialPortS.parser;

// Utility functions related to dealing with ports and serial communication
async function waitForResponse() {
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
          resolve(dataBuffer);
        }
      }
    };
    parser.on('data', dataHandler);
  });
}

async function sendCommand(cmd) {
  try {
    // console.log(`Sending command: ${cmd}`);
    port.write(`${cmd}\r\n`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}




module.exports = {
  waitForResponse,
  sendCommand,
  attemptConnection
};
