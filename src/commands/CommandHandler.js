const { processAndDecode } = require('../utils/EncodeDecode');
const readlineSync = require('readline-sync');
const ATCommands = require('./ATCommands');
const fs = require('fs');

class CommandHandler {
  constructor() {
    this.commands = {};
    this.commands.phoneBook = new ATCommands('phoneBook');
    this.commands.emergency = new ATCommands('emergency');
  }
  async execute(userInput) {
    const { command, args } = processAndDecode(userInput);
    const commandGroup = commandType(command);
    if (commandGroup) {
      await this.commands[commandGroup].execute(command, args);
    } else {
      console.log('Command not found');
    }
  }
}
const phoneBookCommands = ['read', 'delete', 'deleteAll', 'new', 'readAll'];
const emergencyCommands = ['emergencyCallRecepientGet', 'emergencyDeliveryModeGet', 'emergencyDeliveryMessageRecepientGet'];

function commandType(command) {
  if (phoneBookCommands.includes(command)) return 'phoneBook';
  if (emergencyCommands.includes(command)) return 'emergency';
}

module.exports = CommandHandler;
