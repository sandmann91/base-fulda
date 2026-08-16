module.exports = {
  proxy: 'localhost:8000',
  files: [
    'index.php',
    'assets/dist/**',
    'assets/favicon.svg',
    'events/**'
  ],
  open: true,
  notify: false
}
