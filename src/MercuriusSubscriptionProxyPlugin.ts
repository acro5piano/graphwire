import { FastifyPluginAsync } from 'fastify'
import { GraphQLResolveInfo } from 'graphql'
import mercurius, { IResolvers } from 'mercurius'
import { introspectSchema, wrapSchema } from '@graphql-tools/wrap'
import { print, printSchema } from 'graphql'
import { retryDecorator } from 'ts-retry-promise'
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
    const _executor = async ({ document, variables }: any) => {
      const query = print(document)
      const fetchResult = await got
        .post(options.upstreamUrl, {
          json: { query, variables },
        })
        .json()
      return fetchResult as any
    }
    const executor = retryDecorator(_executor, { retries: 3 })

    const rawSchema = wrapSchema({
      schema: await introspectSchema(executor),
      executor,
    })

    const remoteSchemaWithSubscription = printSchema(rawSchema).replace(
      'type Query',
      'type Subscription',
    )

    const schema = `${remoteSchemaWithSubscription}\n\n${fakeSchema}`

    async function _pipeOperation(info: GraphQLResolveInfo) {
      const query = print(info.operation).replace('subscription', 'query')
      const { data } = await got
        .post(options.upstreamUrl, {
          json: {
            query,
          },
        })
        .json()
      return data
    }
    const pipeOperation = retryDecorator(_pipeOperation, { retries: 3 })

    const subscriptionFieldResolver: IResolvers[string] = {
      subscribe: async (...params) => {
        const [, , { pubsub }, info] = params
        const { key } = info.path
        const typeString = info.returnType.toString().replace('!', '')
        const data = await pipeOperation(info)
        const result = data[key]
        if (Array.isArray(result)) {
          throw new Error(
            'Converting Array into GraphQL subscription field is not supported yet.',
          )
        }
        const topicTypeId = result['id']
        const topic = `${typeString}:${topicTypeId}`
        process.nextTick(() => {
          pubsub.publish({
            topic,
            payload: {},
          })
        })
        return pubsub.subscribe(topic)
      },
      async resolve(...params) {
        const [, , , info] = params
        const { key } = info.path
        const data = await pipeOperation(info)
        return data[key]
      },
    }

    const remoteQueryType = rawSchema.getQueryType()
    if (!remoteQueryType) {
      throw new Error('Remote schema does not have Query type.')
    }

    const resolvers: IResolvers = {
      Query: {
        ok: () => 'ok',
      },
      Subscription: Object.keys(remoteQueryType.getFields()).reduce(
        (car, fieldName) => {
          return {
            ...car,
            [fieldName]: subscriptionFieldResolver,
          }
        },
        {},
      ),
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
