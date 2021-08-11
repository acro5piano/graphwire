import Fastify from 'fastify'
import mq from 'mqemitter'

import { MercuriusSubscriptionProxyPlugin } from '././MercuriusSubscriptionProxyPlugin'

export const emitter = mq({ concurrency: 5 })

const app = Fastify({ logger: true, trustProxy: true })

interface SubscriptionProxyConfig {
  upstreamUrl: string
}

export function createServer({ upstreamUrl }: SubscriptionProxyConfig) {
  app.register(MercuriusSubscriptionProxyPlugin, {
    emitter,
    upstreamUrl,
  })
  return app
}

if (require.main === module) {
  createServer({ upstreamUrl: 'http://127.0.0.1:1988/graphql' }).listen(1989)
}
