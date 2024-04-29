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
exports.FsDependency = void 0;
const Dependency_1 = require("./Dependency");
const fs_1 = require("fs");
const path = __importStar(require("path"));
class FsDependency extends Dependency_1.Dependency {
    constructor(filePath, writeAccess, basePath = './') {
        super();
        this.filePath = filePath;
        this.writeAccess = writeAccess;
        this.basePath = basePath;
    }
    static access(filePath, writeAccess, basePath = './') {
        return new FsDependency(filePath, writeAccess, basePath);
    }
    getKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.filePath;
        });
    }
    isSingleAccess() {
        return __awaiter(this, void 0, void 0, function* () {
            return !!this.writeAccess;
        });
    }
    getFullPath() {
        return path.resolve(this.basePath, this.filePath);
    }
    read(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.promises.readFile(this.getFullPath(), options);
        });
    }
    write(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.promises.writeFile(this.getFullPath(), data, options);
        });
    }
    stat(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.promises.stat(this.getFullPath(), opts);
        });
    }
    lstat(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.promises.lstat(this.getFullPath(), opts);
        });
    }
    unlink() {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.promises.unlink(this.getFullPath());
        });
    }
    isDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.lstat()).isDirectory();
        });
    }
    isFile() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.lstat()).isFile();
        });
    }
    readdir(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return fs_1.promises.readdir(this.getFullPath(), options);
        });
    }
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.stat();
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
}
exports.FsDependency = FsDependency;
//# sourceMappingURL=FsDependency.js.map