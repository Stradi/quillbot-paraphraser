const puppeteer = require('puppeteer');

class QuillBot {
  /**
   * Creates a new session and opens the QuillBot website.
   * This function also sets up the event listener for when the browser is disconnected.
   * This is useful when we need to clear the browser cache and restart the session.
   */
  async createNewSession() {
    const launchOptions = {
      headless: process.env.NODE_ENV ? false : true,
    };

    this.browser = await puppeteer.launch(launchOptions);
    this.browser.on('disconnected', this.createNewSession);

    this.page = await this.browser.newPage();
    (await this.browser.pages())[0].close();

    await this.page.goto('https://quillbot.com/', {
      waitUntil: 'networkidle0',
    });
  }

  /**
   * Removes 'disconnected' event listener and closes the browser.
   */
  async closeBrowser() {
    this.browser.off('disconnected', this.createNewSession);
    await this.browser.close();
    this.browser = null;
    this.page = null;
  }
}

module.exports = QuillBot;
