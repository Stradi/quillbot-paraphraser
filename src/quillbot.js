const puppeteer = require('puppeteer-extra');

const stealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(stealthPlugin());

const clipboardy = require('clipboardy');

const logger = require('./logger');
const { getWordCount } = require('./utils');
const { WORD_LIMIT, PARAPHRASE_PER_SESSION } = require('./config');
const { splitText, readFile, writeFile } = require('./text');

const SELECTORS = {
  TEXT_INPUT: '[aria-describedby="inputText"]',
  TEXT_OUTPUT: '#articleTextArea',
  MODAL: 'div[role="presentation"].MuiModal-root',
};

class QuillBot {
  constructor() {
    this.sessionLimit = 0;
  }

  /**
   * Creates a new session and opens the QuillBot website.
   * This function also sets up the event listener for when the browser is disconnected.
   * This is useful when we need to clear the browser cache and restart the session.
   */
  async createNewSession() {
    this.sessionLimit = 0;
    logger.info('Creating new session');
    const launchOptions = {
      headless: process.env.NODE_ENV === 'development' ? false : true,
    };

    this.browser = await puppeteer.launch(launchOptions);
    logger.debug('Browser launched');

    this.browser.on('disconnected', this.createNewSession);
    logger.debug("Added event listener for 'disconnected' event");

    this.page = await this.browser.newPage();
    logger.debug('Created new page');

    (await this.browser.pages())[0].close();
    logger.debug('Closed default page');

    logger.debug('Opening QuillBot website');
    await this.page.goto('https://quillbot.com/', {
      waitUntil: 'networkidle0',
    });
    logger.info('QuillBot website opened');
  }

  /**
   * Removes 'disconnected' event listener and closes the browser.
   */
  async closeBrowser() {
    logger.info('Closing browser');

    this.browser.off('disconnected', this.createNewSession);
    await this.browser.close();
    this.browser = null;
    this.page = null;

    logger.info('Browser closed');
  }

  /**
   * Paraphrases the given text and returns it.
   * @param {string} text - The text to paraphrase.
   * @returns {string} Paraphrased text.
   */
  async paraphrase(text) {
    if (this.sessionLimit >= PARAPHRASE_PER_SESSION) {
      logger.info(
        'Session limit reached. Clearing browser cache and restarting session.'
      );
      await this.closeBrowser();
      await this.createNewSession();
    }

    this.sessionLimit++;

    logger.info('Paraphrasing text');
    const wordCount = getWordCount(text);
    if (wordCount > WORD_LIMIT) {
      return Promise.reject(
        new Error(
          `Text is too long (${wordCount} words). Maximum length is ${WORD_LIMIT} words.`
        )
      );
    }

    await this.closeModalIfOpen();
    await this.removeButtonsOnTextInput();
    await this.pasteText(text);

    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.up('Control');

    logger.debug('Waiting for paraphrase to finish');
    await this.page.waitForNetworkIdle({
      timeout: 60000,
    });

    const outputText = await this.page.$eval(SELECTORS.TEXT_OUTPUT, (el) => {
      return el.innerText;
    });
    logger.info('Paraphrase finished');
    return outputText;
  }

  /**
   * Paraphrases an string array
   * @param {string[]} sentences Sentences to paraphrase.
   * @returns {string[]} Paraphrased sentences.
   */
  async paraphraseMultiple(sentences) {
    logger.info(`Paraphrasing ${sentences.length} sentences...`);

    const results = [];
    for (let sentence of sentences) {
      const result = await this.paraphrase(sentence);
      results.push(result);
    }

    return results;
  }

  /**
   * Reads the given file and returns the paraphrased sentences.
   * @param {string} filename Filename of the file to read.
   * @param {boolean} writeToFile Whether to write the paraphrased text to a file.
   * @returns {string[]} Paraphrased sentences.
   */
  async paraphraseFile(filename, writeToFile = false) {
    const sentences = splitText(await readFile(filename));
    const results = await this.paraphraseMultiple(sentences);

    if (writeToFile) {
      await writeFile(filename, results);
    }

    return results;
  }

  async removeButtonsOnTextInput() {
    logger.debug('Removing buttons on text input');
    await this.page.evaluate((selector) => {
      const parent = document.querySelector(selector).parentElement;
      if (parent.children.length > 1) {
        // We are removing children because once the text input has text in it
        // QuillBot will move the parent dom element to somewhere else and
        // removing parent element will throw an error in QuillBot website.
        const buttonsDOM = parent.children[1];
        buttonsDOM.children[0].remove();
      }
    }, SELECTORS.TEXT_INPUT);
  }

  async pasteText(text) {
    logger.debug('Clearing text input');
    const textInput = await this.page.$(SELECTORS.TEXT_INPUT);

    await textInput.click();
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyA');
    await this.page.keyboard.press('Delete');
    await this.page.keyboard.up('Control');

    logger.debug('Pasting text');
    await clipboardy.write(text);
    await this.page.keyboard.down('Control');
    await this.page.keyboard.press('KeyV');
    await this.page.keyboard.up('Control');
  }

  async closeModalIfOpen() {
    const modal = await this.page.$(SELECTORS.MODAL);
    if (modal) {
      logger.debug('Modal found, closing it.');
      await this.page.evaluate((selector) => {
        document.querySelector(selector).remove();
      }, SELECTORS.MODAL);
    }
  }
}

module.exports = QuillBot;
