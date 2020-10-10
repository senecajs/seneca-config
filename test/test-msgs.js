/* Copyright © 2020 Richard Rodger, MIT License */
'use strict'

const MsgTest = require('seneca-msg-test')
const LN = MsgTest.LN

module.exports = {
  print: true,
  test: true,
  fix: 'sys:config',
  calls: [
    LN({
      pattern: 'set:resolve,kind:app',
      params: {      
        merge: ['app','org','user'],
        sourcemap: {
          app: {
            kind: 'param',
          },
          user: {
            kind: 'id',
            entity: 'sys/user',
            alias: {
              user_handle: 'handle'
            }
          },
          org: {
            kind: 'id',
            entity: 'sys/user',
            alias: {
              org_handle: 'handle'
            }
          }
        }
      },
      out: {}
    }),

    LN({
      pattern: 'set:config,kind:app',
      out: {}
    }),

    LN({
      pattern: 'get:config,kind:app',
      out: {}
    }),
  ],
}

