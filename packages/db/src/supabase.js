"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
exports.supabaseAdmin = (0, supabase_js_1.createClient)(process.env['SUPABASE_URL'] ?? '', process.env['SUPABASE_SECRET_KEY'] ?? '', { auth: { autoRefreshToken: false, persistSession: false } });
//# sourceMappingURL=supabase.js.map