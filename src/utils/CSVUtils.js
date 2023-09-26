const fs = require('fs').promises;
const path = require('path');

class CSV {
  // Read a CSV file and return its content as an array of lines
  read = async (fileName) => {
    try {
      if (!fileName) {
        throw new Error('File name must be provided');
      }
      const filePath = path.join(__dirname, '../../contacts', fileName);
      const fileContents = await fs.readFile(filePath, 'utf8');
      return fileContents.split('\n');
    } catch (error) {
      console.error(`An error occurred while reading the file: ${error.message}`);
      return null;
    }
  }

  // Save data to a CSV file
  save = async (fileName, filePath = '../../contacts', data) => {
    try {
      if (!fileName || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid arguments');
      }
      const csvContent = data.map(row => row.replace(/\n$/, '')).join("\n");
      const fullPath = path.join(__dirname, filePath, fileName);
      await fs.writeFile(fullPath, csvContent, 'utf8');
      console.log(`Successfully saved to ${fullPath}`);
    } catch (error) {
      console.error(`An error occurred while saving the file: ${error.message}`);
    }
  }
}
module.exports = new CSV();