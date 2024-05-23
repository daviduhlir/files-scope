"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyFolder = exports.DependencyFile = exports.Dependency = exports.dependencyFsInjector = void 0;
const utils_1 = require("../utils");
exports.dependencyFsInjector = Symbol();
class Dependency {
    constructor(path, writeAccess) {
        this.path = path;
        this.writeAccess = writeAccess;
        this.dataLayer = null;
        this[_a] = (dataLayer) => {
            if (this.dataLayer) {
                throw new Error('Dependency can not be used multiple times in scope.');
            }
            this.dataLayer = dataLayer;
        };
    }
    getFsProxy() {
        return new Proxy(this, {
            get: (target, propKey, receiver) => {
                return (...args) => {
                    return this.dataLayer.fs.promises[propKey.toString()].apply(this, [this.path, ...args]);
                };
            },
        });
    }
    static writeFileAccess(filePath) {
        return new DependencyFile(filePath, true);
    }
    static readFileAccess(filePath) {
        return new DependencyFile(filePath, false);
    }
    static writeFolderAccess(filePath) {
        return new DependencyFolder(filePath, true);
    }
    static readFolderAccess(filePath) {
        return new DependencyFolder(filePath, false);
    }
}
exports.Dependency = Dependency;
_a = exports.dependencyFsInjector;
class DependencyFile extends Dependency {
    get fs() {
        return this.getFsProxy();
    }
}
exports.DependencyFile = DependencyFile;
class DependencyFolder extends Dependency {
    relativizePath(requestedPath) {
        throw new Error('Method not implemented.');
    }
    get fs() {
        return new Proxy(this, {
            get: (target, propKey, receiver) => {
                return (...args) => {
                    const requestedPath = args.shift();
                    const callPath = utils_1.createSubpath(this.path, requestedPath);
                    return this.dataLayer.fs.promises[propKey.toString()].apply(this, [callPath, ...args]);
                };
            },
        });
    }
}
exports.DependencyFolder = DependencyFolder;
//# sourceMappingURL=Dependency.js.map