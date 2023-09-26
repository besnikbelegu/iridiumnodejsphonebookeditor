const Commands = require('./Commands');

//PhonebookCommands class extends Commands class
class PhonebookCommands extends Commands {
  // read
  // delete
  // deleteAll
  // new
  // readAll
  async execute(userInput, args) {
    switch (userInput) {
      case 'readAll':
        await this.readAll();
        break;
      case 'read':
        await this.read(args);
        break;
      case 'delete':
        await this.delete(args);
        break;
      case 'deleteAll':
        await this.deleteAll();
        break;
      case 'new':
        await this.new(args);
        break;
    }
  }
  async readAll() {
    console.log('readAll');
  }
  async read(args) {
    console.log('read');
  }
  async delete(args) {
    console.log('delete');
  }
  async deleteAll() {
    console.log('deleteAll');
  }
  async new(args) {
    console.log('new');
  }
}
module.exports = PhonebookCommands;