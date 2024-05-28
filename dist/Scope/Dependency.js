"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyFolder = exports.DependencyFile = exports.Dependency = exports.dependencyFsInjector = void 0;
const utils_1 = require("../utils");
const constants_1 = require("../constants");
exports.dependencyFsInjector = '__dependencyFsInjector__';
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
                const stringPropKey = propKey.toString();
                if (constants_1.SUPPORTED_FILE_METHODS.includes(stringPropKey)) {
                    return (...args) => this.dataLayer.fs.promises[stringPropKey].apply(this, [this.path, ...args]);
                }
                return undefined;
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
                const stringPropKey = propKey.toString();
                if (constants_1.SUPPORTED_METHODS.includes(stringPropKey)) {
                    return (...args) => {
                        const requestedPath = args.shift();
                        const callPath = utils_1.createSubpath(this.path, requestedPath);
                        return this.dataLayer.fs.promises[stringPropKey].apply(this, [callPath, ...args]);
                    };
                }
                return undefined;
            },
        });
    }
}
exports.DependencyFolder = DependencyFolder;
//# sourceMappingURL=Dependency.js.map