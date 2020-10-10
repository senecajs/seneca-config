/* Copyright (c) 2020 voxgig and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict'

/* $lab:coverage:on$ */


// TODO: caching, info msgs to clear cache

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
    .message('set:kind', set_kind)
    .message('get:kindmap', get_kindmap)
    .message('set:config', set_config)
    .message('get:config', get_config)


  // TODO: Joi validation
  async function set_kind(msg: any) {
    let kind: string = msg.kind
    let merge: string[] = msg.merge
    let sourcemap: { [name: string]: any } = msg.sourcemap

    let cs: ConfigSpec = {
      kind,
      merge,
      sourcemap
    }

    kindmap[cs.kind] = cs

    // TODO: clear cache, update msgs to clear cache

    return { ok: true, kindmap: this.util.deep(kindmap) }
  }


  async function get_kindmap() {
    return { ok: true, kindmap: this.util.deep(kindmap) }
  }


  async function get_config(msg: any) {
    let kind: string = msg.kind
    let sourcemap: { [name: string]: string } = msg.sourcemap
    let configmap: { [name: string]: any } = msg.configmap

    let cs = kindmap[kind]
    if (null == cs) {
      return { ok: false, why: 'unknown-kind', kind: kind }
    }

    let merge = cs.merge

    let config: any = this.util.deep({}, configmap.pre)

    for (let sourcename of merge) {

      // TODO: aliases, null checks
      let entry = await this.entity('sys/config').load$({
        kind: kind,
        [sourcename]: sourcemap[sourcename]
      })

      if (null != entry) {
        config = this.util.deep(config, entry.config)
      }
    }

    config = this.util.deep(config, configmap.post)

    return { ok: true, config }
  }


  async function set_config(msg: any) {
    let kind: string = msg.kind
    let source: { [name: string]: string } = msg.source
    // let config = msg.config

    let cs = kindmap[kind]
    if (null == cs) {
      return { ok: false, why: 'unknown-kind', kind: kind }
    }

    let sourcename = Object.keys(source)[0]
    let sourcevalue = source[sourcename]

    let csrc = cs.sourcemap[sourcename]

    if (null == csrc) {
      return { ok: false, why: 'unknown-source', kind: kind, source: sourcename }
    }

    if ('id' === csrc.kind) {
      // resolve alias, if any
    }

    // TODO: entity really needs an upsert op!

    let entry = await this.entity('sys/config').load$({
      kind: kind,
      [sourcename]: sourcevalue
    })

    if (null == entry) {
      entry = this.entity('sys/config').make$()
    }

    entry.kind = kind
    entry[sourcename] = sourcevalue
    entry.config = msg.config

    entry = await entry.save$()

    // TODO: update cache, update msgs to clear cache

    return { ok: true, config: entry }
  }

  return {}
}

// const intern = (module.exports.intern = {})
