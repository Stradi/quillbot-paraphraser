require('dotenv').config();
const QuillBot = require('./quillbot');
const { splitText, readFile, writeFile } = require('./text');

(async () => {
  const bot = new QuillBot();
  await bot.createNewSession();
  await bot.paraphraseFile('text.txt');
  await bot.closeBrowser();
})();
