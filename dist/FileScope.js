"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScope = exports.Dependency = exports.DEFAULT_SCOPE_OPTIONS = void 0;
const mutex_1 = require("@david.uhlir/mutex");
const FsDataLayer_1 = require("./FsDataLayer");
exports.DEFAULT_SCOPE_OPTIONS = {
    mutexPrefix: '#fileScope:',
    commitIfFail: false
};
const dependencyFsInjector = Symbol();
class Dependency {
    constructor(filePath, writeAccess) {
        this.filePath = filePath;
        this.writeAccess = writeAccess;
        this._fs = null;
        this[_a] = (fs) => {
            this._fs = fs;
        };
    }
    get fs() {
        return new Proxy(this, {
            get: (target, propKey, receiver) => {
                return (...args) => {
                    console.log('Calling', propKey, this.filePath);
                    return this._fs.promises[propKey.toString()].apply(this, [this.filePath, args]);
                };
            }
        });
    }
}
exports.Dependency = Dependency;
_a = dependencyFsInjector;
class FileScope {
    constructor(workingDir, dependeciesMap, options) {
        this.workingDir = workingDir;
        this.dependeciesMap = dependeciesMap;
        this.options = exports.DEFAULT_SCOPE_OPTIONS;
        if (options) {
            this.options = Object.assign(Object.assign({}, this.options), options);
        }
        if (!this.options.mutexPrefix.length) {
            throw new Error('Mutex prefix key must be at least 1 character');
        }
    }
    static writeAccess(filePath) {
        return new Dependency(filePath, true);
    }
    static readAccess(filePath) {
        return new Dependency(filePath, false);
    }
    open(handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependecies = Object.keys(this.dependeciesMap)
                .reduce((acc, key) => [
                ...acc,
                this.dependeciesMap[key],
            ], []);
            const fsLayer = new FsDataLayer_1.FsDataLayer(this.workingDir, dependecies.filter(key => key.writeAccess).map(key => key.filePath));
            dependecies.forEach(dependency => dependency[dependencyFsInjector](fsLayer.fs));
            return FileScope.lockScope(dependecies.map(key => ({ key: key.filePath, singleAccess: key.writeAccess })), this.dependeciesMap, () => __awaiter(this, void 0, void 0, function* () {
                let result;
                try {
                    result = yield handler(fsLayer.fs, this.dependeciesMap);
                }
                catch (e) {
                    if (this.options.commitIfFail) {
                        yield fsLayer.commit();
                    }
                    throw e;
                }
                yield fsLayer.commit();
                return result;
            }), this.options.maxLockingTime);
        });
    }
    static lockScope(mutexes, dependeciesMap, handler, maxLockingTime) {
        const m = mutexes.pop();
        return mutex_1.SharedMutex.lockAccess(m.key, () => __awaiter(this, void 0, void 0, function* () {
            if (mutexes.length) {
                return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime);
            }
            return handler();
        }), m.singleAccess, maxLockingTime);
    }
}
exports.FileScope = FileScope;
//# sourceMappingURL=FileScope.js.map