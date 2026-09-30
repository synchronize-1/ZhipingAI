const express = require('express');
const router = express.Router();
const openapi = require('../docs/openapi');

/**
 * API 文档路由（无第三方依赖）
 *
 *   GET /api/docs             -> Swagger UI 可视化页面
 *   GET /api/docs/openapi.json -> 原始 OpenAPI 3.0 规范
 *
 * Swagger UI 资源通过 CDN 加载，仅浏览器渲染时需要网络；
 * 规范本身由本地 openapi.js 提供，离线也能获取 JSON。
 */

const SWAGGER_VERSION = '5.17.14';

const docsPage = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>智评AI · API 文档</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css" />
  <style>
    html, body { margin: 0; padding: 0; background: #fafafa; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; }
    .topbar { display: none; }
    #fallback { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; padding: 24px; color: #334155; }
    #fallback a { color: #2563eb; }
  </style>
</head>
<body>
  <div id="swagger-ui">
    <div id="fallback">
      <h2>正在加载 API 文档…</h2>
      <p>若页面长时间空白（无法访问 CDN），可直接查看原始规范：
        <a href="/api/docs/openapi.json">/api/docs/openapi.json</a>
      </p>
    </div>
  </div>
  <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js"></script>
  <script>
    (function () {
      var mount = document.getElementById('swagger-ui');
      if (!window.SwaggerUIBundle) return; // 保留 fallback 提示
      mount.innerHTML = '';
      window.SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        persistAuthorization: true,
        layout: 'BaseLayout'
      });
    })();
  </script>
</body>
</html>`;

// 可视化文档页面
router.get('/', (req, res) => {
  res.type('html').send(docsPage);
});

// 原始 OpenAPI 规范
router.get('/openapi.json', (req, res) => {
  res.json(openapi);
});

module.exports = router;