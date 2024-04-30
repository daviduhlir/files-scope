"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Scope_1 = require("./Scope");
Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return Scope_1.Scope; } });
var Dependency_1 = require("./Dependency");
Object.defineProperty(exports, "Dependency", { enumerable: true, get: function () { return Dependency_1.Dependency; } });
var FsDependency_1 = require("./FsDependency");
Object.defineProperty(exports, "FsDependency", { enumerable: true, get: function () { return FsDependency_1.FsDependency; } });
__exportStar(require("./strategies"), exports);
__exportStar(require("./interfaces"), exports);
//# sourceMappingURL=index.js.map