"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllMutexKeyItems = exports.allEqual = exports.parsePath = void 0;
function parsePath(path) {
    return path.split('/');
}
exports.parsePath = parsePath;
function allEqual(arr) {
    return arr.every(val => val === arr[0]);
}
exports.allEqual = allEqual;
function getAllMutexKeyItems(mutexPrefix, keys) {
    const sorted = {};
    for (const key of keys) {
        const path = parsePath(key[0]);
        if (!sorted[path[0]]) {
            sorted[path[0]] = [];
        }
        sorted[path[0]].push({ key: path, singleAccess: key[1] });
    }
    const output = [];
    for (const startKey in sorted) {
        const keys = sorted[startKey];
        const commonPath = [];
        const maxIterations = keys.reduce((acc, i) => Math.min(acc, i.key.length), Infinity);
        for (let i = 0; i < maxIterations; i++) {
            if (allEqual(keys.map(path => path.key[i]))) {
                commonPath.push(keys[0].key[i]);
            }
            else {
                break;
            }
        }
        output.push({
            key: [mutexPrefix, ...commonPath],
            singleAccess: keys.some(k => k.singleAccess),
        });
    }
    return output;
}
exports.getAllMutexKeyItems = getAllMutexKeyItems;
//# sourceMappingURL=index.js.map