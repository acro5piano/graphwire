import Fastify from 'fastify'
import redis from 'mqemitter-redis'
import mercurius, { IResolvers } from 'mercurius'
import { print } from 'graphql'
import { Static, Type } from '@sinclair/typebox'
import got from 'got'

const gql = String.raw

const emitter = redis({
  port: 16379,
  host: '127.0.0.1',
})

const app = Fastify({ logger: true })

const schema = gql`
  type Query {
    ok: String
  }
  type User {
    id: ID!
    name: String!
  }
  type Subscription {
    user: User!
  }
`

const resolvers: IResolvers = {
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
          .post('http://127.0.0.1:1988/graphql', {
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
    emitter.emit({ topic }, (err) => {
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
    emitter,
  },
})

if (require.main === module) {
  app.listen(1989)
}
