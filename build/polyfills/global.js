// Polyfill for global object in browser environments
if (typeof global === 'undefined') {
  window.global = window;
}

module.exports = global;