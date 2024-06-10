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
exports.copyFs = exports.matchPathFilter = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
exports.matchPathFilter = (fsPath, matchers) => {
    const fsPathParts = fsPath.split('/');
    for (const matcher of matchers) {
        const matcherParts = matcher.split('/');
        const partsMax = Math.min(fsPathParts.length, matcherParts.length);
        let matched = true;
        for (let i = 0; i < partsMax; i++) {
            if (fsPathParts[i] !== partsMax[i]) {
                matched = false;
                break;
            }
        }
        if (matched) {
            return true;
        }
    }
    return false;
};
exports.copyFs = (sourcePath, destinationPath, sourceFs, destinationFs, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = options.exclude) === null || _a === void 0 ? void 0 : _a.length) && exports.matchPathFilter(sourcePath, options.exclude)) {
        return;
    }
    if (((_b = options.include) === null || _b === void 0 ? void 0 : _b.length) && !exports.matchPathFilter(sourcePath, options.include)) {
        return;
    }
    const sourceStat = yield sourceFs.promises.stat(sourcePath);
    if (sourceStat.isDirectory()) {
        const dirents = yield sourceFs.promises.readdir(sourcePath);
        for (const dirent of dirents) {
            yield exports.copyFs(path.resolve(sourcePath, dirent), path.resolve(destinationPath, dirent), sourceFs, destinationFs, options);
        }
    }
    else {
        if (options.skipExisting) {
            try {
                yield destinationFs.promises.access(destinationPath, fs_1.constants.F_OK);
                return;
            }
            catch (e) { }
        }
        const destinationDirname = path.dirname(destinationPath);
        let destinationStat;
        try {
            destinationStat = yield destinationFs.promises.stat(destinationDirname);
            if (destinationStat.isFile()) {
                yield destinationFs.promises.rm(destinationDirname, { recursive: true });
                yield destinationFs.promises.mkdir(destinationDirname, { recursive: true });
            }
        }
        catch (e) {
            yield destinationFs.promises.mkdir(destinationDirname, { recursive: true });
        }
        yield destinationFs.promises.writeFile(destinationPath, yield sourceFs.promises.readFile(sourcePath));
    }
});
