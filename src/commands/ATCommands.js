module.exports = {
  read: 'AT+CAPBR=',
  delete: 'AT+CAPBD=',
  deleteAll: 'AT+CAPBD=ALL',
  new: 'AT+CAPBW=',
  readAll: 'AT+CAPBR=?',
  ResponseTypes: {
    OK: 'OK',
    ERROR: 'ERROR',
    CAPBR: '+CAPBR:'
  }
};
