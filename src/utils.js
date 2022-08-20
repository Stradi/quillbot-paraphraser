/**
 * Return word count of a string
 * @param {string} str
 * @returns {number} Number of words in the string.
 */
const getWordCount = (str) => {
  return str.split(' ').length;
};

module.exports = {
  getWordCount,
};
