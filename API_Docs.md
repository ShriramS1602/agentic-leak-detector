# Financial Leak Detector - API Documentation

Complete API reference for the Financial Leak Detector backend service.

## Base URL
```
http://localhost:8000
```

## Authentication

Most endpoints require Bearer token authentication via JWT:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints (`/api/auth`)

### 1. POST `/api/auth/signup`
**Purpose:** Create a new user account

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "name": "John Doe",
  "terms_accepted": true,
  "privacy_accepted": true
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username",
  "name": "John Doe",
  "is_active": false,
  "is_email_verified": false,
  "created_at": "2026-01-05T10:30:00"
}
```

**Errors:**
- `400` - User already exists or invalid email format
- `422` - Validation error (missing required fields)

---

### 2. POST `/api/auth/login`
**Purpose:** Authenticate user and receive JWT token

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Errors:**
- `401` - Invalid email or password
- `403` - Email not verified
- `404` - User not found

---

### 3. POST `/api/auth/refresh`
**Purpose:** Refresh expired JWT token

**Request:** (No body required, uses Authorization header)

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Errors:**
- `401` - Invalid or expired token

---

### 4. POST `/api/auth/verify-email`
**Purpose:** Verify email address using OTP

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully",
  "is_email_verified": true
}
```

**Errors:**
- `400` - Invalid or expired OTP
- `404` - User not found

---

### 5. POST `/api/auth/forgot-password`
**Purpose:** Request password reset

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

---

### 6. POST `/api/auth/reset-password`
**Purpose:** Reset password with token

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

## Email Endpoints (`/api/email`)

### 1. POST `/api/email/send-verification`
**Purpose:** Send verification email to user

**Request:** (No body, uses authenticated user)

**Response (200):**
```json
{
  "message": "Verification email sent",
  "email": "user@example.com"
}
```

**Errors:**
- `401` - Unauthorized
- `400` - Email already verified

---

## Transaction Endpoints (`/api/transactions`)

### 1. POST `/api/transactions/upload`
**Purpose:** Upload transaction file (CSV/Excel) for processing

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- File: Binary file (.csv or .xlsx)
- Authentication: Required

**Example:**
```bash
curl -X POST "http://localhost:8000/api/transactions/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@transactions.csv"
```

**Response (200):**
```json
{
  "status": "success",
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "statistics": {
    "total_rows": 150,
    "clean_rows": 145,
    "transactions_stored": 145,
    "patterns_aggregated": 23,
    "pattern_stats_stored": 23
  }
}
```

**Response Fields:**
- `upload_id`: Unique identifier for tracking this upload
- `total_rows`: Total rows in file
- `clean_rows`: Valid rows after cleaning/normalization
- `transactions_stored`: Rows successfully stored in Transaction table
- `patterns_aggregated`: Number of distinct merchant patterns aggregated
- `pattern_stats_stored`: Number of patterns stored in SpendingPatternStats table

**Errors:**
- `400` - Invalid file format or no valid transactions
- `401` - Unauthorized
- `413` - File too large (max 5MB)

**CSV/Excel Format Expected:**

The file must have these exact columns:
- `Date` - Transaction date (format: YYYY-MM-DD or DD-MM-YYYY)
- `Narration` - Transaction description/merchant
- `Withdrawal Amt.` - Amount withdrawn (expense)
- `Deposit Amt.` - Amount deposited (income)

Optional columns (will be ignored):
- `Chq./Ref.No.` - Check or reference number
- `Value Dt` - Value date

**CSV Example:**
```
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.
2026-01-01,STARBUCKS COFFEE,,,50.00,
2026-01-02,SALARY DEPOSIT,,,, 5000.00
2026-01-03,NETFLIX CHARGE,,,15.99,
```

**Excel Format:** Same columns, first sheet will be read

---

### 2. GET `/api/transactions/patterns`
**Purpose:** Retrieve all spending pattern statistics for current user

**Request:**
- Method: GET
- Authentication: Required

**Response (200):**
```json
{
  "status": "success",
  "patterns": [
    {
      "id": 1,
      "merchant_hint": "starbucks",
      "level_1_tag": "FOOD_AND_DINING",
      "level_2_tag": "COFFEE",
      "level_3_tag": "COFFEE_SHOP",
      "evidence": {
        "txn_count": 54,
        "total_amount": 810.0,
        "avg_amount": 15.0,
        "dominant_level_3_tag": "COFFEE_SHOP",
        "level_3_confidence": 0.95,
        "gap_mean_days": 6.8,
        "gap_std_days": 2.1,
        "gap_min_days": 3,
        "gap_max_days": 14,
        "recency_days": 1
      },
      "created_at": "2026-01-05T10:30:00",
      "updated_at": "2026-01-05T10:30:00"
    }
  ]
}
```

**Pattern Fields:**
- `id`: Database ID
- `merchant_hint`: Extracted merchant name
- `level_1_tag`: High-level category (FOOD_AND_DINING, UTILITIES, etc.)
- `level_2_tag`: Mid-level category (COFFEE, ELECTRICITY, etc.)
- `level_3_tag`: Specific category (COFFEE_SHOP, ELECTRIC_BILL, etc.)
- `evidence`: Aggregated statistics from transactions

**Errors:**
- `401` - Unauthorized

---

### 3. GET `/api/transactions/raw-transactions`
**Purpose:** Retrieve enriched transaction records

**Request:**
- Method: GET
- Query Parameters:
  - `limit` (optional): Number of results (default: 100)
  - `skip` (optional): Number of results to skip for pagination (default: 0)
- Authentication: Required

**Example:**
```
GET /api/transactions/raw-transactions?limit=50&skip=0
```

