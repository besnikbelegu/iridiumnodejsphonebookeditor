module.exports = {
  ATCommands: {
    read: 'AT+CAPBR=', // AT+CAPBR=<index>
    delete: 'AT+CAPBD=', // AT+CAPBD=<index>
    deleteAll: 'AT+CAPBD=ALL', // AT+CAPBD=<index>
    new: 'AT+CAPBW=', // AT+CAPBW=<index>,<number>,<type>,<text>
    readAll: 'AT+CAPBR=?',
  },
  ResponseTypes: {
    OK: 'OK',
    ERROR: 'ERROR',
    CAPBR: '+CAPBR:'
  }
}