import winston from 'winston';

const enumerateErrorFormat = winston.format(info => {
  if (info.message instanceof Error) {
    info.message = Object.assign({
      message: info.message.message,
      stack: info.message.stack,
    }, info.message);
  }

  if (info instanceof Error) {
    return Object.assign({
      message: info.message,
      stack: info.stack,
    }, info);
  }

  return info;
});
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    enumerateErrorFormat(),
  ),
  transports: [
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        enumerateErrorFormat(),
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});

export default logger;
