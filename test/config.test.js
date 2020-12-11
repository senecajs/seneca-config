/* Copyright (c) 2020 voxgig and other contributors, MIT License */
'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = (exports.lab = Lab.script())
const expect = Code.expect

const PluginValidator = require('seneca-plugin-validator')
const Seneca = require('seneca')
const SenecaMsgTest = require('seneca-msg-test')

const Plugin = require('../')

lab.test('validate', PluginValidator(Plugin, module))

lab.test('plugin-load', async () => {
  return await seneca_instance(null, null).ready()
})

lab.test('happy', async () => {})

lab.test('messages', async () => {
  var seneca = await seneca_instance()
  var msgtest = SenecaMsgTest(seneca, require('./test-msgs.js'))
  await msgtest()
})

lab.test('client-server', async () => {
  let s0 = await seneca_instance({ tag: 's0' }, { mode: 'server' }).test()

  s0.post(
    'sys:config,set:kind,kind:k0,merge:[src0],sourcemap:{src0:{kind:param}}'
  )
  s0.post('sys:config,set:config,kind:k0,source:{src0:x},config:{a:1}')
  s0.listen(54321)
  await s0.ready()

  let out = await s0.post('sys:config,get:config,kind:k0,sourcemap:{src0:x}')
  // console.dir(out,{depth:null})
  expect(out).contains({ ok: true, config: { a: 1 } })

  // console.log('s0',s0.list())

  let c0 = await seneca_instance({ tag: 'c0' }, { mode: 'client' }).test()
  c0.client(54321)
  await c0.ready()

  // console.log('c0',c0.list())

  out = await c0.post('sys:config,get:config,kind:k0,sourcemap:{src0:x}')
  // console.dir(out,{depth:null})
  expect(out).contains({ ok: true, config: { a: 1 } })

  await c0.close()
  await s0.close()
})

function seneca_instance(config, plugin_options) {
  return Seneca(config, { legacy: false })
    .test()
    .use('promisify')
    .use('entity')
    .use(Plugin, plugin_options)
}
