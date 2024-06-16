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
    open(dependeciesMap, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependeciesList = Object.keys(dependeciesMap).reduce((acc, key) => [...acc, dependeciesMap[key]], []);
            if (this.options.readonly && dependeciesList.some(d => d.writeAccess)) {
                throw new Error('This scope has only read access');
            }
            const stack = [...(this.stackStorage.getStore() || [])];
            const parent = (stack === null || stack === void 0 ? void 0 : stack.length) ? stack[stack.length - 1].layer : undefined;
            const allParentalMutexes = stack.map(item => item.mutexKeys).flat();
            const dataLayer = parent
                ? new DataLayer_1.DataLayer(parent.fs, dependeciesList.filter(key => key.writeAccess).map(key => key.path))
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
            const result = yield this.stackStorage.run([...stack, { layer: dataLayer, mutexKeys: [...mutexKeys] }], () => __awaiter(this, void 0, void 0, function* () {
                return Scope.lockScope(mutexKeys, dependeciesMap, () => __awaiter(this, void 0, void 0, function* () {
                    if (!parent && this.options.beforeRootScopeOpen) {
                        yield this.options.beforeRootScopeOpen();
                    }
                    if (this.options.beforeScopeOpen) {
                        yield this.options.beforeScopeOpen();
                    }
                    let result;
                    try {
                        if (this.options.handlerWrapper) {
                            result = yield this.options.handlerWrapper(() => handler(dataLayer.fs, dependeciesMap));
                        }
                        else {
                            result = yield handler(dataLayer.fs, dependeciesMap);
                        }
                    }
                    catch (e) {
                        if (this.options.commitIfFail) {
                            changedPaths = yield dataLayer.commit();
                        }
                        throw e;
                    }
                    changedPaths = yield dataLayer.commit();
                    return result;
                }), this.options.maxLockingTime);
            }));
            if (this.options.afterScopeDone) {
                yield this.options.afterScopeDone(changedPaths);
            }
            if (!parent && this.options.afterRootScopeDone) {
                yield this.options.afterRootScopeDone(changedPaths);
            }
            return result;
        });
    }
    static lockScope(mutexes, dependeciesMap, handler, maxLockingTime) {
        const m = mutexes.pop();
        if (!m) {
            return handler();
        }
        return mutex_1.SharedMutex.lockAccess(m.key, () => __awaiter(this, void 0, void 0, function* () {
            if (mutexes.length) {
                return this.lockScope(mutexes, dependeciesMap, handler, maxLockingTime);
            }
            return handler();
        }), m.singleAccess, maxLockingTime);
    }
}
exports.Scope = Scope;
