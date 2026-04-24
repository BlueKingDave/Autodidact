"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const pino_1 = __importDefault(require("pino"));
function createLogger(service) {
    const isDev = process.env['NODE_ENV'] !== 'production';
    return (0, pino_1.default)({
        name: service,
        level: process.env['LOG_LEVEL'] ?? 'info',
        ...(isDev
            ? {
                transport: {
                    target: 'pino-pretty',
                    options: { colorize: true, translateTime: 'SYS:standard' },
                },
            }
            : {}),
    });
}
//# sourceMappingURL=logger.js.map