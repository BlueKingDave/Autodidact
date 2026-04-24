import { customType } from 'drizzle-orm/pg-core';

export const vector = (name: string, config: { dimensions: number }) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${config.dimensions})`;
    },
    toDriver(value: number[]): string {
      return `[${value.join(',')}]`;
    },
    fromDriver(value: unknown): number[] {
      if (typeof value === 'string') {
        return value
          .replace('[', '')
          .replace(']', '')
          .split(',')
          .map(Number);
      }
      return value as number[];
    },
  })(name);
