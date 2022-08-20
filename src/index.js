require('dotenv').config();
const QuillBot = require('./quillbot');
const { splitText, readFile, writeFile } = require('./text');

(async () => {
  const sentences = splitText(await readFile('text.txt'));

  const bot = new QuillBot();
  await bot.createNewSession();

  const results = await bot.paraphraseMultiple(sentences);
  await writeFile('output.txt', results);

  await bot.closeBrowser();
})();
