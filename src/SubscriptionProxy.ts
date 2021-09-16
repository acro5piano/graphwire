import Fastify from 'fastify'
import fastifyFormBody from 'fastify-formbody'
import mq from 'mqemitter'

import { logger } from './logger'
import {
  MercuriusSubscriptionProxyPlugin,
  MercuriusSubscriptionProxyPluginOptions,
} from './MercuriusSubscriptionProxyPlugin'

export function createServer({
  upstreamUrl,
  disableAltair,
  port,
}: Omit<MercuriusSubscriptionProxyPluginOptions, 'emitter'>) {
  const emitter = mq({ concurrency: 5 })
  const app = Fastify({ logger, trustProxy: true })
  app.register(fastifyFormBody)
  app.register(MercuriusSubscriptionProxyPlugin, {
    emitter,
    upstreamUrl,
    disableAltair,
    port,
  })
  return app
}
