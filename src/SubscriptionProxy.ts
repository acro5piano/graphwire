import Fastify from 'fastify'
import mq from 'mqemitter'

import {
  MercuriusSubscriptionProxyPlugin,
  MercuriusSubscriptionProxyPluginOptions,
} from '././MercuriusSubscriptionProxyPlugin'

export const emitter = mq({ concurrency: 5 })

const app = Fastify({ logger: true, trustProxy: true })

export function createServer({
  upstreamUrl,
  disableAltair,
  port,
}: Omit<MercuriusSubscriptionProxyPluginOptions, 'emitter'>) {
  app.register(MercuriusSubscriptionProxyPlugin, {
    emitter,
    upstreamUrl,
    disableAltair,
    port,
  })
  return app
}
