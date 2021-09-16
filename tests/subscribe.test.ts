import test from 'ava'
import { FastifyInstance } from 'fastify'
import { createMercuriusTestClient } from 'mercurius-integration-testing'

import { createServer, gql } from '../src'
import { server } from './test-server'

const UPSTREAM_PORT = 18888
const APP_PORT = 19999

test.before(async () => {
  await server.listen(UPSTREAM_PORT, '0.0.0.0')
})

test.after(async () => {
  await server.close()
})

const createClient = async () => {
  const app = await createServer({
    upstreamUrl: `http://0.0.0.0:${UPSTREAM_PORT}/graphql`,
    port: APP_PORT,
    disableAltair: true,
  })
  const client = createMercuriusTestClient(app)
  return { client, app }
}

test('query', async (t) => {
  const { client } = await createClient()
  const res = await client.query(
    gql`
      query {
        ok
      }
    `,
  )
  t.deepEqual(res, {
    data: {
      ok: 'ok',
    },
  })
})

const publish = (app: FastifyInstance, topic: string) =>
  app.inject({
    method: 'post',
    path: '/v1/publish',
    payload: {
      topic,
    },
  })

test.cb('subscribe', (t) => {
  let count = 0
  t.plan(2)
  createClient().then(({ client, app }) => {
    client.subscribe({
      query: gql`
        subscription SubscribeUser {
          user {
            id
            name
          }
        }
      `,
      onData(res) {
        count++
        t.deepEqual(res, {
          data: {
            user: {
              id: '1',
              name: 'Kay',
            },
          },
        })
        if (count === 1) {
          publish(app, 'User:1')
          publish(app, 'User:_no_topic')
        }
        if (count === 2) {
          setTimeout(t.end, 200)
        }
      },
    })
  })
})

test.cb('subscribe - array', (t) => {
  let count = 0
  t.plan(3)
  createClient().then(({ client, app }) => {
    client.subscribe({
      query: gql`
        subscription SubscribeUsers {
          users {
            id
            name
          }
        }
      `,
      onData(res) {
        count++
        t.deepEqual(res, {
          data: {
            users: [
              {
                id: '1',
                name: 'Kay',
              },
              {
                id: '2',
                name: 'Jane',
              },
            ],
          },
        })
        if (count === 1) {
          publish(app, 'User:1')
          publish(app, 'User:2')
          publish(app, 'User:_no_topic')
        }
        if (count === 3) {
          setTimeout(t.end, 200)
        }
      },
    })
  })
})
