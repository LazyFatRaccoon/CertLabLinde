const { FIELD_DEFAULT } = require("../constants/templateFieldDefault");
const { v4: uuid } = require("uuid");

module.exports.normalizeField = (f = {}) => ({
  ...FIELD_DEFAULT,
  ...f,
  id: f.id ?? uuid(),
});
