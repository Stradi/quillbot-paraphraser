const path = require('path');
const fs = require('fs-extra');

const winkNLP = require('wink-nlp');
const winkNLPModel = require('wink-eng-lite-model');

const NLP = winkNLP(winkNLPModel);

const { WORD_LIMIT } = require('./config');
const logger = require('./logger');

/**
 * Splits a string into an array of sentences.
 * @param {string} text
 * @returns {string[]} An array of sentences.
 */
const splitText = (text) => {
  logger.info('Splitting text into sentences...');

  const doc = NLP.readDoc(text);
  const allSentences = doc.sentences().out();

  const sentences = [];
  let tempSentence = '';
  for (let s of allSentences) {
    const totalWordCount = tempSentence.split(' ').length + s.split(' ').length;
    if (totalWordCount > WORD_LIMIT) {
      sentences.push(tempSentence.substring(0, tempSentence.length - 1));
      tempSentence = s;
    } else {
      tempSentence += s + ' ';
    }
  }

  sentences.push(tempSentence);

  logger.info(`Found ${sentences.length} sentences.`);
  return sentences;
};

/**
 * Reads a file and returns the contents as a string.
 * @param {string} filename
 * @returns {string} The contents of the file.
 */
const readFile = async (filename) => {
  logger.debug(`Reading file ${filename}...`);
  const inputPath = path.resolve(process.cwd(), 'inputs');
  await fs.ensureDir(inputPath);

  const filePath = path.resolve(inputPath, filename);

  const fileExists = await fs.pathExists(filePath);
  if (!fileExists) {
    return Promise.reject(
      new Error(`File ${filename} does not exist in inputs directory.`)
    );
  }

  const text = await fs.readFile(filePath, 'utf8');
  return text;
};

/**
 * Writes a file to the output directory.
 * @param {string} filename The name of the file.
 * @param {string[]} content The sentences to write to the file.
 */
const writeFile = async (filename, content) => {
  logger.info(`Writing file ${filename}...`);
  const outputPath = path.resolve(process.cwd(), 'outputs');
  await fs.ensureDir(outputPath);

  const filePath = path.resolve(outputPath, filename);
  await fs.ensureFile(filePath);

  await fs.writeFile(filePath, content.join('\n\n'));
  logger.info(`Wrote file ${filename} to outputs directory.`);
};

module.exports = {
  splitText,
  readFile,
  writeFile,
};
