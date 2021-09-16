import { introspectSchema, wrapSchema } from '@graphql-tools/wrap'
import { Static, Type } from '@sinclair/typebox'
import AltairFastify from 'altair-fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import got from 'got'
import { GraphQLResolveInfo } from 'graphql'
import { print, printSchema } from 'graphql'
import mercurius, { IResolvers } from 'mercurius'
import { MQEmitter } from 'mqemitter'
import { retryDecorator } from 'ts-retry-promise'

import { gql } from './util'

const fakeSchema = gql`
  type Query {
    ok: String
  }
`

export interface MercuriusSubscriptionProxyPluginOptions {
  emitter: MQEmitter
  upstreamUrl: string
  disableAltair: boolean
  port: number
}

export const MercuriusSubscriptionProxyPlugin: FastifyPluginAsync<MercuriusSubscriptionProxyPluginOptions> =
  async (app, options) => {
    const _executor = async ({ document, variables }: any) => {
      const query = print(document)
      app.log.info('Fetching the original schema...')
      const fetchResult = await got
        .post(options.upstreamUrl, {
          json: { query, variables },
        })
        .json()
      app.log.info('Done fetching the original schema.')
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
    const pipeOperation = retryDecorator(_pipeOperation, {
      retries: 3,
      logger: (msg) =>
        app.log.error('Fetching result from remote schema error: %s', msg),
    })

    const subscriptionFieldResolver: IResolvers[string] = {
      subscribe: async (...params) => {
        const [, , { app, pubsub }, info] = params
        app.log.info('New subscription: %s', info.operation.name?.value || '')
        const typeString = info.returnType.toString().replace(/[\!\[\]]/g, '')
        const data = await pipeOperation(info)
        const topic = extractTopic(typeString, data[info.path.key])
        process.nextTick(() => {
          if (Array.isArray(topic)) {
            if (topic[0]) {
              pubsub.publish({ topic: topic[0], payload: {} })
            }
          } else {
            pubsub.publish({ topic, payload: {} })
          }
        })
        app.log.info(`Topic created: %s`, topic)
        return pubsub.subscribe(topic)
      },
      async resolve(...params) {
        const [, , , info] = params
        const data = await pipeOperation(info)
        return data[info.path.key]
      },
    }

    const remoteQueryType = rawSchema.getQueryType()
    if (!remoteQueryType) {
      throw new Error('Remote schema does not have Query type.')
    }

    const resolvers: IResolvers = {
      Query: {
        ok() {
          return 'ok'
        },
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
            request.log.error('Failed to published topic: %s', topic)
            reply.status(500).send(err)
          }
          request.log.info('Published topic: %s', topic)
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

    if (!options.disableAltair) {
      app.register(AltairFastify, {
        /**
         * All these are the defaults.
         */
        path: '/altair',
        baseURL: '/altair/',
        endpointURL: '/graphql',
        subscriptionsEndpoint: `ws://0.0.0.0:${options.port}/graphql`,
      })
    }
  }

function extractTopic(
  typeString: string,
  obj:
    | Record<string, number | boolean | string>
    | Array<Record<string, number | boolean | string>>,
) {
  if (Array.isArray(obj)) {
    return obj.map((obj) => `${typeString}:${obj['id']}`)
  }
  const topicTypeId = obj['id']
  return `${typeString}:${topicTypeId}`
}
