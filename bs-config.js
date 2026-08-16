module.exports = {
  proxy: 'localhost:8000',
  files: [
    'index.php',
    'assets/**/*.css',
    'assets/**/*.js',
    'events/**'
  ],
  open: true,
  notify: false
}
