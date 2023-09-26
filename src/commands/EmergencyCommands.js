const Commands = require('./Commands');

class EmergencyCommands extends Commands {
  // emergencyCallRecepientGet
  // emergencyDeliveryModeGet
  // emergencyDeliveryMessageRecepientGet
  async execute(userInput, args) {
    switch (userInput) {
      case 'emergencyCallRecepientGet':
        await this.emergencyCallRecepientGet();
        break;
      case 'emergencyDeliveryModeGet':
        await this.emergencyDeliveryModeGet();
        break;
      case 'emergencyDeliveryMessageRecepientGet':
        await this.emergencyDeliveryMessageRecepientGet();
        break;
    }
  }
  async emergencyCallRecepientGet() {
    console.log('emergencyCallRecepientGet');
  }
  async emergencyDeliveryModeGet() {
    console.log('emergencyDeliveryModeGet');
  }
  async emergencyDeliveryMessageRecepientGet() {
    console.log('emergencyDeliveryMessageRecepientGet');
  }
}
module.exports = EmergencyCommands;