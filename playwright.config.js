import { existsSync } from 'node:fs'
import { defineConfig } from '@playwright/test'

// E2E_EMAIL / E2E_PASSWORD of a dedicated test account live in .env (never committed).
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8082',
    // The installed Chrome: no browser download needed.
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:8082/login',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
