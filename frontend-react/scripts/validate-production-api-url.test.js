import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const validatorPath = path.resolve(process.cwd(), 'scripts/validate-production-api-url.mjs');
const expectedApiUrl = 'https://homebudgetai-fullstack-2.onrender.com/api';

function runValidator(value) {
  const env = { ...process.env };
  if (value === undefined) delete env.VITE_API_BASE_URL;
  else env.VITE_API_BASE_URL = value;

  return spawnSync(process.execPath, [validatorPath], { env, encoding: 'utf8' });
}

describe('production API URL validation', () => {
  it('fails with a useful message when VITE_API_BASE_URL is missing', () => {
    const result = runValidator(undefined);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Set VITE_API_BASE_URL');
  });

  it('accepts the verified Render API URL', () => {
    const result = runValidator(expectedApiUrl);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Production API URL is valid.');
  });

  it.each([
    'http://localhost:5033/api',
    'https://other-api.example/api',
    'https://homebudgetai-fullstack-2.onrender.com/api?debug=true',
  ])('rejects an unapproved production URL: %s', (value) => {
    const result = runValidator(value);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expectedApiUrl);
  });
});
