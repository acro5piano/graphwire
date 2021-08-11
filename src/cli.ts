import { createServer } from './SubscriptionProxy'
import { program } from 'commander'

program.version('0.0.4')

program
  .requiredOption(
    '-u, --upstream-url <url>',
    'remote schema to get query e.g.) https://api.github.com/graphql',
  )
  .option('-p, --port <port>', 'port to listen', '1989')

interface CliArgs {
  port: string
  upstreamUrl: string
}

export function run() {
  program.parse(process.argv)
  const args: CliArgs = program.opts()
  const app = createServer({
    upstreamUrl: args.upstreamUrl,
  })
  app.listen(Number(args.port), `0.0.0.0`)
}

if (require.main === module) {
  program.parse(process.argv)
  const args = program.opts()
  console.log(args)
}
