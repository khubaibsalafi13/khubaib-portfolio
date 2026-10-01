// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = parseInt(process.env.PORT || "3000", 10);
app.disable("x-powered-by");
app.get(["/healthz", "/health", "/livez", "/readyz", "/_health"], (_req, res) => {
  res.status(200).send("OK");
});
app.use(express.static(path.join(__dirname, "dist"), { maxAge: "1h" }));
app.get("*", (_req, res) => {
  const indexPath = path.join(__dirname, "dist", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err && !res.headersSent) {
      res.status(200).send('<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Khubaib Salafi Portfolio</title></head><body><div id="root"></div></body></html>');
    }
  });
});
var server = app.listen(port, "0.0.0.0", () => {
  console.log(`Production server running on http://0.0.0.0:${port}`);
});
server.on("error", (err) => {
  console.error("Server listen error:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing server");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
