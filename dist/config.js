/* Copyright (c) 2020 voxgig and other contributors, MIT License */
/* $lab:coverage:off$ */
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* $lab:coverage:on$ */
// TODO: caching, info msgs to clear cache
const config_doc_1 = __importDefault(require("./config-doc"));
module.exports = config;
module.exports.defaults = {};
module.exports.errors = {};
module.exports.doc = config_doc_1.default;
function config(options) {
    const seneca = this;
    const kindmap = {};
    seneca
        .fix('sys:config')
        .message('set:kind', set_kind)
        .message('get:kindmap', get_kindmap)
        .message('set:config', set_config)
        .message('get:config', get_config);
    // TODO: Joi validation
    function set_kind(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let kind = msg.kind;
            let merge = msg.merge;
            let sourcemap = msg.sourcemap;
            let cs = {
                kind,
                merge,
                sourcemap
            };
            kindmap[cs.kind] = cs;
            // TODO: clear cache, update msgs to clear cache
            return { ok: true, kindmap: this.util.deep(kindmap) };
        });
    }
    function get_kindmap() {
        return __awaiter(this, void 0, void 0, function* () {
            return { ok: true, kindmap: this.util.deep(kindmap) };
        });
    }
    function get_config(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let kind = msg.kind;
            let sourcemap = msg.sourcemap;
            let configmap = msg.configmap;
            let cs = kindmap[kind];
            if (null == cs) {
                return { ok: false, why: 'unknown-kind', kind: kind };
            }
            let merge = cs.merge;
            let config = this.util.deep({}, configmap.pre);
            for (let sourcename of merge) {
                // TODO: aliases, null checks
                let entry = yield this.entity('sys/config').load$({
                    kind: kind,
                    [sourcename]: sourcemap[sourcename]
                });
                if (null != entry) {
                    config = this.util.deep(config, entry.config);
                }
            }
            config = this.util.deep(config, configmap.post);
            return { ok: true, config };
        });
    }
    function set_config(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let kind = msg.kind;
            let source = msg.source;
            let config = msg.config;
            let cs = kindmap[kind];
            if (null == cs) {
                return { ok: false, why: 'unknown-kind', kind: kind };
            }
            let sourcename = Object.keys(source)[0];
            let sourcevalue = source[sourcename];
            let csrc = cs.sourcemap[sourcename];
            if (null == csrc) {
                return { ok: false, why: 'unknown-source', kind: kind, source: sourcename };
            }
            if ('id' === csrc.kind) {
                // resolve alias, if any
            }
            // TODO: entity really needs an upsert op!
            let entry = yield this.entity('sys/config').load$({
                kind: kind,
                [sourcename]: sourcevalue
            });
            if (null == entry) {
                entry = this.entity('sys/config').make$();
            }
            entry.kind = kind;
            entry[sourcename] = sourcevalue;
            entry.config = msg.config;
            entry = yield entry.save$();
            // TODO: update cache, update msgs to clear cache
            return { ok: true, config: entry };
        });
    }
    return {};
}
const intern = (module.exports.intern = {});
//# sourceMappingURL=config.js.map