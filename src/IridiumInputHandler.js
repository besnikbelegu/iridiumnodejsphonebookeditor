const CSV = require('./utils/CSVUtils')();
const { read, delete: deleteCmd, deleteAll, new: newCmd, readAll, ResponseTypes } = require('./commands/ATCommands');
class IridiumCommandHandler {
  savePhonebookEntries = async (phonebookEntries) => {
    if (phonebookEntries.length <= 0) await executeCommand('read');
    if (phonebookEntries.length > 0) {
      let filename = readlineSync.question('Enter filename: ');
      console.log(`Writing to CSV file ${filename}.csv`);
      //need to get WriteToCSV function 
      await CSV.save(`${filename}.csv`, phonebookEntries);
      console.log("Command executed. Ready for the next command.");
    } else {
      console.error('!!!!No contacts to download! Please use \'read\' command before downloading!!!!');
    }
  }
  readPhonebookEntries = async (phonebookEntries) => {
    phonebookEntries.length = 0;
    await sendCommand(readAll);
    await waitForResponse();
    console.log("Command executed. Ready for the next command.");
  }
}

async function executeCommand(userInput) {
  try {
    switch (userInput) {
      case 'save':
        console.log(`'${userInput}' command executing!`)
        if (phonebookEntries.length <= 0) await executeCommand('read');
        if (phonebookEntries.length > 0) {
          let filename = readlineSync.question('Enter filename: ');
          console.log(`Writing to CSV file ${filename}.csv`);
          writeToCSV(`${filename}.csv`, phonebookEntries);
          console.log("Command executed. Ready for the next command.");
        } else {

          console.error('!!!!No contacts to download! Please use \'read\' command before downloading!!!!');
        }
        break;
      case 'read':
        console.log(`'${userInput}' command executing!`)
        phonebookEntries.length = 0;
        await sendCommand(readAll);
        await waitForResponse();
        console.log("Command executed. Ready for the next command.");
        break;
      case 'delete':
        console.log(`'${userInput}' command executing!`)
        displayPhoneEntryAsTable(phonebookEntries);
        console.log(`99. DELETE ALL ENTRIES`);
        let entry = readlineSync.questionInt('Enter entry number to delete: ');
        switch (entry) {
          case 99:
            console.log('Deleting all entries');
            await sendCommand(deleteAll);
            await waitForResponse();
            phonebookEntries.length = 0;
            break;
          default:
            if (!isNaN(entry)) {
              console.log('Deleting entry', entry);
              await sendCommand(`${deleteCmd}${entry}`);
              await waitForResponse();
              phonebookEntries.splice(entry, 1);
            } else {
              console.log('Invalid entry number.');
            }
            break;
        }
        break;
      case 'new':
        console.log(`'${userInput}' command executing!`)
        let newentry = readlineSync.question('Enter the entry details: ');
        let encoded_newentry = processAndDecode(newentry, 'encode');
        console.log(`This is the new entry: ${encoded_newentry}`);
        await sendCommand(`${newCmd}${encoded_newentry}`);
        await waitForResponse();
        break;
      case 'import':
        const files = fs.readdirSync('./contacts');
        if (files.length === 0) {
          console.log("No files available for import.");
          return;
        }
        console.log(`Available files total ${files.length} files:`);
        files.forEach((file, index) => {
          console.log(`${index + 1}. ${file}`);
        });
        const fileChoice = readlineSync.questionInt(
          `Enter the number of the file you want to import ${files.length == 1 ? '(Default: 1):' : ':'} `,
          {
            defaultInput: '1'
          });
        if (fileChoice < 1 || fileChoice > files.length) {
          console.log("Invalid choice. Please try again.");
          return;
        }

        const selectedFile = files[fileChoice - 1];
        console.log(`Importing from ${selectedFile}...`);

        await addMultipleEntriesFromCSV(`${selectedFile}`);
        break;
      default:
        console.log(`Sending a custom command: AT+${userInput.toUpperCase()}`);
        await sendCommand(`AT+${userInput.toUpperCase()}`);
        await waitForResponse();
        break;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }

}