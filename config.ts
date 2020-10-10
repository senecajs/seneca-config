/* Copyright (c) 2020 voxgig and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict'

/* $lab:coverage:on$ */

import Doc from './config-doc'

module.exports = config
module.exports.defaults = {}
module.exports.errors = {}
module.exports.doc = Doc




interface ConfigSpec {
  kind: string
  merge: string[],
  sourcemap: { [name: string]: ConfigSource }
}

interface ConfigSource {
  name: string
  kind: 'id' | 'param'

  // Alias field allows for user friendly repl commands as you
  // can use other unique field values (say username) rather than id
  entity?: string
  alias?: {
    [alias: string]: string
  }
}


function config(options: any) {
  const seneca = this

  const kindmap: { [kind: string]: ConfigSpec } = {}

  seneca
    .fix('sys:config')
    .message('set:resolve', set_resolve)
    .message('set:config', set_config)
    .message('get:config', get_config)


  async function set_resolve() {
    return {}
  }

  async function get_config() {
    return {}
  }

  async function set_config() {
    return {}
  }

  return {}
}

const intern = (module.exports.intern = {})
