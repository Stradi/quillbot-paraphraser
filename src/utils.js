const clipboardy = require('clipboardy');

const getWordCount = (str) => {
  return str.split(' ').length;
};

module.exports = {
  getWordCount,
};
