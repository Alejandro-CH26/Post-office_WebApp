const http = require("http");
const url = require("url");
const notificationRoutes = require("./notificationRoutes");
const reportRoutes = require("./reportRoutes");

const hostname = "localhost";
const port = 5000;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const reqUrl = url.parse(req.url, true);

  // Try each route file in order, if it returns true we stop
  if (notificationRoutes(req, res, reqUrl)) return;
  if (reportRoutes(req, res, reqUrl)) return;

  // 404 Fallback
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(port, hostname, () => {
  console.log(`✅ Server running at http://${hostname}:${port}/`);
});
