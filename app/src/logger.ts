import { AsyncLocalStorage } from 'async_hooks'

import pino from 'pino'

export const executionContext = new AsyncLocalStorage<string>()

export const logger = pino({
  prettyPrint: true,
  level: 'debug',
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['headers["x-auth-token"]'],
  mixin() {
    return {
      executionId: executionContext.getStore(),
    }
  },
})
