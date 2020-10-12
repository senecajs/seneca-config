/* Copyright (c) 2020 voxgig and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict'

/* $lab:coverage:on$ */

// TODO: caching, info msgs to clear cache
//       do this by extending seneca-cache!
//       and supporting queue transports

import Doc from './config-doc'

module.exports = config
module.exports.defaults = {}
module.exports.errors = {}
module.exports.doc = Doc

interface ConfigSpec {
  kind: string
  merge: string[]
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

    Object.keys(sourcemap).forEach((sn) => {
      sourcemap[sn].name = sn
    })

    let cs: ConfigSpec = {
      kind,
      merge,
      sourcemap,
    }

    kindmap[cs.kind] = cs

    return { ok: true, kindmap: this.util.deep(kindmap) }
  }

  async function get_kindmap() {
    return { ok: true, kindmap: this.util.deep(kindmap) }
  }

  async function get_config(msg: any) {
    let seneca = this
    let kind: string = msg.kind
    let sourcemap: { [name: string]: string } = msg.sourcemap || {}
    let configmap: { [name: string]: any } = msg.configmap || {}

    let cs = kindmap[kind]
    if (null == cs) {
      return { ok: false, why: 'unknown-kind', kind: kind }
    }

    let found: any[] = []

    let merge = cs.merge

    let config: any = this.util.deep({}, configmap.pre)

    for (let source_name of merge) {
      let source_value = await intern.resolve_source_value(
        seneca,
        cs,
        sourcemap,
        source_name
      )

      let q = {
        kind: kind,
        [source_name]: source_value,
      }

      // TODO: aliases

      if (null != source_value) {
        let entry = await this.entity('sys/config').load$(q)

        if (null != entry) {
          config = this.util.deep(config, entry.config)
        }

        found.push({ q, c: entry && entry.config })
      }
    }

    config = this.util.deep(config, configmap.post)

    return { ok: true, config, found }
  }

  async function set_config(msg: any) {
    let seneca = this
    let kind: string = msg.kind
    let source: { [name: string]: string } = msg.source
    let config = msg.config

    let cs = kindmap[kind]
    if (null == cs) {
      return { ok: false, why: 'unknown-kind', kind: kind }
    }

    let { source_name, source_value } = await intern.resolve_source(
      seneca,
      cs,
      source
    )

    if (null == source_name) {
      return {
        ok: false,
        why: 'unknown-source',
        kind: kind,
        source: source_name,
      }
    }

    let csrc = cs.sourcemap[source_name]

    if (null == csrc) {
      return {
        ok: false,
        why: 'unknown-source',
        kind: kind,
        source: source_name,
      }
    }

    if ('id' === csrc.kind) {
      // resolve alias, if any
    }

    // TODO: entity really needs an upsert op!

    let entry = await this.entity('sys/config').load$({
      kind: kind,
      [source_name]: source_value,
    })

    if (null == entry) {
      entry = this.entity('sys/config').make$()
    }

    entry.kind = kind
    entry[source_name] = source_value
    entry.config = config

    entry = await entry.save$()

    // TODO: update cache, update msgs to clear cache

    return { ok: true, config: entry }
  }

  return {}
}

const intern = (module.exports.intern = {
  resolve_source_value: async function (
    seneca: any,
    cs: ConfigSpec,
    sourcemap: any,
    source_name: string
  ) {
    let source_value = sourcemap[source_name]

    if (null == source_value) {
      let csrc = cs.sourcemap[source_name]
      if ('id' === csrc.kind) {
        // console.log('ID')

        let aliasmap = csrc.alias || {}
        let alias = Object.keys(aliasmap).reduce(
          (alias, an) =>
            null == alias ? { n: aliasmap[an], v: sourcemap[an] } : alias,
          null
        )

        // console.log('ALIAS', alias)

        if (null != alias) {
          let source_entity = await seneca.entity(csrc.entity).load$({
            [alias.n]: alias.v,
          })
          if (null !== source_entity) {
            source_value = source_entity.id
          }
        }
      }
    }

    return source_value
  },

  resolve_source: async function (
    seneca: any,
    cs: ConfigSpec,
    source: {
      [source_name: string]: any
    }
  ) {
    let source_name = Object.keys(source)[0]
    let source_value = source[source_name]

    let csrc: ConfigSource | void | null = cs.sourcemap[source_name]

    if (null == csrc) {
      csrc = Object.keys(cs.sourcemap).reduce((csrc, psn) => {
        if (null != csrc) {
          return csrc
        }
        if ('id' === cs.sourcemap[psn].kind) {
          if (null != cs.sourcemap[psn].alias) {
            if (null != (cs.sourcemap[psn].alias as any)[source_name]) {
              return cs.sourcemap[psn]
            }
          }
        }
      }, null)

      if (null != csrc) {
        if ('id' === csrc.kind) {
          let source_entity = await seneca.entity(csrc.entity).load$({
            [(csrc as any).alias[source_name]]: source_value,
          })
          if (null !== source_entity) {
            source_name = csrc.name
            source_value = source_entity.id
          }
        }
      }
    }

    return {
      source_name: null == csrc ? null : source_name,
      source_value,
    }
  },
})
