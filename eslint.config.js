import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest, // Adding jest here too just in case, or keep it separate
      }
    },
    rules: {
      // Ignoramos las variables que empiezan por barra baja, por si nos da por culo
      'no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      'no-undef': 'error'
    }
  }
];