import { introspectSchema, wrapSchema } from '@graphql-tools/wrap'
import got from 'got'
import { GraphQLResolveInfo } from 'graphql'
import { print, printSchema } from 'graphql'
import { IResolvers } from 'mercurius'
import { MQEmitter } from 'mqemitter'
import { retryDecorator } from 'ts-retry-promise'

import { logger } from './logger'
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

export async function createSchema(
  options: MercuriusSubscriptionProxyPluginOptions,
) {
  const _executor = async ({ document, variables }: any) => {
    const query = print(document)
    logger.info('Fetching the original schema...')
    const fetchResult = await got
      .post(options.upstreamUrl, {
        json: { query, variables },
      })
      .json()
    logger.info('Done fetching the original schema.')
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
      logger.error('Fetching result from remote schema error: %s', msg),
  })

  const subscriptionFieldResolver: IResolvers[string] = {
    subscribe: async (...params) => {
      const [, , { pubsub }, info] = params
      logger.info('New subscription: %s', info.operation.name?.value || '')
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
      logger.info(`Topic created: %s`, topic)
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

  return { schema, resolvers }
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
