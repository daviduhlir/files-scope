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
exports.DataLayer = void 0;
const memfs_1 = require("memfs");
const util_1 = require("util");
const path = __importStar(require("path"));
const constants_1 = require("constants");
const utils_1 = require("../utils");
class DataLayer {
    constructor(sourceFs, writeAllowedPaths) {
        this.sourceFs = sourceFs;
        this.writeAllowedPaths = writeAllowedPaths;
        this.volume = new memfs_1.Volume();
        this.unlinkedPaths = [];
        this.volumeFs = memfs_1.createFsFromVolume(this.volume);
    }
    reset() {
        this.volume = new memfs_1.Volume();
        this.volumeFs = memfs_1.createFsFromVolume(this.volume);
        this.unlinkedPaths = [];
    }
    get fs() {
        return new Proxy(this, {
            get: (target, propKey, receiver) => {
                if (propKey === 'promises') {
                    return this.promises;
                }
                else if (propKey === 'unsafeFullFs') {
                    return this.fs;
                }
                return (...args) => {
                    const cb = args.pop();
                    this.solveFsAction.apply(this, [propKey.toString(), args]).then((result, error) => cb(error, result));
                };
            },
        });
    }
    get promises() {
        return new Proxy(this, {
            get: (target, propKey, receiver) => {
                if (propKey === 'unsafeFullFs') {
                    return this.promises;
                }
                return (...args) => this.solveFsAction.apply(this, [propKey.toString(), args]);
            },
        });
    }
    dump() {
        const volumeJson = this.volume.toJSON();
        const nodes = this.extractAllPaths(volumeJson);
        const nodesPaths = Object.keys(nodes);
        const unlinkedPaths = this.unlinkedPaths.filter(unlinkedPath => !nodesPaths.find(nodePath => nodePath.startsWith(unlinkedPath)));
        return {
            unlinkedPaths,
            nodes,
        };
    }
    commit(ignoreErrors) {
        return __awaiter(this, void 0, void 0, function* () {
            const dumped = this.dump();
            for (const unlinkedPath of dumped.unlinkedPaths) {
                try {
                    const stat = (yield util_1.promisify(this.sourceFs.stat)(unlinkedPath));
                    if (stat.isDirectory()) {
                        yield util_1.promisify(this.sourceFs.rm)(unlinkedPath, { recursive: true });
                    }
                    else {
                        yield util_1.promisify(this.sourceFs.unlink)(unlinkedPath);
                    }
                }
                catch (e) {
                    if (!ignoreErrors) {
                        throw new Error(`Can not unlink ${unlinkedPath}`);
                    }
                }
            }
            for (const nodePath in dumped.nodes) {
                const node = dumped.nodes[nodePath];
                if (node === null) {
                    yield util_1.promisify(this.sourceFs.mkdir)(nodePath, { recursive: true });
                }
                else if (typeof node === 'string' || node instanceof Buffer) {
                    const destPath = path.dirname(nodePath);
                    let isDirectory = false;
                    try {
                        isDirectory = (yield util_1.promisify(this.sourceFs.stat)(destPath)).isDirectory();
                    }
                    catch (e) {
                        yield util_1.promisify(this.sourceFs.mkdir)(destPath, { recursive: true });
                        isDirectory = true;
                    }
                    if (isDirectory) {
                        yield util_1.promisify(this.sourceFs.writeFile)(nodePath, node);
                    }
                    else {
                        if (!ignoreErrors) {
                            throw new Error(`Can not write to ${nodePath}`);
                        }
                    }
                }
            }
            this.reset();
        });
    }
    solveFsAction(method, args) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (method) {
                case 'fileExists':
                    try {
                        yield this.volumeFs.promises.access(args[0], constants_1.F_OK);
                        return true;
                    }
                    catch (e) {
                        try {
                            if (this.checkIsUnlinked(args[0])) {
                                throw new Error(`No such file on path ${args[0]}`);
                            }
                            yield util_1.promisify(this.sourceFs.access).apply(args[0], constants_1.F_OK);
                            return true;
                        }
                        catch (e) { }
                    }
                    return false;
                case 'directoryExists':
                    try {
                        if ((yield this.volumeFs.promises.stat(args[0])).isDirectory()) {
                            return true;
                        }
                    }
                    catch (e) {
                        try {
                            if (this.checkIsUnlinked(args[0])) {
                                throw new Error(`No such directory on path ${args[0]}`);
                            }
                            if ((yield util_1.promisify(this.sourceFs.stat).apply(args[0])).isDirectory()) {
                                return true;
                            }
                        }
                        catch (e) { }
                    }
                    return false;
                case 'readFile':
                case 'lstat':
                case 'stat':
                case 'access':
                    try {
                        return yield this.volumeFs.promises[method].apply(this, args);
                    }
                    catch (e) {
                        if (this.checkIsUnlinked(args[0])) {
                            throw new Error(`No such file on path ${args[0]}`);
                        }
                        return util_1.promisify(this.sourceFs[method]).apply(this, args);
                    }
                case 'readdir': {
                    let memResult = [];
                    try {
                        memResult = yield this.volumeFs.promises.readdir.apply(this, args);
                    }
                    catch (e) { }
                    let fsResult = [];
                    try {
                        const wasUnlinkedInFs = this.checkIsUnlinked(args[0]);
                        fsResult = wasUnlinkedInFs ? [] : yield util_1.promisify(this.sourceFs.readdir).apply(this, args);
                    }
                    catch (e) { }
                    const result = new Map();
                    for (const dirent of fsResult) {
                        const direntPath = this.pathFromReaddirEntry(dirent);
                        if (!this.checkIsUnlinked(path.resolve(args[0], direntPath))) {
                            result.set(direntPath, dirent);
                        }
                    }
                    for (const dirent of memResult) {
                        result.set(this.pathFromReaddirEntry(dirent), dirent);
                    }
                    return this.sortedArrayFromReaddirResult(result);
                }
                case 'writeFile':
                    this.checkWriteAllowed(args[0]);
                    yield this.volumeFs.promises.mkdir(path.dirname(args[0]), { recursive: true });
                    return this.volumeFs.promises.writeFile.apply(this, args);
                case 'appendFile':
                    this.checkWriteAllowed(args[0]);
                    yield this.prepareInFs(args[0]);
                    return this.volumeFs.promises.appendFile.apply(this, args);
                case 'rename':
                    this.checkWriteAllowed(args[0]);
                    this.checkWriteAllowed(args[1]);
                    yield this.prepareInFs(args[0]);
                    this.unlinkedPaths.push(args[0]);
                    return this.volumeFs.promises.rename.apply(this, args);
                case 'copyFile':
                    yield this.prepareInFs(args[0]);
                    return this.volumeFs.promises.copyFile.apply(this, args);
                case 'unlink':
                case 'rm':
                case 'rmdir':
                    this.checkWriteAllowed(args[0]);
                    this.unlinkedPaths.push(args[0]);
                    try {
                        if (method === 'unlink') {
                            return yield this.volumeFs.promises.unlink.apply(this, args);
                        }
                        return this.volumeFs.promises[method].apply(this, args);
                    }
                    catch (e) { }
                    break;
                case 'mkdir':
                    this.checkWriteAllowed(args[0]);
                    return this.volumeFs.promises[method].apply(this, args);
                default:
                    throw new Error(`Method ${method} is not implemented.`);
            }
        });
    }
    checkWriteAllowed(fsPath) {
        if (this.writeAllowedPaths && !this.writeAllowedPaths.find(allowedPath => fsPath.startsWith(allowedPath))) {
            throw new Error(`Write to path ${fsPath} is not allowed in layer.`);
        }
    }
    pathFromReaddirEntry(readdirEntry) {
        if (readdirEntry instanceof Buffer || typeof readdirEntry === 'string') {
            return String(readdirEntry);
        }
        return readdirEntry.name;
    }
    sortedArrayFromReaddirResult(readdirResult) {
        const array = [];
        for (const key of Array.from(readdirResult.keys()).sort()) {
            const value = readdirResult.get(key);
            if (value !== undefined)
                array.push(value);
        }
        return array;
    }
    prepareInFs(fsPath, destinationPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!destinationPath) {
                destinationPath = fsPath;
            }
            try {
                ;
                (yield this.volumeFs.promises.stat(destinationPath)).isFile();
            }
            catch (e) {
                if (this.checkIsUnlinked(fsPath)) {
                    return;
                }
                try {
                    const content = (yield util_1.promisify(this.sourceFs.readFile)(fsPath));
                    yield this.volumeFs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
                    yield this.volumeFs.promises.writeFile(destinationPath, content);
                }
                catch (e) {
                    yield this.volumeFs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
                }
            }
        });
    }
    extractAllPaths(obj, prefix = '', accumulator = {}) {
        Object.keys(obj).forEach(name => {
            const fullPath = path.resolve(prefix, name).toString();
            if (typeof obj[name] === 'string' || obj[name] instanceof Buffer) {
                accumulator[fullPath] = obj[name];
            }
            else if (obj[name] && typeof obj[name] === 'object') {
                this.extractAllPaths(obj[name], fullPath, accumulator);
            }
            else {
                accumulator[fullPath] = null;
            }
        });
        return accumulator;
    }
    checkIsUnlinked(fsPath) {
        const fsPathRelative = utils_1.makeRelativePath(fsPath);
        return this.unlinkedPaths.find(unlinked => fsPathRelative.startsWith(utils_1.makeRelativePath(unlinked)));
    }
}
exports.DataLayer = DataLayer;
//# sourceMappingURL=DataLayer.js.map