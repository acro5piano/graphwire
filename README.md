![test](https://github.com/acro5piano/graphwire/workflows/test/badge.svg)
![release](https://github.com/acro5piano/graphwire/workflows/release/badge.svg)
[![npm version](https://badge.fury.io/js/graphwire.svg)](https://badge.fury.io/js/graphwire)

<p align="center">
    <img width="200" height="200" src="https://raw.githubusercontent.com/acro5piano/graphwire/master/assets/logo.svg">
</p>

# Graphwire

A GraphQL proxy server which turns your query into real-time live query!

# Motivation

GraphQL Subscription is hard to build. It takes lots of work.

- WebSocket connection over a load balancer
- Performance optimization when publishing
- Testing
- Logic duplication among queries and subscriptions
- Initial publish for live query

To solve these problems, `Graphwire` provides a new way: **Proxy GraphQL Queries and make it real-time subscriptions!**

# How it works

![Untitled Diagram (2)](https://user-images.githubusercontent.com/10719495/129064036-c70b9afc-be57-4b21-b452-0c40bd7ece57.png)

Features:

- No need to write your subscription logic
- No need to prepare Redis instance (for small use-case)
- Use completely the same logic as your Queries

# Try it yourself

### Step 1. Run the proxy server

```
npx graphwire --upstream-url https://api.graphql.jobs
```

### Step 2. Subscribe

Open http://0.0.0.0:1989/altair and run the following query:

```graphql
subscription TestSubscription {
  city(input: { slug: "berlin" }) {
    id
    name
    slug
    __typename
  }
}
```

Then you will see the initial subscription data like this.

![image](https://user-images.githubusercontent.com/10719495/133448826-fb91f2a9-3eec-479f-b77f-86ce45b0c8a3.png)

### Step 3. Publish (invalidate)

While keeping the subscription up, open your terminal and run the following command:

```
curl -XPOST http://0.0.0.0:1989/v1/publish -d topic=City:cjuv51m3s00fc0735xosrvscp
```

And you'll see a new subscription is published!
