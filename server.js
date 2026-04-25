const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

// Lokal oder Docker
const GEOSERVER_URL =
  process.env.GEOSERVER_URL || "http://localhost:8080/geoserver";

console.log("GeoServer URL:", GEOSERVER_URL);

app.use(
  "/geoserver",
  createProxyMiddleware({
    target: GEOSERVER_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/geoserver": "",
    },
  }),
);

app.use(express.static("."));

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
