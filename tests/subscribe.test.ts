import test from 'ava'
import { createMercuriusTestClient } from 'mercurius-integration-testing'

import { createServer, gql } from '../src'
import { server } from './test-server'

test.before(async () => {
  await server.listen(18888, '0.0.0.0')
})

test.after(async () => {
  // await app.close()
  await server.close()
})

test.serial.only('query', async (t) => {
  const app = createServer({
    upstreamUrl: 'http://0.0.0.0:18888/graphql',
    port: 19999,
    disableAltair: true,
  })
  await app.ready()
  await app.after(async () => {
    const client = createMercuriusTestClient(app)
    await client
      .query(
        gql`
          query {
            ok
          }
        `,
      )
      .then(console.log)
    t.pass()
  })
})

test.serial.cb('subscribe', (t) => {
  const app = createServer({
    upstreamUrl: 'http://0.0.0.0:18888/graphql',
    port: 19999,
    disableAltair: true,
  })

  app
    .then(() => {
      return app.listen(19999, '0.0.0.0')
    })
    .then(() => {
      const client = createMercuriusTestClient(app)
      console.log('a')
      client
        .subscribe({
          query: gql`
            subscription SubscribeUser {
              user {
                id
                name
              }
            }
          `,
          onData(data) {
            console.log(data)
            t.end()
          },
        })
        .then(console.log)
        .catch(console.log)
    })
})
