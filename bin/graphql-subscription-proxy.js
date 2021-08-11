#!/usr/bin/env node

require('../dist/cli').run({
  port: process.env.PORT,
})
