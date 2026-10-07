import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Prettier writes void elements as <input />: accept both forms.
    'vue/html-self-closing': ['warn', { html: { void: 'any' } }],
  },
})
