import { DateTime } from 'luxon';
import * as winston from 'winston';
import { WinstonModule, utilities } from 'nest-winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Client as EelasticsearchClient } from '@elastic/elasticsearch';
import { ElasticsearchTransportOptions } from 'winston-elasticsearch';
import * as WinstonElasticsearch from 'winston-elasticsearch';

const isProduction = process.env['NODE_ENV'] === 'production';
console.log(isProduction);
const logDir = __dirname + '/../../logs';
const appendTimestamp = winston.format((info, opts) => {
  if (opts.tz) {
    // luxon을 사용하여 시간대를 지정한 현재 시간 포맷팅
    info.timestamp = DateTime.now().setZone(opts.tz).toISO();
  }
  return info;
});

//로그 저장 파일 옵션
const dailyOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir,
    filename: `winston-log-${level}-%DATE%.log`,
    maxFiles: '30d',
    zippedArchive: true,
    handleExceptions: true,
    maxSize: '20m',
    json: false,
  };
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      //현재 환경이 프로덕션 환경이라면 http레벨, 아니라면 silly(가장 낮은 레벨)
      level: isProduction ? 'http' : 'silly',
      format: isProduction
        ? winston.format.simple() //프로덕션 환경이라면 심플하게
        : winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike('MyApp', {
              colors: true,
              prettyPrint: true,
            }),
          ),
    }),
    // winston-daily-rotate-file 트랜스포트 생성에 사용
    new DailyRotateFile(dailyOptions('warn')),
    new DailyRotateFile(dailyOptions('info')),
    new DailyRotateFile(dailyOptions('error')),
  ],
  //포맷 지정
  format: winston.format.combine(
    appendTimestamp({ tz: 'Asia/Seoul' }),
    winston.format.json(),
    winston.format.printf((info) => {
      return `${info.timestamp} - ${info.level} [${process.pid}]: ${info.message}`;
    }),
  ),
});
