const logger = require('./logger');
const puppeteer = require('puppeteer');

class QuillBot {
  /**
   * Creates a new session and opens the QuillBot website.
   * This function also sets up the event listener for when the browser is disconnected.
   * This is useful when we need to clear the browser cache and restart the session.
   */
  async createNewSession() {
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
}

module.exports = QuillBot;
