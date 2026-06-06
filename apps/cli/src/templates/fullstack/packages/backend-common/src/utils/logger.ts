import path from 'path'
import { format as dateFormat, parseISO } from 'date-fns'
import { createLogger as winstonCreateLogger, format, transports } from 'winston'

const { splat, combine, errors, timestamp, printf, align, colorize } = format
const colorizer = colorize({
  all: true,
  colors: {
    info: 'cyan',
    log: 'magenta',
    error: 'red',
    warn: 'yellow',
    debug: 'green',
    verbose: 'blue',
    silly: 'white',
    default: 'purple',
    http: 'indigo',
    help: 'orange',
  },
}).colorize

const baseFormat = printf((info) => {
  const ts = formatTimestamp(info.timestamp as string)
  const lvl = info.level
  const msg = info.message
  const stack = info.stack ? `, error: ${info.stack}` : ''
  const payload = info.payload ? `, payload: ${JSON.stringify(info.payload, null, 2)}` : ''
  return `([${colorizer(info.level, ts)}]) [${lvl}] [${info.service}] ${msg}${stack}${payload}`
})

function formatTimestamp(ts: string) {
  const date = parseISO(ts)
  return dateFormat(date, 'yyyy-MM-dd HH:mm:ss.SSS a')
}

/**
 * Create a new logger instance tagged with `serviceName`
 */
export function createLogger(serviceName: string) {
  const isVercel = process.env.VERCEL === '1'
  const isRender = process.env.RENDER === 'true'
  const isEphemeralFs = isVercel || isRender
  const isDev = process.env.NODE_ENV !== 'production'
  const loggerTransports: transports.StreamTransportInstance[] = []

  // Serverless / PaaS filesystems: avoid file logs; use stdout (Render log stream).
  if (!isEphemeralFs) {
    loggerTransports.push(
      new transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
      }),
      new transports.File({
        filename: path.join('logs', 'server.log'),
      }),
    )
  }

  if (isDev || isEphemeralFs) {
    loggerTransports.push(new transports.Console())
  }

  const logger = winstonCreateLogger({
    defaultMeta: { service: serviceName },
    format: combine(
      timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS' }),
      errors({ stack: true }),
      align(),
      splat(),
      baseFormat,
    ),
    transports: loggerTransports,
  })

  return logger
}

// Example usage of the logger
//
// const payload = {
//   name: "John Doe",
//   age: 30,
//   email: "cA5Q8@example.com",
// };
//
// logger.info("Info message", { payload });
// logger.error("Error message", new Error("This is an error"));
// logger.warn("Warning message");
// logger.info("Testing the colorization");
// logger.info("Hello there. How are you?");
//
// logger.info("Logger initialized", { payload });

export const backendLogger = createLogger('server')
export const workerLogger = createLogger('worker')
