module.exports = {
    env: {
      es6: true,
      node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 6,
      sourceType: 'module',
    },
    plugins: [
      '@typescript-eslint',
    ],
    rules: {
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/semi": "warn",
        "curly": "warn",
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "semi": "off"
    },
  };
