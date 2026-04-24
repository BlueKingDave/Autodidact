import { Controller, Get } from '@nestjs/common';
import { getPool } from '@autodidact/db';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    const checks: Record<string, 'ok' | 'error'> = {};

    try {
      await getPool().query('SELECT 1');
      checks['db'] = 'ok';
    } catch {
      checks['db'] = 'error';
    }

    const agentUrl = process.env['AGENT_SERVICE_URL'] ?? 'http://localhost:3001';
    try {
      const res = await fetch(`${agentUrl}/health`);
      checks['agent'] = res.ok ? 'ok' : 'error';
    } catch {
      checks['agent'] = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    return {
      status: allOk ? 'ok' : 'degraded',
      services: checks,
    };
  }
}
