import { Static, Type } from '@sinclair/typebox'
import AltairFastify from 'altair-fastify-plugin'
import Fastify from 'fastify'
import fastifyFormBody from 'fastify-formbody'
import mercurius from 'mercurius'
import mq from 'mqemitter'

// import {
//   MercuriusSubscriptionProxyPlugin,
//   MercuriusSubscriptionProxyPluginOptions,
// } from './MercuriusSubscriptionProxyPlugin'
import {
  MercuriusSubscriptionProxyPluginOptions,
  createSchema,
} from './createSchema'
import { logger } from './logger'

export async function createServer({
  upstreamUrl,
  disableAltair,
  port,
}: Omit<MercuriusSubscriptionProxyPluginOptions, 'emitter'>) {
  const emitter = mq({ concurrency: 5 })
  const app = Fastify({ logger, trustProxy: true })
  app.register(fastifyFormBody)
  const { schema, resolvers } = await createSchema({
    emitter,
    upstreamUrl,
    disableAltair,
    port,
  })
  app.register(mercurius, {
    schema,
    resolvers,
    subscription: {
      emitter,
    },
  })

  const invalidateSchema = Type.Object({
    topic: Type.String(),
  })
  app.post<{ Body: Static<typeof invalidateSchema> }>(
    '/v1/publish',
    { schema: { body: invalidateSchema } },
    (request, reply) => {
      const { topic } = request.body
      emitter.emit({ topic }, (err) => {
        if (err) {
          request.log.error('Failed to published topic: %s', topic)
          reply.status(500).send(err)
        }
        request.log.info('Published topic: %s', topic)
        reply.send({ status: 'ok' })
      })
    },
  )

  if (!disableAltair) {
    app.register(AltairFastify, {
      /**
       * All these are the defaults.
       */
      path: '/altair',
      baseURL: '/altair/',
      endpointURL: '/graphql',
      subscriptionsEndpoint: `ws://0.0.0.0:${port}/graphql`,
    })
  }
  return app
}
