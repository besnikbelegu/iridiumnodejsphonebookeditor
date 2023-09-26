
//Base Commands class



class Commands {
  async execute(userInput, args) {
    throw new Error('This method should be overridden by subclass"');
  }
}

module.exports = Commands;