**Response (200):**
```json
{
  "status": "success",
  "total": 145,
  "skip": 0,
  "limit": 50,
  "transactions": [
    {
      "id": 1,
      "txn_date": "2026-01-01",
      "narration": "STARBUCKS COFFEE",
      "withdrawal_amount": 50.0,
      "deposit_amount": null,
      "money_flow": "EXPENSE",
      "level_1_tag": "FOOD_AND_DINING",
      "level_2_tag": "COFFEE",
      "level_3_tag": "COFFEE_SHOP",
      "merchant_hint": "starbucks",
      "file_upload_id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2026-01-05T10:30:00"
    }
  ]
}
```

**Transaction Fields:**
- `txn_date`: Transaction date
- `narration`: Original transaction description
- `withdrawal_amount`: Amount debited (if expense)
- `deposit_amount`: Amount credited (if income)
- `money_flow`: INCOME, EXPENSE, or TRANSFER
- `level_1/2/3_tag`: Categorization tags
- `merchant_hint`: Extracted merchant
- `file_upload_id`: Batch identifier

**Errors:**
- `401` - Unauthorized

---

## Leak Analysis Endpoints (`/api/leaks`)

### 1. POST `/api/leaks/analyze`
**Purpose:** Run AI analysis on spending patterns to identify potential financial leaks

**Request:**
- Method: POST
- Content-Type: application/json
- Body: Empty JSON object `{}`
- Authentication: Required

**Example:**
```bash
curl -X POST "http://localhost:8000/api/leaks/analyze" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (200):**
```json
{
  "leaks": [
    {
      "pattern_id": 1,
      "merchant_hint": "starbucks",
      "leak_probability": 0.85,
      "leak_category": "excessive_habit",
      "reasoning": "This pattern shows very frequent transactions (54 times in 6 months) with a consistent small amount (15.0). High frequency and fixed amount suggest a regular discretionary spending habit.",
      "actionable_step": "Consider reducing frequency or bringing beverages from home. Even reducing by 50% could save significant money.",
      "estimated_annual_saving": 200.0
    },
    {
      "pattern_id": 21,
      "merchant_hint": "monthly autopay. c",
      "leak_probability": 0.95,
      "leak_category": "unused_subscription",
      "reasoning": "Explicitly labeled 'monthly autopay' with perfectly consistent monthly amount (199.0). Strong signal of recurring subscription that may be unused.",
      "actionable_step": "Review this subscription immediately. If not actively used, cancel to save money.",
      "estimated_annual_saving": 2388.0
    }
  ],
  "total_estimated_annual_saving": 5000.0,
  "analysis_timestamp": "2026-01-05T10:30:00",
  "confidence_level": "high"
}
```

**Leak Fields:**
- `pattern_id`: ID of the spending pattern being analyzed
- `merchant_hint`: What the spending is for
- `leak_probability`: Confidence (0.0-1.0) that this is a leak
- `leak_category`: Type of leak:
  - `unused_subscription`: Recurring payment not being used
  - `excessive_habit`: Frequent discretionary spending
  - `impulse_spending`: Irregular large purchases
  - `discretionary_spending`: Optional purchases
  - `essential_spending`: Necessary expenses (usually not a leak)
  - `investment`: Investment-related (not a leak)
  - `inactive_spending`: No longer active pattern
  - `infrequent_spending`: Not a recurring leak
  - `intentional_discretionary_spending`: Intentional (e.g., charity)
- `reasoning`: AI's explanation based on evidence
- `actionable_step`: Specific action user can take
- `estimated_annual_saving`: Conservative estimate of annual savings

**Response Fields:**
- `leaks`: Array of identified leaks
- `total_estimated_annual_saving`: Sum of all potential savings
- `analysis_timestamp`: When analysis was performed
- `confidence_level`: Overall confidence (high/medium/low)

**Errors:**
- `400` - No spending patterns found (upload transactions first)
- `401` - Unauthorized
- `503` - AI analyzer not initialized (GEMINI_API_KEY not configured)

---

## Health & Root Endpoints

### GET `/health`
**Purpose:** Health check endpoint

**Response (200):**
```json
{
  "status": "healthy",
  "service": "Financial Leak Detector",
  "version": "1.0.0"
}
```

---

### GET `/`
**Purpose:** Root endpoint with available endpoints

**Response (200):**
```json
{
  "message": "Financial Leak Detector API",
  "description": "Detect forgotten subscriptions, hidden spending habits, and price creep",
  "endpoints": {
    "docs": "/docs",
    "auth": "/api/auth",
    "email": "/api/email",
    "transactions": "/api/transactions",
    "leaks": "/api/leaks"
  }
}
```

---

## Error Response Format

All errors follow this standard format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (email not verified)
- `404` - Not found (resource doesn't exist)
- `413` - Payload too large (file too big)
- `422` - Validation error (missing required fields)
- `500` - Internal server error
- `503` - Service unavailable (AI not initialized)

---

## Data Flow Summary

```
1. User signs up & logs in → Receives JWT token
2. User uploads CSV/Excel file → /api/transactions/upload
   - File parsed and cleaned
   - Transactions enriched with categories
   - Stored in Transaction table
   - Patterns aggregated into SpendingPatternStats
3. User views transaction data → /api/transactions/raw-transactions
4. User views spending patterns → /api/transactions/patterns
5. User triggers AI analysis → /api/leaks/analyze
   - AI reads from SpendingPatternStats
   - AI reasons about potential leaks
   - LeakInsights stored and returned
6. User reviews leak recommendations
```

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding for production use.

---

## CORS Configuration

Frontend allowed origins:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `*` (wildcard - should be restricted in production)

---

## Token Expiration

JWT tokens expire after 24 hours. Use `/api/auth/refresh` to get a new token before expiration.
