"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allEqual = exports.parsePath = void 0;
function parsePath(path) {
    return path.split('/');
}
exports.parsePath = parsePath;
function allEqual(arr) {
    return arr.every(val => val === arr[0]);
}
exports.allEqual = allEqual;
//# sourceMappingURL=index.js.map