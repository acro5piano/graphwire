import { app } from './SubscriptionProxy'

export interface SubscriptionProxyCliConfig {
  port: number
}

export function run({ port = 1989 }: SubscriptionProxyCliConfig) {
  app.listen(port, `0.0.0.0`)
}
