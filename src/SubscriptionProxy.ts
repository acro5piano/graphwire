import Fastify from 'fastify'
import mq from 'mqemitter'

import { MercuriusSubscriptionProxyPlugin } from '././MercuriusSubscriptionProxyPlugin'

export const emitter = mq({ concurrency: 5 })

export const app = Fastify({ logger: true, trustProxy: true })

app.register(MercuriusSubscriptionProxyPlugin, {
  emitter,
  upstreamUrl: 'http://127.0.0.1:1988/graphql',
})

if (require.main === module) {
  app.listen(1989)
}
