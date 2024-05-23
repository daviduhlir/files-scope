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
exports.FileScope = void 0;
const fs = __importStar(require("fs"));
const DataLayer_1 = require("./DataLayer/DataLayer");
const Scope_1 = require("./Scope/Scope");
const linkfs_1 = require("linkfs");
class FileScope extends Scope_1.Scope {
    constructor(workingDir, options) {
        super(options);
        this.workingDir = workingDir;
    }
    createDatalayer(dependecies) {
        return new DataLayer_1.DataLayer(linkfs_1.link(fs, ['/', this.workingDir]), dependecies.filter(key => key.writeAccess).map(key => key.path));
    }
    static prepare(workingDir, options) {
        return new FileScope(workingDir, options);
    }
}
exports.FileScope = FileScope;
//# sourceMappingURL=FileScope.js.map