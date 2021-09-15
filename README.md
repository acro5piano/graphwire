![test](https://github.com/acro5piano/graphql-subscription-proxy/workflows/test/badge.svg)
[![npm version](https://badge.fury.io/js/graphql-subscription-proxy.svg)](https://badge.fury.io/js/graphql-subscription-proxy)

# graphql-subscription-proxy

A GraphQL proxy server which turns your query into real-time live query!

# Motivation

GraphQL Subscription is hard to build. It takes lots of work.

- WebSocket connection over a load balancer
- Performance optimization when publishing
- Testing
- Logic duplication among queries and subscriptions
- Initial publish for live query

To solve these problems, `graphql-subscription-proxy` provides a new way: Proxy GraphQL Queries and make it real-time subscriptions!

# How it works

![Untitled Diagram (2)](https://user-images.githubusercontent.com/10719495/129064036-c70b9afc-be57-4b21-b452-0c40bd7ece57.png)

Features:

- No need to write your subscription logic
- No need to prepare Redis instance (for small use-case)
- Use completely the same logic as your Queries

# Try it yourself

### Step 1. Run the proxy server

```
npx graphql-subscription-proxy --port 8000 --upstream-url https://rickandmortyapi.com/graphql
```

> Thank you for https://rickandmortyapi.com for providing the quick testing environment!

### Step 2. Subscribe

Any clients which support `subscriptions-transports-ws` is okay, but I recommend to use [Altair](https://altair.sirmuel.design) to test it.

For testing, please run the following subscription:

```graphql
subscription {
  episode(id: 1) {
    id
    name
    __typename
  }
}
```

<table>
  <tr>
    <td>
      <img src=https://user-images.githubusercontent.com/10719495/129057678-4be94a73-33cc-4e74-9f34-c8a4b8a6f6e2.png height=250>
    </td>
    <td>
      <img src=https://user-images.githubusercontent.com/10719495/129057775-d9ca7082-68ec-4a28-943e-a52bbc2dd0c5.png height=250>
    </td>
  </tr>
</table>

Soon, you will get see the subscription result like this. Note that the schema is not configured to operate subscriptions, but it works thanks to our proxy!

<img src=https://user-images.githubusercontent.com/10719495/129057989-d1f3c9c4-a2bf-492e-bd19-64a6b8ec168a.png height=300>

### Step 3. Publish (invalidate)

Keep the subscription up and open your terminal, then run the following command:

```
curl -XPOST http://0.0.0.0:8000/v1/publish \
    -H 'content-type: application/json' \
    -d '{"topic": "Episode:1"}'
```

And you'll see a new subscription is published!

![image](https://user-images.githubusercontent.com/10719495/129058575-751a0767-2270-45d9-91be-e198e4d78d02.png)

# TODO

- [ ] More testing
- [ ] List return type support
- [ ] Create SaaS version to provider better experience and serverless merit
