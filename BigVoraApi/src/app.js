const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(
  "/api/admin/dashboard",
  require("./modules/adminAccount/dashboard.routes")
);
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/admin/products", require("./modules/product/product.routes"));
app.use(
  "/api/admin/product-rules",
  require("./modules/productRule/product-rule.routes")
);
app.use("/api/admin/categories", require("./modules/category/category.routes"));
app.use("/api/admin/banners", require("./modules/banner/banner.routes"));
app.use("/api/admin/uploads", require("./modules/upload/upload.routes"));
app.use(
  "/api/admin/customers",
  require("./modules/adminAccount/customer.routes")
);
app.use("/api/catalog", require("./modules/catalog/catalog.routes"));
app.use("/api/orders", require("./modules/order/order.routes"));
app.use("/api/admin/orders", require("./modules/order/admin-order.routes"));
app.use("/api/profile", require("./modules/profile/profile.routes"));
app.use("/api/favourites", require("./modules/favourite/favourite.routes"));
app.get("/", (req, res) => {
  res.status(200).type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BigVora API</title>
  </head>
  <body>
    <main>
      <h1>BigVora API is running...</h1>
      <p>Welcome to the BigVora backend service.</p>
    </main>
  </body>
</html>`);
});
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    database: connected ? "connected" : "unavailable",
  });
});
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(
    "[server] Request failed:",
    error.name || "Error",
    error.code || error.codeName || ""
  );
  const status = Number.isInteger(error.status) ? error.status : 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Internal server error" : error.message,
  });
});
module.exports = app;
