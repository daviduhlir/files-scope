"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyFolder = exports.DependencyFile = exports.Dependency = exports.dependencyFsInjector = void 0;
const path = __importStar(require("path"));
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
    relativizePath(inputPath) {
        return inputPath.startsWith('/') ? `.${inputPath}` : inputPath;
    }
    get fs() {
        return new Proxy(this, {
            get: (target, propKey, receiver) => {
                return (...args) => {
                    const requestedPath = args.shift();
                    const callPath = path.resolve(this.path, this.relativizePath(requestedPath));
                    return this.dataLayer.fs.promises[propKey.toString()].apply(this, [callPath, ...args]);
                };
            },
        });
    }
}
exports.DependencyFolder = DependencyFolder;
//# sourceMappingURL=Dependency.js.map