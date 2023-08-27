module.exports = {
  PORT: process.env.PORT || '/dev/tty.usbmodem21401',
  BAUDRATE: parseInt(process.env.BAUDRATE, 10) || 38400,
  AUTOOPEN: process.env.AUTOOPEN === 'true' || true,
  AUTOBAUD: parseInt(1)
};