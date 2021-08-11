#!/usr/bin/env node

require('../dist/src/cli').run({
  port: process.env.PORT,
})
