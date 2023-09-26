const SerialPort = require('./SerialPort');


async function init() {
  const response = await SerialPort.sendCommand('AT+CAPBR=?');
  console.log(`Response: ${response}`);
  SerialPort.closePort();
}
init();