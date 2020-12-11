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
//       do this by extending seneca-cache!
//       and supporting queue transports
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
    if (options.mode) {
        if ('client' === options.mode) {
            seneca.translate('sys:config,set:kind', 'sys:remote-config');
            seneca.translate('sys:config,get:kindmap', 'sys:remote-config');
            seneca.translate('sys:config,set:config', 'sys:remote-config');
            seneca.translate('sys:config,get:config', 'sys:remote-config');
        }
        else if ('server' === options.mode) {
            seneca.translate('sys:remote-config', 'sys:config');
        }
    }
    // TODO: Joi validation
    function set_kind(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let kind = msg.kind;
            let merge = msg.merge;
            let sourcemap = msg.sourcemap;
            Object.keys(sourcemap).forEach((sn) => {
                sourcemap[sn].name = sn;
            });
            let cs = {
                kind,
                merge,
                sourcemap,
            };
            kindmap[cs.kind] = cs;
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
            let seneca = this;
            let kind = msg.kind;
            let sourcemap = msg.sourcemap || {};
            let configmap = msg.configmap || {};
            let cs = kindmap[kind];
            if (null == cs) {
                return { ok: false, why: 'unknown-kind', kind: kind };
            }
            let found = [];
            let merge = cs.merge;
            let config = this.util.deep({}, configmap.pre);
            for (let source_name of merge) {
                let source_value = yield intern.resolve_source_value(seneca, cs, sourcemap, source_name);
                let q = {
                    kind: kind,
                    [source_name]: source_value,
                };
                // TODO: aliases
                if (null != source_value) {
                    let entry = yield this.entity('sys/config').load$(q);
                    if (null != entry) {
                        config = this.util.deep(config, entry.config);
                    }
                    found.push({ q, c: entry && entry.config });
                }
            }
            config = this.util.deep(config, configmap.post);
            return { ok: true, config, found };
        });
    }
    function set_config(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            let seneca = this;
            let kind = msg.kind;
            let source = msg.source;
            let config = msg.config;
            let cs = kindmap[kind];
            if (null == cs) {
                return { ok: false, why: 'unknown-kind', kind: kind };
            }
            let { source_name, source_value } = yield intern.resolve_source(seneca, cs, source);
            if (null == source_name) {
                return {
                    ok: false,
                    why: 'unknown-source',
                    kind: kind,
                    source: source_name,
                };
            }
            let csrc = cs.sourcemap[source_name];
            if (null == csrc) {
                return {
                    ok: false,
                    why: 'unknown-source',
                    kind: kind,
                    source: source_name,
                };
            }
            if ('id' === csrc.kind) {
                // resolve alias, if any
            }
            // TODO: entity really needs an upsert op!
            let entry = yield this.entity('sys/config').load$({
                kind: kind,
                [source_name]: source_value,
            });
            if (null == entry) {
                entry = this.entity('sys/config').make$();
            }
            entry.kind = kind;
            entry[source_name] = source_value;
            // NOTE: don't rely on db merge
            entry.config = seneca.util.deep(entry.config || {}, config);
            entry = yield entry.save$();
            // TODO: update cache, update msgs to clear cache
            return { ok: true, config: entry };
        });
    }
    return {};
}
const intern = (module.exports.intern = {
    resolve_source_value: function (seneca, cs, sourcemap, source_name) {
        return __awaiter(this, void 0, void 0, function* () {
            let source_value = sourcemap[source_name];
            if (null == source_value) {
                let csrc = cs.sourcemap[source_name];
                if ('id' === csrc.kind) {
                    // console.log('ID')
                    let aliasmap = csrc.alias || {};
                    let alias = Object.keys(aliasmap).reduce((alias, an) => null == alias ? { n: aliasmap[an], v: sourcemap[an] } : alias, null);
                    // console.log('ALIAS', alias)
                    if (null != alias) {
                        let source_entity = yield seneca.entity(csrc.entity).load$({
                            [alias.n]: alias.v,
                        });
                        if (null !== source_entity) {
                            source_value = source_entity.id;
                        }
                    }
                }
            }
            return source_value;
        });
    },
    resolve_source: function (seneca, cs, source) {
        return __awaiter(this, void 0, void 0, function* () {
            let source_name = Object.keys(source)[0];
            let source_value = source[source_name];
            let csrc = cs.sourcemap[source_name];
            if (null == csrc) {
                csrc = Object.keys(cs.sourcemap).reduce((csrc, psn) => {
                    if (null != csrc) {
                        return csrc;
                    }
                    if ('id' === cs.sourcemap[psn].kind) {
                        if (null != cs.sourcemap[psn].alias) {
                            if (null != cs.sourcemap[psn].alias[source_name]) {
                                return cs.sourcemap[psn];
                            }
                        }
                    }
                }, null);
                if (null != csrc) {
                    if ('id' === csrc.kind) {
                        let source_entity = yield seneca.entity(csrc.entity).load$({
                            [csrc.alias[source_name]]: source_value,
                        });
                        if (null !== source_entity) {
                            source_name = csrc.name;
                            source_value = source_entity.id;
                        }
                    }
                }
            }
            return {
                source_name: null == csrc ? null : source_name,
                source_value,
            };
        });
    },
});
//# sourceMappingURL=config.js.map