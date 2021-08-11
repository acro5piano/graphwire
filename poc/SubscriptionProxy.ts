import Fastify from 'fastify'
import redis from 'mqemitter-redis'

import { MercuriusSubscriptionProxyPlugin } from '././MercuriusSubscriptionProxyPlugin'

const emitter = redis({
  port: 16379,
  host: '127.0.0.1',
})

const app = Fastify({ logger: true, trustProxy: true })

app.register(MercuriusSubscriptionProxyPlugin, {
  emitter,
  upstreamUrl: 'http://127.0.0.1:1988/graphql',
})

if (require.main === module) {
  app.listen(1989)
}
