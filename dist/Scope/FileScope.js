"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScope = void 0;
const FsDataLayer_1 = require("../DataLayer/FsDataLayer");
const Scope_1 = require("./Scope");
class FileScope extends Scope_1.Scope {
    constructor(workingDir, dependeciesMap, options) {
        super(dependeciesMap);
        this.workingDir = workingDir;
        this.dependeciesMap = dependeciesMap;
        this.initializeDataLayer();
    }
    initializeDataLayer() {
        this.dataLayer = new FsDataLayer_1.FsDataLayer(this.workingDir, this.dependeciesList.filter(key => key.writeAccess).map(key => key.path));
    }
    static prepare(workingDir, dependeciesMap, options) {
        return new FileScope(workingDir, dependeciesMap, options);
    }
}
exports.FileScope = FileScope;
//# sourceMappingURL=FileScope.js.map