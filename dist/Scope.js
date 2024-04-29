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
exports.Scope = void 0;
const mutex_1 = require("@david.uhlir/mutex");
const utils_1 = require("./utils");
class Scope {
    static open(dependeciesMap, handler, maxLockingTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const dependecies = Object.keys(dependeciesMap).reduce((acc, key) => [...acc, dependeciesMap[key]], []);
            const allKeys = yield Promise.all(dependecies.map(d => d.getKey()));
            const lowestKey = utils_1.findLowestCommonPath(allKeys);
            const singleAccess = (yield Promise.all(dependecies.map(d => d.isSingleAccess()))).some(single => !!single);
            return mutex_1.SharedMutex.lockAccess(lowestKey, () => __awaiter(this, void 0, void 0, function* () {
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
            }), singleAccess, maxLockingTime);
        });
    }
}
exports.Scope = Scope;
//# sourceMappingURL=Scope.js.map