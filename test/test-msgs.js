/* Copyright © 2020 Richard Rodger, MIT License */
'use strict'

const MsgTest = require('seneca-msg-test')
const LN = MsgTest.LN

module.exports = {
  print: false,
  test: true,
  fix: 'sys:config',
  calls: [
    LN({
      pattern: 'sys:entity,role:entity,base:sys,name:user,cmd:save',
      params: {
        ent: {
          id$: 'u01',
          handle: 'u01h',
        },
      },
      out: {},
    }),

    LN({
      pattern: 'sys:entity,role:entity,base:sys,name:user,cmd:save',
      params: {
        ent: {
          id$: 'o01',
          handle: 'o01h',
        },
      },
      out: {},
    }),

    LN({
      pattern: 'set:kind,kind:app',
      params: {
        merge: ['app', 'org', 'user'],
        sourcemap: {
          app: {
            kind: 'param',
          },
          user: {
            kind: 'id',
            entity: 'sys/user',
            alias: {
              user_handle: 'handle',
            },
          },
          org: {
            kind: 'id',
            entity: 'sys/user',
            alias: {
              org_handle: 'handle',
            },
          },
        },
      },
      out: {
        ok: true,
        kindmap: {
          app: {
            kind: 'app',
            merge: ['app', 'org', 'user'],
            sourcemap: {
              app: { kind: 'param' },
              user: {
                kind: 'id',
                entity: 'sys/user',
                alias: { user_handle: 'handle' },
              },
              org: {
                kind: 'id',
                entity: 'sys/user',
                alias: { org_handle: 'handle' },
              },
            },
          },
        },
      },
    }),

    LN({
      pattern: 'get:kindmap',
      out: {
        ok: true,
        kindmap: {
          app: {
            kind: 'app',
            merge: ['app', 'org', 'user'],
            sourcemap: {
              app: { kind: 'param' },
              user: {
                kind: 'id',
                entity: 'sys/user',
                alias: { user_handle: 'handle' },
              },
              org: {
                kind: 'id',
                entity: 'sys/user',
                alias: { org_handle: 'handle' },
              },
            },
          },
        },
      },
    }),

    LN({
      pattern: 'set:config,kind:app',
      params: {
        source: {
          app: 'foo',
        },
        config: {
          a: 1,
        },
      },
      out: {
        ok: true,
        config: { kind: 'app', app: 'foo', config: { a: 1 } },
      },
    }),

    LN({
      pattern: 'set:config,kind:app',
      params: {
        source: {
          user: 'u01',
        },
        config: {
          u: 1,
        },
      },
      out: {
        ok: true,
        config: { kind: 'app', user: 'u01', config: { u: 1 } },
      },
    }),

    LN({
      pattern: 'set:config,kind:app',
      params: {
        source: {
          org: 'o01',
        },
        config: {
          o: 1,
        },
      },
      out: {
        ok: true,
        config: { kind: 'app', org: 'o01', config: { o: 1 } },
      },
    }),

    LN({
      pattern: 'set:config,kind:not-a-kind',
      out: {
        ok: false,
        kind: 'not-a-kind',
        why: 'unknown-kind',
      },
    }),

    LN({
      pattern: 'get:config,kind:not-a-kind',
      out: {
        ok: false,
        kind: 'not-a-kind',
        why: 'unknown-kind',
      },
    }),

    LN({
      pattern: 'get:config,kind:app',
      params: {
        configmap: {
          pre: {
            p: 1,
          },
          post: {
            t: 1,
          },
        },
        sourcemap: {
          app: 'foo',
          user: 'u01',
          org: 'o01',
        },
      },
      out: {
        ok: true,
        config: {
          t: 1,
          u: 1,
          o: 1,
          a: 1,
          p: 1,
        },
      },
    }),

    LN({
      pattern: 'set:config,kind:app',
      params: {
        source: {
          user_handle: 'u01h',
        },
        config: {
          u: 11,
        },
      },
      out: {
        ok: true,
        config: { kind: 'app', user: 'u01', config: { u: 11 } },
      },
    }),

    LN({
      pattern: 'get:config,kind:app',
      params: {
        configmap: {
          pre: {
            p: 1,
          },
          post: {
            t: 1,
          },
        },
        sourcemap: {
          app: 'foo',
          user_handle: 'u01h',
          org_handle: 'o01h',
        },
      },
      out: {
        ok: true,
        config: {
          t: 1,
          u: 11,
          o: 1,
          a: 1,
          p: 1,
        },
      },
    }),
  ],
}
