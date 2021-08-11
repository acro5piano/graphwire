import Fastify from 'fastify'
import mercurius from 'mercurius'

const gql = String.raw

const app = Fastify({
  logger: true,
})

const schema = gql`
  type Query {
    ok: String
  }
  type Mutation {
    publishUser: User!
  }
  type User {
    id: ID!
    name: String!
  }
  type Subscription {
    user: User!
  }
`

const user = {
  id: '1',
  name: 'Kay',
}

const resolvers = {
  Mutation: {
    async publishUser(_, __, { pubsub }) {
      // await pubsub.publish({ topic: `user:1`, payload: { user } })
      await pubsub.publish({ topic: `user:1` })
      return user
    },
  },
  Subscription: {
    user: {
      subscribe: (_, __, { pubsub }) => {
        process.nextTick(() => {
          pubsub.publish({ topic: `user:1` })
        })
        return pubsub.subscribe(`user:1`)
      },
      resolve() {
        return {
          id: '1',
          name: 'Kay',
        }
      },
    },
  },
}

app.register(mercurius, {
  schema,
  resolvers,
  subscription: true,
})

if (require.main === module) {
  app.listen(1989)
}
