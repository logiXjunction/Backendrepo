
const swaggerUi = require('swagger-ui-express');
const SwaggerParser = require('@apidevtools/swagger-parser');
const path = require('path');

const swaggerPath = path.join(__dirname, '../../swagger/swagger.yaml');

const getSwaggerDocument = async () => {
    console.log('Loading and bundling Swagger from:', swaggerPath);
    try {
        const swaggerDocument = await SwaggerParser.dereference(swaggerPath);
        console.log('Swagger document successfully loaded and bundled.');
        return swaggerDocument;
    } catch (error) {
        console.error('Error loading or dereferencing Swagger document:', error);
        throw error;
    }
};

module.exports = {
    swaggerUi,
    getSwaggerDocument,
};