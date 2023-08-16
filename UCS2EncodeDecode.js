// make a new module for these functions

function decodeUCS2(ucs2String) {
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

}

function encodeUCS2(inputString) {
  try {
    let ucs2String = "";
    for (let i = 0; i < inputString.length; i++) {
      let hexCode = inputString.charCodeAt(i).toString(16);
      while (hexCode.length < 4) {
        hexCode = "0" + hexCode; // Pad with leading zeros to ensure 4 hex digits
      }
      ucs2String += hexCode;
    }
    return ucs2String;
  } catch (error) {
    console.error(error);
  }

}
module.exports = {
  decodeUCS2,
  encodeUCS2
};