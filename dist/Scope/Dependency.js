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
exports.DependencyExternal = exports.DependencyFolder = exports.DependencyFile = exports.Dependency = exports.dependencyFsInjector = exports.SYSTEM_FS = void 0;
const utils_1 = require("../utils");
const constants_1 = require("../constants");
const systemFs = __importStar(require("fs"));
exports.SYSTEM_FS = systemFs;
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
                if (constants_1.SUPPORTED_DIRECT_METHODS.includes(stringPropKey)) {
                    return (...args) => this.dataLayer.fs[stringPropKey].apply(this, [this.path, ...args]);
                }
                else if (constants_1.SUPPORTED_FILE_METHODS.includes(stringPropKey)) {
                    return (...args) => this.dataLayer.fs.promises[stringPropKey].apply(this, [this.path, ...args]);
                }
                return undefined;
            },
        });
    }
    needsLock() {
        return true;
    }
    initialize() {
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
    static readExternalAccess(filePath, alternativeFs = exports.SYSTEM_FS) {
        return new DependencyExternal(filePath, alternativeFs);
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
class DependencyExternal extends Dependency {
    constructor(path, alternativeFs = exports.SYSTEM_FS) {
        super(path);
        this.path = path;
        this.alternativeFs = alternativeFs;
    }
    needsLock() {
        return false;
    }
    initialize() {
        this.dataLayer.addExternal(this.path, this.alternativeFs);
    }
}
exports.DependencyExternal = DependencyExternal;
