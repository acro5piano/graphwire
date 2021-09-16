import Fastify from 'fastify'
import mercurius from 'mercurius'

const gql = String.raw

export const server = Fastify({
  logger: true,
})

const schema = gql`
  type User {
    id: ID!
    name: String!
  }
  type Query {
    user: User!
    users: [User!]!
  }
`

const resolvers = {
  Query: {
    user() {
      return {
        id: '1',
        name: 'Kay',
      }
    },
    users() {
      return [
        {
          id: '1',
          name: 'Kay',
        },
        {
          id: '2',
          name: 'Jane',
        },
      ]
    },
  },
}

server.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
})

if (require.main === module) {
  server.listen(1988)
}
