import winston from 'winston';

winston.configure({
  transports: [
    new winston.transports.Console({
      json: false,
      colorize: true,
    }),
  ],
});

winston.level = 'debug';

export default winston;
