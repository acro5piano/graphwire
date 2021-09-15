import boxen from 'boxen'
import chalk from 'chalk'
import { program } from 'commander'
import dedent from 'dedent'

import { createServer } from './SubscriptionProxy'

const VERSION = require('../package.json').version

program.version(VERSION)

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
  const baseUrl = `http://0.0.0.0:${port}`
  app.listen(portNum, `0.0.0.0`).then(() => {
    // prettier-ignore
    const welcomeMessage = dedent`
      ${chalk.green(`GraphQL Subscription Proxy`)} ${chalk.gray(`v${VERSION}`)}

      ${chalk.bold(`- Subscribe:`)} ${baseUrl}/altair
      ${chalk.bold(`- Publish:`)}   curl -XPOST ${baseUrl}/v1/publish -d topic=<type>:<id>
    `
    console.log(
      boxen(welcomeMessage, {
        padding: 1,
        margin: 1,
        borderColor: 'green',
      }),
    )
  })
}

if (require.main === module) {
  program.parse(process.argv)
  const args = program.opts()
  console.log(args)
}
