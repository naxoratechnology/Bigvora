const units = ["Piece", "Kg", "Gram", "Litre", "Pack", "Bag", "Box"];
function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}
function productInput(body, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    invalid("Provide product fields.");
  const fields = [
    "sku",
    "name",
    "categoryId",
    "category",
    "description",
    "price",
    "mrp",
    "costPrice",
    "stock",
    "reorderLevel",
    "unit",
    "images",
    "ruleIds",
  ];
  if (
    Object.keys(body).some(
      (key) => !fields.includes(key) && !(partial && key === "version")
    )
  )
    invalid("Unknown product field.");
  const value = {};
  for (const field of fields) {
    if (!(field in body)) {
      if (
        !partial &&
        field !== "images" &&
        field !== "ruleIds" &&
        field !== "categoryId" &&
        !(field === "category" && body.categoryId)
      )
        invalid(field + " is required.");
      continue;
    }
    if (field === "images") {
      if (!Array.isArray(body.images) || body.images.length > 8)
        invalid("Use up to eight product images.");
      value.images = body.images.map((url) =>
        require("../upload/image.validation").imageUrl(url)
      );
      continue;
    }
    if (field === "ruleIds") {
      if (
        !Array.isArray(body.ruleIds) ||
        body.ruleIds.length > 20 ||
        body.ruleIds.some(
          (id) => typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)
        )
      )
        invalid("Invalid product rules.");
      value.ruleIds = [...new Set(body.ruleIds)];
      continue;
    }
    if (field === "categoryId") {
      if (
        typeof body[field] !== "string" ||
        !/^[a-f\d]{24}$/i.test(body[field])
      )
        invalid("Invalid category ID.");
      value[field] = body[field];
      continue;
    }
    if (field === "sku") {
      const sku = String(body.sku || "")
        .trim()
        .toUpperCase();
      if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(sku)) {
        invalid(
          "SKU must be 3 to 40 characters using letters, numbers, hyphens or underscores."
        );
      }
      value.sku = sku;
    } else if (["name", "category", "description", "unit"].includes(field)) {
      const max = field === "description" ? 5000 : field === "name" ? 150 : 100;
      if (
        typeof body[field] !== "string" ||
        !body[field].trim() ||
        body[field].trim().length > max
      )
        invalid("Invalid " + field + ".");
      value[field] = body[field].trim();
    } else {
      const raw = body[field];
      if (
        !["number", "string"].includes(typeof raw) ||
        (typeof raw === "string" && !/^\d+(?:\.\d+)?$/.test(raw.trim()))
      )
        invalid("Invalid " + field + ".");
      const number = Number(raw);
      if (
        !Number.isFinite(number) ||
        number < (field === "price" ? 0.01 : 0) ||
        number > 1000000000
      )
        invalid("Invalid " + field + ".");
      if (
        ["price", "mrp", "costPrice"].includes(field) &&
        Math.abs(number * 100 - Math.round(number * 100)) > 0.00001
      )
        invalid(field + " supports at most two decimal places.");
      value[field] = number;
    }
  }
  if (value.unit && !units.includes(value.unit)) invalid("Invalid unit.");
  if (
    value.mrp !== undefined &&
    value.price !== undefined &&
    value.mrp < value.price
  )
    invalid("MRP cannot be lower than the selling price.");
  if (!Object.keys(value).length)
    invalid("Provide at least one product field.");
  return value;
}
function versionInput(value) {
  if (!Number.isSafeInteger(value) || value < 0)
    invalid("A valid product version is required.");
  return value;
}
module.exports = { productInput, versionInput, invalid };
