const { invalid, versionInput } = require('../product/product.validation');
function categoryInput(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Provide category fields.');
  if (Object.keys(body).some(key => !['name', 'description', 'image'].includes(key) && !(partial && key === 'version'))) invalid('Unknown category field.');
  const fields = {};
  for (const key of ['name', 'description']) {
    if (!(key in body)) { if (!partial) invalid(key + ' is required.'); continue; }
    const max = key === 'name' ? 100 : 5000;
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].trim().length > max) invalid('Invalid ' + key + '.');
    fields[key] = body[key].trim();
  }
  if ('image' in body) fields.image = body.image === null ? null : require('../upload/image.validation').imageUrl(body.image);
  if (!Object.keys(fields).length) invalid('Provide at least one category field.');
  if (fields.name) fields.nameKey = fields.name.toLowerCase();
  return fields;
}
module.exports = { categoryInput, versionInput };
