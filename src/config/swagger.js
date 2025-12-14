// config/swagger.js

const swaggerUi = require('swagger-ui-express');
const SwaggerParser = require('@apidevtools/swagger-parser');
const path = require('path');

const swaggerPath = path.join(__dirname, '../../swagger/swagger.yaml');

const getSwaggerDocument = async () => {
    console.log('🔥 Loading and bundling Swagger from:', swaggerPath);
    try {
        // Use dereference to resolve all external $ref links into a single object
        const swaggerDocument = await SwaggerParser.dereference(swaggerPath);
        console.log('✅ Swagger document successfully loaded and bundled.');
        return swaggerDocument;
    } catch (error) {
        console.error('❌ Error loading or dereferencing Swagger document:', error);
        // Throw the error so the server start fails gracefully
        throw error;
    }
};

module.exports = {
    swaggerUi,
    getSwaggerDocument,
};