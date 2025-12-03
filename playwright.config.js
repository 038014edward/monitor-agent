// @ts-check
import { defineConfig } from '@playwright/test';

/**
 * Read environment variables from file if needed.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  /* Directory with the test files */
  testDir: './tests',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
});

