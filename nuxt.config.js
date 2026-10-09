// Active theme: a folder name under app/assets/themes (see app/assets/themes/README.md).
const theme = process.env.NUXT_PUBLIC_THEME || 'epicentric'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: { port: 21082 },

  modules: ['@nuxt/eslint', '@nuxtjs/i18n', '@nuxt/test-utils/module'],

  css: ['~/assets/css/base.css', '~/assets/css/component-tokens.css', '~/assets/themes/index.css'],

  // The component gallery is a development tool: never shipped.
  $production: { ignore: ['**/pages/dev/**'] },

  // The i18n runtime imports Nuxt virtual modules (#components) that Vite's dependency
  // scanner cannot resolve: keep it out of pre-bundling.
  vite: { optimizeDeps: { exclude: ['@nuxtjs/i18n'] } },

  app: {
    head: {
      htmlAttrs: { 'data-theme': theme },
      title: 'Epicentric',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: 'http://127.0.0.1:21001/api/',
      theme,
    },
  },

  routeRules: {
    '/': { redirect: '/login' },
    '/app': { redirect: '/app/keys' },
    '/app/**': { ssr: false }, // app utente: SPA
    '/login': { ssr: true }, // pubbliche: SSR
    '/signup': { ssr: true },
    '/progress': { ssr: true }, // pagina provvisoria: stato dei lavori
    '/forgot-password': { ssr: true },
    '/recover-password': { redirect: '/forgot-password' }, // percorso della legacy
    '/confirm-account/**': { redirect: '/confirm/**' }, // link nelle email del backend
    '/invite-signup': { redirect: '/signup' }, // inviti della legacy: la query resta
    '/reset-password/**': { ssr: true },
    '/confirm/**': { ssr: true },
  },

  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [
      { code: 'en', language: 'en', name: 'English', file: 'en.json' },
      { code: 'it', language: 'it', name: 'Italiano', file: 'it.json' },
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'ec-locale', fallbackLocale: 'en' },
  },
})
