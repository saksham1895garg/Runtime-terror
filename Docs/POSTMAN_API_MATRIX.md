# Postman API Testing Matrix

*Note: Phase 12 introduced a comprehensive new operational API surface for Officers, Developers, and Public Risk Boundaries. Please refer to `Docs/PHASE12_API_SURFACE.md` for the authoritative list of these endpoints.*

## 1. Developer Login & God Mode (Next.js)

### POST `/api/auth/step-up`
- **Purpose**: Triggers OTP for God Mode
- **Auth**: Cookie-based session (`role=developer`)
- **Headers**: `Content-Type: application/json`
- **Request Body**: None
- **Expected Success**: `200 OK`
- **Expected Failure**: `401 Unauthorized`, `403 Forbidden`

### POST `/api/auth/step-up/verify`
- **Purpose**: Verify OTP and establish God Mode token
- **Auth**: Cookie-based session (`role=developer`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "token": "123456"
  }
  ```
- **Expected Success**: `200 OK` (Sets `GodMode-Token` cookie)
- **Expected Failure**: `401 Unauthorized`

## 2. Officer Data (Next.js)

### GET `/api/officer`
- **Purpose**: Retrieve dashboard flags, reports, and advisories securely
- **Auth**: Cookie-based session (`role=officer` or `developer`)
- **Expected Success**: `200 OK`
  ```json
  {
    "flags": [],
    "reports": [],
    "advisories": []
  }
  ```
- **Expected Failure**: `401 Unauthorized`, `403 Forbidden`

## 3. Public Endpoints (Next.js)

### GET `/api/risk/grid`
- **Purpose**: Public risk data consensus
- **Auth**: None
- **Expected Success**: `200 OK`
- **Expected Failure**: `500 Internal Server Error`

### POST `/api/reports`
- **Purpose**: Submit public disaster report
- **Auth**: None
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "title": "Road Blocked",
    "description": "Large boulders on highway",
    "lat": 30.123,
    "lon": 78.456,
    "category": "ROCKFALL"
  }
  ```
- **Expected Success**: `200 OK`
- **Expected Failure**: `429 Too Many Requests`

## 4. ML Backend (FastAPI - Internal Port 18000)

### GET `/health`
- **Purpose**: ML backend health check
- **Auth**: None
- **Expected Success**: `200 OK`
  ```json
  {
    "status": "ok",
    "database": "connected",
    "redis_queue": "connected"
  }
  ```
- **Expected Failure**: `503 Service Unavailable`

### POST `/predictions/test`
- **Purpose**: Test model inference
- **Auth**: None (Internal VPC route)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "grid_code": "GNG-000026"
  }
  ```
- **Expected Success**: `200 OK`
- **Expected Failure**: `400 Bad Request`, `404 Not Found`, `503 Service Unavailable`
