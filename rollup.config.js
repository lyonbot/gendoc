export default [
  {
    input: 'lib/index.js',
    external: ['typescript'],
    plugins: [],
    output: {
      file: 'dist/index.js',
      format: 'umd',
      name: 'gendoc',
    }
  },
]
