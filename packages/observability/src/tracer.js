"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTracer = initTracer;
exports.shutdownTracer = shutdownTracer;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
let sdk = null;
function initTracer(serviceName) {
    const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
    if (!endpoint)
        return;
    sdk = new sdk_node_1.NodeSDK({
        resource: new resources_1.Resource({ [semantic_conventions_1.ATTR_SERVICE_NAME]: serviceName }),
        traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    });
    sdk.start();
    process.on('SIGTERM', async () => {
        await sdk?.shutdown();
    });
}
async function shutdownTracer() {
    await sdk?.shutdown();
}
//# sourceMappingURL=tracer.js.map