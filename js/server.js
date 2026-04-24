const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Proxy to GeoServer
app.use(
  "/geoserver",
  createProxyMiddleware({
    target: "http://localhost:8080/geoserver",
    changeOrigin: true,
    pathRewrite: {
      "^/geoserver": "", // remove prefix before forwarding
    },
  }),
);

// Serve your frontend
app.use(express.static("."));

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
