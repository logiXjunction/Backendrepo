# Ultron Backend API

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Update the `.env` file with your database credentials. If need help contact admin
## Setup With docker
4. Start the development server:
   ```
   docker compose up --build
   ```
5. All API's are documented first in swagger. Check out http://localhost:3000/docs for more information

---

## Packers & Movers API

POST /api/services/packers
- Content-Type: multipart/form-data
- Fields: `name` (required), `phone` (required), `pickupAddress` (required), `dropoffAddress` (required), `pickupDate` (required), `pickupTime`, `vehicleType`, `estimatedWeight`, `insurance` (`true`/`false`), `notes`, `items` (JSON string array), `images` (files, up to 6)
- Response: 201 { success: true, message: 'Packers request created', id }

Example (curl):

```bash
curl -X POST http://localhost:3000/api/services/packers \
  -F "name=John Doe" \
  -F "phone=9999999999" \
  -F "pickupAddress=123 Main St" \
  -F "dropoffAddress=456 Oak Ave" \
  -F "pickupDate=2025-12-25" \
  -F "items=[{\"name\":\"Sofa\",\"qty\":1}]" \
  -F "images=@/path/to/photo1.jpg" -F "images=@/path/to/photo2.jpg"
```
