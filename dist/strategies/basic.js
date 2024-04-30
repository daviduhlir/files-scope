"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keepSame = void 0;
exports.keepSame = () => function (mutexPrefix, items) {
    return items.map(item => ({
        key: [mutexPrefix, ...item.key],
        singleAccess: item.singleAccess,
    }));
};
//# sourceMappingURL=basic.js.map