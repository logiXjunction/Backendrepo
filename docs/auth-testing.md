# Auth endpoints — quick test

Replace `API_URL` with your server e.g. `http://localhost:3000`.

1) Send email OTP (for shipper signup)

curl -X POST -H "Content-Type: application/json" -d '{"email":"me@example.com"}' $API_URL/api/validate/send-email-otp

2) Verify email OTP

curl -X POST -H "Content-Type: application/json" -d '{"email":"me@example.com","otp":"123456"}' $API_URL/api/validate/verify-email-otp

Response contains `token` (email verification token). Use it in the register request header `emailverificationtoken`.

3) Register shipper

curl -X POST -H "Content-Type: application/json" -H "emailverificationtoken: <TOKEN>" -d '{"ownerName":"Alice","ownerContactNumber":"9876543210","email":"me@example.com","phoneNumber":"9876543210","password":"StrongPass1","companyName":"Acme"}' $API_URL/api/shipper/register

4) Login shipper

# You can login with email or mobileNumber
curl -X POST -H "Content-Type: application/json" -d '{"email":"me@example.com","password":"StrongPass1"}' $API_URL/api/shipper/login

5) Transporter login

curl -X POST -H "Content-Type: application/json" -d '{"email":"transporter@example.com","password":"password"}' $API_URL/api/transporter/login

6) Verify shipper token

curl -H "Authorization: Bearer <JWT>" $API_URL/api/shipper/verify
