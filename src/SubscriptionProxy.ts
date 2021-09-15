import Fastify from 'fastify'
import fastifyFormBody from 'fastify-formbody'
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
  app.register(fastifyFormBody)
  app.register(MercuriusSubscriptionProxyPlugin, {
    emitter,
    upstreamUrl,
    disableAltair,
    port,
  })
  return app
}
