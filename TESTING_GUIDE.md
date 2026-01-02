# Document API Testing Guide

## Prerequisites
1. Make sure your server is running
2. Have a transporter account (email + password) or create one
3. Have test document files ready (PDF, JPG, or PNG)

## Step 1: Start the Server

```bash
cd backend/Backendrepo
npm run dev
# or
npm start
```

Server should run on `http://localhost:3000` (or your configured PORT)

## Step 2: Get Authentication Token

### Option A: Login (if you have an account)
```bash
curl -X POST http://localhost:3000/api/transporter/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful."
}
```

### Option B: Register a new transporter
```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/transporter/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Verify OTP and Register
curl -X POST http://localhost:3000/api/transporter/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# 3. Register with password
curl -X POST http://localhost:3000/api/transporter/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "companyName": "Test Company",
    "companyAddress": "123 Test St",
    "designation": "Owner",
    "gstNumber": "22AAAAA0000A1Z5",
    "phoneNumber": "1234567890"
  }'

# 4. Login to get token
curl -X POST http://localhost:3000/api/transporter/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Save the token** from the response - you'll need it for all document APIs.

---

## Step 3: Test Document APIs

Replace `YOUR_TOKEN` with the actual token from Step 2.

### API 1: Get All Documents (GET)

```bash
curl -X GET http://localhost:3000/api/document \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "gst": {
    "isSubmitted": false,
    "isVerified": "false",
    "name": "GST Certificate",
    "description": ""
  },
  "aadhar": {
    "isSubmitted": false,
    "isVerified": "false",
    "name": "Owner Aadhar",
    "description": ""
  },
  "pan": {
    "isSubmitted": false,
    "isVerified": "false",
    "name": "Pan Card",
    "description": ""
  },
  "cancelledCheck": {
    "isSubmitted": false,
    "isVerified": "false",
    "name": "Cancelled Check",
    "description": ""
  },
  "passBookCopy": {
    "isSubmitted": false,
    "isVerified": "false",
    "name": "PassBook Copy",
    "description": ""
  }
}
```

---

### API 2: Submit a Document (POST)

**Valid keys:** `gst`, `pan`, `aadhar`, `cancelledCheck`, `passBookCopy`

#### Example: Submit GST Certificate
```bash
curl -X POST http://localhost:3000/api/document/add-gst \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/gst-certificate.pdf"
```

#### Example: Submit PAN Card
```bash
curl -X POST http://localhost:3000/api/document/add-pan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/pan-card.jpg"
```

#### Example: Submit Aadhar
```bash
curl -X POST http://localhost:3000/api/document/add-aadhar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/aadhar.jpg"
```

#### Example: Submit Cancelled Check
```bash
curl -X POST http://localhost:3000/api/document/add-cancelledCheck \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/cancelled-check.jpg"
```

#### Example: Submit PassBook Copy
```bash
curl -X POST http://localhost:3000/api/document/add-passBookCopy \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/passbook.jpg"
```

**Expected Response:**
```json
{
  "message": "GST Certificate submitted successfully",
  "document": {
    "gst": {
      "isSubmitted": true,
      "isVerified": "false",
      "name": "GST Certificate",
      "description": ""
    }
  }
}
```

**Note:** File must be:
- Format: PDF, JPG, or PNG
- Max size: 5MB
- Field name: `file`

---

### API 3: Get Document URL (GET)

Get a signed S3 URL to access a specific document.

**Valid keys:** `gst`, `pan`, `aadhar`, `cancelledCheck`, `passBookCopy`

#### Example: Get GST Certificate URL
```bash
curl -X GET http://localhost:3000/api/document/gst \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Example: Get PAN Card URL
```bash
curl -X GET http://localhost:3000/api/document/pan \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "url": "https://s3.amazonaws.com/bucket-name/transporters/1/documents/gst?X-Amz-Algorithm=...",
  "name": "GST Certificate"
}
```

**Note:** The signed URL expires in 5 minutes (300 seconds).

---

## Testing with Postman / Thunder Client

### Setup
1. Create a new collection: "Document APIs"
2. Set base URL: `http://localhost:3000`
3. Create an environment variable: `token`

### Request 1: Login
- **Method:** POST
- **URL:** `{{baseUrl}}/api/transporter/login`
- **Body (JSON):**
  ```json
  {
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **Tests Tab:** Add script to save token
  ```javascript
  if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("token", jsonData.token);
  }
  ```

### Request 2: Get All Documents
- **Method:** GET
- **URL:** `{{baseUrl}}/api/document`
- **Headers:**
  - `Authorization: Bearer {{token}}`

### Request 3: Submit Document
- **Method:** POST
- **URL:** `{{baseUrl}}/api/document/add-gst`
- **Headers:**
  - `Authorization: Bearer {{token}}`
- **Body:** form-data
  - Key: `file` (type: File)
  - Value: Select your file

### Request 4: Get Document URL
- **Method:** GET
- **URL:** `{{baseUrl}}/api/document/gst`
- **Headers:**
  - `Authorization: Bearer {{token}}`

---

## Testing Workflow

1. ✅ **Login** → Get token
2. ✅ **GET /api/document** → Should return all documents with `isSubmitted: false`
3. ✅ **POST /api/document/add-gst** → Upload GST certificate
4. ✅ **GET /api/document** → Should show `gst.isSubmitted: true`
5. ✅ **GET /api/document/gst** → Get signed URL, open in browser to verify file
6. ✅ Repeat for other documents (pan, aadhar, cancelledCheck, passBookCopy)

---

## Error Scenarios to Test

### 1. Missing Authentication
```bash
curl -X GET http://localhost:3000/api/document
# Expected: 401 Unauthorized
```

### 2. Invalid Document Type
```bash
curl -X POST http://localhost:3000/api/document/add-invalid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"
# Expected: 400 Bad Request - Invalid document type
```

### 3. Missing File
```bash
curl -X POST http://localhost:3000/api/document/add-gst \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: 400 Bad Request - File is required
```

### 4. Document Not Found
```bash
curl -X GET http://localhost:3000/api/document/gst \
  -H "Authorization: Bearer YOUR_TOKEN"
# If document not submitted: 404 Not Found
```

### 5. Invalid File Type
```bash
curl -X POST http://localhost:3000/api/document/add-gst \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
# Expected: 400 Bad Request - Invalid file type
```

---

## Quick Test Script

Save this as `test-documents.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="test@example.com"
PASSWORD="password123"

# Login
echo "1. Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/transporter/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed!"
  exit 1
fi

echo "Token: $TOKEN"
echo ""

# Get all documents
echo "2. Getting all documents..."
curl -X GET "$BASE_URL/api/document" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# Submit GST (replace with actual file path)
echo "3. Submitting GST document..."
curl -X POST "$BASE_URL/api/document/add-gst" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/gst.pdf" | jq
echo ""

# Get GST URL
echo "4. Getting GST document URL..."
curl -X GET "$BASE_URL/api/document/gst" \
  -H "Authorization: Bearer $TOKEN" | jq
```

Make it executable and run:
```bash
chmod +x test-documents.sh
./test-documents.sh
```

---

## Notes

- All document endpoints require JWT authentication
- Token expires after 7 days (for login) or 10 minutes (for OTP verification)
- File uploads are limited to 5MB
- Supported file types: PDF, JPG, PNG
- S3 signed URLs expire after 5 minutes
- Each transporter can have only one document record (one-to-one relationship)

