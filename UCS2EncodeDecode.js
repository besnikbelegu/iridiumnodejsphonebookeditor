const phonebookEntries = require('./phonebookEntries').PhoneBookDB;

const EncodeDecode = {
  decodeUCS2: (ucs2String) => {
    try {
      let characters = [];
      for (let i = 0; i < ucs2String.length; i += 4) {
        let code = parseInt(ucs2String.substr(i, 4), 16);
        characters.push(String.fromCharCode(code));
      }
      return characters.join('');
    } catch (error) {
      console.error(error);
    }
  },
  encodeUCS2: (inputString) => {
    try {
      let ucs2String = "";
      for (let i = 0; i < inputString.length; i++) {
        let hexCode = inputString.charCodeAt(i).toString(16);
        while (hexCode.length < 4) {
          hexCode = "0" + hexCode; // Pad with leading zeros to ensure 4 hex digits
        }
        ucs2String += hexCode;
      }
      return ucs2String.toUpperCase();
    } catch (error) {
      console.error(error);
    }

  },
  processAndDecode: (data, action = 'decode') => {
    const segments = data.split(',');
    const decodedSegments = segments.map(segment => {
      if (action === 'decode' && /^[0-9a-fA-F]+$/.test(segment)) {
        return EncodeDecode.decodeUCS2(segment);
      } else if (action === 'encode') {
        return EncodeDecode.encodeUCS2(segment);
      }
      return segment;
    });
    if (action === 'decode') {
      phonebookEntries.addToDB(`${decodedSegments}\n`);
    }
    return decodedSegments.join(',');
  }
}
module.exports = EncodeDecode;