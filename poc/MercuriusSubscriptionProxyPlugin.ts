import { FastifyPluginAsync } from 'fastify'
import mercurius, { IResolvers } from 'mercurius'
import { introspectSchema, wrapSchema } from '@graphql-tools/wrap'
import { print, printSchema } from 'graphql'
import { Static, Type } from '@sinclair/typebox'
import got from 'got'
import { MQEmitter } from 'mqemitter'

import { gql } from './util'

const fakeSchema = gql`
  type Query {
    ok: String
  }
`

interface MercuriusSubscriptionProxyPluginOptions {
  emitter: MQEmitter
  upstreamUrl: string
}

export const MercuriusSubscriptionProxyPlugin: FastifyPluginAsync<MercuriusSubscriptionProxyPluginOptions> =
  async (app, options) => {
    const executor = async ({ document, variables }: any) => {
      const query = print(document)
      const fetchResult = await got
        .post(options.upstreamUrl, {
          json: { query, variables },
        })
        .json()
      return fetchResult as any
    }

    const rawSchema = wrapSchema({
      schema: await introspectSchema(executor),
      executor,
    })

    const remoteSchemaWithSubscription = printSchema(rawSchema).replace(
      'type Query',
      'type Subscription',
    )

    const schema = `${remoteSchemaWithSubscription}\n\n${fakeSchema}`

    const resolvers: IResolvers = {
      Query: {
        ok: () => 'ok',
      },
      Subscription: {
        user: {
          subscribe: async (...params) => {
            const [, , { pubsub }] = params
            process.nextTick(() => {
              pubsub.publish({ topic: `user:1`, payload: {} })
            })
            return pubsub.subscribe(`user:1`)
          },
          async resolve(...params) {
            const [, , , info] = params
            const query = print(info.operation).replace('subscription', 'query')
            const { data } = await got
              .post(options.upstreamUrl, {
                json: {
                  query,
                },
              })
              .json()
            return data.user
          },
        },
      },
    }

    const invalidateSchema = Type.Object({
      topic: Type.String(),
    })

    app.post<{ Body: Static<typeof invalidateSchema> }>(
      '/v1/publish',
      { schema: { body: invalidateSchema } },
      (request, reply) => {
        const { topic } = request.body
        options.emitter.emit({ topic }, (err) => {
          if (err) {
            reply.status(500).send(err)
          }
          reply.send({ status: 'ok' })
        })
      },
    )

    app.register(mercurius, {
      schema,
      resolvers,
      subscription: {
        emitter: options.emitter,
      },
    })
  }
