const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const logFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const combinedFormat = combine(
  label({ label: 'quillbot' }),
  timestamp(),
  logFormat
);

const logger = createLogger({
  format: format.json({
    space: 2,
  }),
  transports: [
    new transports.File({
      dirname: 'logs',
      filename: 'error.log',
      level: 'error',
      format: combinedFormat,
    }),
    new transports.File({
      dirname: 'logs',
      filename: `logs/quillbot.log`,
      level: 'debug',
      format: combinedFormat,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
        combinedFormat
      ),
      level: 'debug',
    })
  );
}

module.exports = logger;
