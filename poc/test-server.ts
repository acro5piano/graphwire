import Fastify from 'fastify'
import mercurius from 'mercurius'

const gql = String.raw

const app = Fastify({
  logger: true,
})

const schema = gql`
  type User {
    id: ID!
    name: String!
  }
  type Query {
    user: User!
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
  },
}

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
})

if (require.main === module) {
  app.listen(1988)
}
