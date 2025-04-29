const { createProxyMiddleware } = require('http-proxy-middleware');

console.log("🛠️ setupProxy.js is loaded!");

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    })
  );
};
