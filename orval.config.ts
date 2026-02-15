import { defineConfig } from 'orval'

/**
 * Orval config for generating MSW mock handlers from the Raindrop.io OpenAPI spec.
 * Keep separate from `rtk-codegen.config.ts` (RTK Query hooks).
 *
 * @example
 *   pnpm codegen:msw   // generates test/mocks/generated/raindropApi.msw.ts
 */
export default defineConfig({
  raindropMocks: {
    input: {
      target: './raindrop-openapi-3.0.3.json',
    },
    output: {
      mode: 'single',
      target: './test/mocks/generated/raindropApi.msw.ts',
      client: 'axios',
      mock: {
        type: 'msw',
        delay: false,
        baseUrl: 'https://api.raindrop.io/rest/v1',
      },
      override: {
        mock: {
          arrayMin: 3,
          arrayMax: 10,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
})
