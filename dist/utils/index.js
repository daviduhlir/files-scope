"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLowestCommonPath = exports.allEqual = exports.parsePath = void 0;
function parsePath(path) {
    return path.split('/');
}
exports.parsePath = parsePath;
function allEqual(arr) {
    return arr.every(val => val === arr[0]);
}
exports.allEqual = allEqual;
function findLowestCommonPath(paths) {
    const common = [];
    const pathsParsed = paths.map(path => parsePath(path));
    const maxItterations = pathsParsed.reduce((acc, i) => Math.min(acc, i.length), Infinity);
    for (let i = 0; i < maxItterations; i++) {
        if (allEqual(pathsParsed.map(path => path[i]))) {
            common.push(pathsParsed[0][i]);
        }
        else {
            break;
        }
    }
    return common;
}
exports.findLowestCommonPath = findLowestCommonPath;
//# sourceMappingURL=index.js.map