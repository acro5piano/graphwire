import { program } from 'commander'

import { createServer } from './SubscriptionProxy'

program.version('0.0.5')

program
  .requiredOption(
    '-u, --upstream-url <url>',
    'remote schema to get query e.g.) https://api.github.com/graphql',
  )
  .option('-p, --port <port>', 'port to listen', '1989')
  .option('--disable-altair', 'Disable altair GraphQL IDE')

interface CliArgs {
  port: string
  upstreamUrl: string
  disableAltair?: boolean
}

export function run() {
  program.parse(process.argv)

  const { port, upstreamUrl, disableAltair = false } = program.opts() as CliArgs
  const portNum = Number(port)

  const app = createServer({
    upstreamUrl,
    disableAltair,
    port: portNum,
  })
  app.listen(portNum, `0.0.0.0`)
}

if (require.main === module) {
  program.parse(process.argv)
  const args = program.opts()
  console.log(args)
}
