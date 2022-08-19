require('dotenv').config();
const QuillBot = require('./quillbot');

(async () => {
  const bot = new QuillBot();
  await bot.createNewSession();
  await bot.closeBrowser();
})();
