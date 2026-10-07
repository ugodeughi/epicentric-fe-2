// Guards the "strippable skin" rule: outside app/assets/themes no colour, radius or font
// may be written by hand. Components consume tokens only.
export default {
  ignoreFiles: ['app/assets/themes/**', 'node_modules/**', '.nuxt/**', '.output/**'],
  overrides: [{ files: ['**/*.vue'], customSyntax: 'postcss-html' }],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'oklch'],
    'declaration-property-value-disallowed-list': {
      '/^border(-.*)?-radius$/': ['/\\d/'],
      'font-family': ['/^(?!var\\(|inherit$)/'],
      'box-shadow': ['/\\d+px/'],
    },
  },
}
