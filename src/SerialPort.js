const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { ResponseTypes } = require('./commands/ATCommands');
const readlineSync = require('readline-sync');
const config = require('./utils/config');

class Serial {
  constructor() {
    if (!Serial.instance) {
      this.port = new SerialPort({
        path: config.PORT,
        baudRate: config.BAUDRATE,
        autoOpen: config.AUTOOPEN,
        autoBaud: config.AUTOBAUD
      });
      this.modemName = process.platform !== 'win32' ? 'usbmodem' : 'COM';
      this.MAX_RETRIES = 10;
      this.retryCount = 0;
      this.totalEntries = 0
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

      this.init();
      Serial.instance = this;
    }
    return Serial.instance;
  }
  listPorts = async () => {
    try {
      const ports = await SerialPort.list();
      const usbmodems = ports.filter(_port => _port.path && _port.path.includes(this.modemName));
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
  selectPort = (ports) => {
    // console.log('entered here!!!')
    const choice = readlineSync.questionInt("Select a port by entering its number (Default: 1): ", { defaultInput: '1' });
    const index = choice - 1;
    if (ports[index]) {
      console.log(`You selected ${ports[index].path}`);
      // Here you can open the port and proceed with your application logic
      return ports[index].path;
    } else {
      console.log("Invalid choice. Try again.");
      return selectPort(ports);
    }
  };
  attemptConnection = async () => {
    try {
      let avaliablePorts = await this.listPorts();
      // console.log(avaliablePorts.length)
      if (avaliablePorts.length !== 0)
        process.env.PORT = this.selectPort(avaliablePorts);
      if (this.port.isOpen) await this.port.close();
      await this.port.open();
    } catch (err) {
      console.error(`Error opening port: ${err.message}`);
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`Retrying... (${this.retryCount} / ${this.MAX_RETRIES})`);
        setTimeout(this.attemptConnection, 5000);
      } else {
        console.error('Max retries reached. Exiting.');
        process.exit(1);
      }
    }
  }
  // Utility functions related to dealing with ports and serial communication
  waitForResponse = async () => {
    return new Promise((resolve, reject) => {
      let dataBuffer = '';
      const dataHandler = (data) => {
        // console.log(`Received data: ${data}`);
        dataBuffer += data;
        if (dataBuffer.includes(ResponseTypes.OK) || dataBuffer.includes(ResponseTypes.ERROR)) {
          this.parser.removeListener('data', dataHandler);
          if (dataBuffer.includes(ResponseTypes.ERROR)) {
            console.error(`Command failed: ${dataBuffer}`);
            reject(new Error('Command failed'));
          } else {
            resolve(dataBuffer);
          }
        }
      };
      this.parser.on('data', dataHandler);
    });
  }

  sendCommand = async (cmd) => {
    try {
      // console.log(`Sending command: ${cmd}`);
      this.port.write(`${cmd}\r\n`);
      return await this.waitForResponse();
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
  closePort = async () => {
    await this.port.close();
  }
  init = async () => {
    this.port.on('open', () => {
      console.log(`Connected to ${this.port.path}`);
    });

    this.port.on('error', (err) => {
      console.error(`Error: ${err.message}`);
    });

    this.port.on('disconnect', () => {
      console.log('Device disconnected');
    });

    this.port.on('close', () => {
      console.log(`Disconnected from ${this.port.path}`);
    });
    await this.attemptConnection()
  }
}

const instance = new Serial();
// Object.freeze(instance);

module.exports = instance;
