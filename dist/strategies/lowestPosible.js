"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowestPosible = void 0;
const utils_1 = require("../utils");
exports.lowestPosible = () => function (mutexPrefix, items) {
    const output = { key: [], singleAccess: false };
    const maxIterations = items.reduce((acc, i) => Math.min(acc, i.key.length), Infinity);
    for (let i = 0; i < maxIterations; i++) {
        if (utils_1.allEqual(items.map(item => item.key[i]))) {
            output.key.push(items[0].key[i]);
            if (!output.singleAccess && items.some(item => item.singleAccess)) {
                output.singleAccess = true;
            }
        }
        else {
            break;
        }
    }
    return [
        Object.assign(Object.assign({}, output), { key: [mutexPrefix, ...output.key] }),
    ];
};
//# sourceMappingURL=lowestPosible.js.map