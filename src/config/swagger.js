const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(
  path.join(__dirname, '../../swagger/base.yaml')
);

module.exports = {
  swaggerUi,
  swaggerDocument,
};
