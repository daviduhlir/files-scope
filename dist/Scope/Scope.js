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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = exports.DEFAULT_SCOPE_OPTIONS = void 0;
const mutex_1 = require("@david.uhlir/mutex");
const Dependency_1 = require("./Dependency");
exports.DEFAULT_SCOPE_OPTIONS = {
    mutexPrefix: '#dataScope:',
    commitIfFail: false,
};
class Scope {
    constructor(dependeciesMap, options) {
        this.dependeciesMap = dependeciesMap;
        this.options = exports.DEFAULT_SCOPE_OPTIONS;
        this.opened = false;
        if (options) {
            this.options = Object.assign(Object.assign({}, this.options), options);
        }
        this.initialize();
    }
    initialize() {
        if (!this.options.mutexPrefix.length) {
            throw new Error('Mutex prefix key must be at least 1 character');
        }
        this.dependeciesList = Object.keys(this.dependeciesMap).reduce((acc, key) => [...acc, this.dependeciesMap[key]], []);
    }
    get fs() {
        if (!this.opened) {
            throw new Error('Can not access scope fs, scope is not opened');
        }
        return this.dataLayer.fs;
    }
    static prepare(workingDir, dependeciesMap, options) {
        return new Scope(dependeciesMap, options);
    }
    open(handler) {
        return __awaiter(this, void 0, void 0, function* () {
            this.opened = true;
            this.dependeciesList.forEach(dependency => dependency[Dependency_1.dependencyFsInjector](this));
            return Scope.lockScope(this.dependeciesList.map(key => ({ key: this.options.mutexPrefix + key.path, singleAccess: key.writeAccess })), this.dependeciesMap, () => __awaiter(this, void 0, void 0, function* () {
                let result;
                try {
                    result = yield handler(this.dataLayer.fs, this.dependeciesMap);
                }
                catch (e) {
                    if (this.options.commitIfFail) {
                        yield this.dataLayer.commit();
                        this.opened = false;
                    }
                    throw e;
                }
                yield this.dataLayer.commit();
                this.opened = false;
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
exports.Scope = Scope;
//# sourceMappingURL=Scope.js.map