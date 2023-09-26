// Note: AT Commands for the Iridium Satellite Phone based on Iridium ISU AT Command Reference v5
module.exports = {
  read: 'AT+CAPBR=',
  delete: 'AT+CAPBD=',
  deleteAll: 'AT+CAPBD=ALL',
  new: 'AT+CAPBW=',
  readAll: 'AT+CAPBR=?',
  emergencyCallRecepientGet: 'AT+LBSECR=?',
  emergencyDeliveryModeGet: 'AT+LBSEDM=?',
  emergencyDeliveryMessageRecepientGet: 'AT+LBSEMR=?',
  ResponseTypes: {
    OK: 'OK',
    ERROR: 'ERROR',
    CAPBR: '+CAPBR:',
    CAPBD: 'CAPBD',
    CAPBW: 'CAPBW',
    emergencyDeliveryMessageRecepient: '+LBSEMR:',
    emergencyDeliveryMode: '+LBSEDM:',
    emergencyCallRecepient: '+LBSECR:'
  }
};
