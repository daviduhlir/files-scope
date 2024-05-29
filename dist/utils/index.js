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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSubpath = exports.createSubpath = exports.makeAbsolutePath = exports.makeRelativePath = void 0;
const path = __importStar(require("path"));
function makeRelativePath(inputPath) {
    return inputPath.startsWith('/') ? `.${inputPath}` : inputPath;
}
exports.makeRelativePath = makeRelativePath;
function makeAbsolutePath(inputPath) {
    return inputPath.startsWith('./') ? `${inputPath.substring(1)}` : inputPath.startsWith('/') ? inputPath : `/${inputPath}`;
}
exports.makeAbsolutePath = makeAbsolutePath;
function createSubpath(parentPath, subpath) {
    return path.resolve(parentPath, makeRelativePath(subpath));
}
exports.createSubpath = createSubpath;
function isSubpath(testedPath, startsWith) {
    const testedPathParts = testedPath.split('/').filter(Boolean);
    const startsWithParts = startsWith.split('/').filter(Boolean);
    if (testedPathParts.length < startsWithParts.length) {
        return false;
    }
    for (let i = 0; i < startsWithParts.length; i++) {
        if (testedPathParts[i] !== startsWithParts[i]) {
            return false;
        }
    }
    return true;
}
exports.isSubpath = isSubpath;
//# sourceMappingURL=index.js.map