"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vector = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vector = (name, config) => (0, pg_core_1.customType)({
    dataType() {
        return `vector(${config.dimensions})`;
    },
    toDriver(value) {
        return `[${value.join(',')}]`;
    },
    fromDriver(value) {
        if (typeof value === 'string') {
            return value
                .replace('[', '')
                .replace(']', '')
                .split(',')
                .map(Number);
        }
        return value;
    },
})(name);
exports.vector = vector;
//# sourceMappingURL=vector.js.map