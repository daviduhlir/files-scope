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
const FsDependency_1 = require("./FsDependency");
const strategies_1 = require("./strategies");
const utils_1 = require("./utils");
exports.DEFAULT_SCOPE_OPTIONS = {
    strategy: strategies_1.lowestPosible(),
};
class Scope {
    static writeAccess(filePath, basePath = './') {
        return FsDependency_1.FsDependency.access(filePath, true, basePath);
    }
    static readAccess(filePath, basePath = './') {
        return FsDependency_1.FsDependency.access(filePath, false, basePath);
    }
    static open(mutexPrefix, dependeciesMap, handler, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const usedOptions = Object.assign(Object.assign({}, exports.DEFAULT_SCOPE_OPTIONS), options);
            if (!mutexPrefix.length) {
                throw new Error('Mutex prefix key must be at least 1 character');
            }
            const dependecies = Object.keys(dependeciesMap).reduce((acc, key) => [...acc, dependeciesMap[key]], []);
            const allKeys = [];
            for (const dependency of dependecies) {
                allKeys.push({ key: utils_1.parsePath(yield dependency.getKey()), singleAccess: yield dependency.isSingleAccess() });
            }
            const mutexKeys = allKeys.length ? usedOptions.strategy(mutexPrefix, allKeys) : [{ key: [mutexPrefix], singleAccess: true }];
            return Scope.lockScope(mutexKeys, dependeciesMap, () => __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(dependecies.map(d => d.initialize()));
                let result;
                try {
                    result = yield handler(dependeciesMap);
                }
                catch (e) {
                    yield Promise.all(dependecies.map(d => d.finish()));
                    throw e;
                }
                yield Promise.all(dependecies.map(d => d.finish()));
                return result;
            }), usedOptions.maxLockingTime);
        });
    }
    static lockScope(mutexes, dependeciesMap, handler, maxLockingTime) {
        const m = mutexes.pop();
        return mutex_1.SharedMutex.lockAccess(m.key, () => __awaiter(this, void 0, void 0, function* () {
            if (mutexes.length) {
                return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime);
            }
            return handler(dependeciesMap);
        }), m.singleAccess, maxLockingTime);
    }
}
exports.Scope = Scope;
//# sourceMappingURL=Scope.js.map