"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scope = exports.DEFAULT_SCOPE_OPTIONS = void 0;
const mutex_1 = require("@david.uhlir/mutex");
const DataLayer_1 = require("../DataLayer/DataLayer");
const Dependency_1 = require("./Dependency");
const AsyncLocalStorage_1 = __importDefault(require("../helpers/AsyncLocalStorage"));
const helpers_1 = require("../helpers");
exports.DEFAULT_SCOPE_OPTIONS = {
    mutexPrefix: '#dataScope:',
    commitIfFail: false,
    beforeRootScopeOpen: undefined,
    afterRootScopeDone: undefined,
    readonly: false,
    ignoreCommitErrors: true,
    binaryMode: true
};
class Scope {
    constructor(workingDir, options) {
        this.workingDir = workingDir;
        this.stackStorage = new AsyncLocalStorage_1.default();
        this.options = exports.DEFAULT_SCOPE_OPTIONS;
        if (options) {
            this.options = Object.assign(Object.assign({}, this.options), options);
        }
        if (!this.options.mutexPrefix.length) {
            throw new Error('Mutex prefix key must be at least 1 character');
        }
    }
    static prepare(workingDir, options) {
        return new Scope(workingDir, options);
    }
    createDatalayer(dependecies) {
        return null;
    }
    async open(dependeciesMap, handler) {
        const dependeciesList = Object.keys(dependeciesMap).reduce((acc, key) => [...acc, dependeciesMap[key]], []);
        if (this.options.readonly && dependeciesList.some(d => d.writeAccess)) {
            throw new Error('This scope has only read access');
        }
        const stack = [...(this.stackStorage.getStore() || [])];
        const parent = (stack === null || stack === void 0 ? void 0 : stack.length) ? stack[stack.length - 1].layer : undefined;
        const allParentalMutexes = stack.map(item => item.mutexKeys).flat();
        const dataLayer = parent
            ? new DataLayer_1.DataLayer(parent.getFsProxy(true), dependeciesList.filter(key => key.writeAccess).map(key => key.path))
            : this.createDatalayer(dependeciesList);
        dependeciesList.forEach(dependency => dependency[Dependency_1.dependencyFsInjector](dataLayer));
        dependeciesList.forEach(dependency => dependency.initialize());
        const mutexKeys = dependeciesList
            .filter(key => key.needsLock())
            .map(key => ({
            key: helpers_1.concatMutexKey(this.options.mutexPrefix, this.workingDir, key.path),
            singleAccess: key.writeAccess,
        }))
            .filter(lock => !allParentalMutexes.find(item => helpers_1.isSubpath(lock.key, item.key)));
        let changedPaths = [];
        const result = await this.stackStorage.run([...stack, { layer: dataLayer, mutexKeys: [...mutexKeys] }], async () => Scope.lockScope(mutexKeys, dependeciesMap, async () => {
            if (!parent && this.options.beforeRootScopeOpen) {
                await this.options.beforeRootScopeOpen();
            }
            if (this.options.beforeScopeOpen) {
                await this.options.beforeScopeOpen();
            }
            let result;
            try {
                if (this.options.handlerWrapper) {
                    result = await this.options.handlerWrapper(() => handler(dataLayer.fs, dependeciesMap));
                }
                else {
                    result = await handler(dataLayer.fs, dependeciesMap);
                }
            }
            catch (e) {
                if (this.options.commitIfFail) {
                    changedPaths = await dataLayer.commit(this.options.ignoreCommitErrors, this.options.binaryMode);
                }
                throw e;
            }
            changedPaths = await dataLayer.commit(this.options.ignoreCommitErrors, this.options.binaryMode);
            return result;
        }, this.options.maxLockingTime));
        if (this.options.afterScopeDone) {
            await this.options.afterScopeDone(changedPaths);
        }
        if (!parent && this.options.afterRootScopeDone) {
            await this.options.afterRootScopeDone(changedPaths);
        }
        return result;
    }
    static lockScope(mutexes, dependeciesMap, handler, maxLockingTime) {
        const m = mutexes.pop();
        if (!m) {
            return handler();
        }
        return mutex_1.SharedMutex.lockAccess(m.key, async () => {
            if (mutexes.length) {
                return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime);
            }
            return handler();
        }, m.singleAccess, maxLockingTime);
    }
}
exports.Scope = Scope;
//# sourceMappingURL=Scope.js.map