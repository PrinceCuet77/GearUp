# User API Documentation

Base path: `/api/user`

All endpoints require authentication via a Bearer token in the `Authorization` header.

---

## 1. Get User Profile

`GET /api/user/me`

Returns the authenticated user's profile. The `password` field is excluded.

**Auth:** `CUSTOMER`, `PROVIDER`, `ADMIN`

### Response (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "avatarUrl": "https://example.com/avatar.png",
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-07-01T00:00:00.000Z"
  }
}
```

### Errors

| Status | Message        | Cause                 |
| ------ | -------------- | --------------------- |
| 401    | Unauthorized   | No valid token        |
| 404    | User not found | User ID doesn't exist |

---

## 2. Update User Profile

`PATCH /api/user/me`

Updates the authenticated user's `name` and/or `avatarUrl`.

**Auth:** `CUSTOMER`, `PROVIDER`, `ADMIN`

### Request Body

| Field       | Type   | Required | Description                   |
| ----------- | ------ | -------- | ----------------------------- |
| `name`      | string | No       | New display name (min 1 char) |
| `avatarUrl` | string | No       | URL to a new avatar image     |

Both fields are optional, but at least one must be provided.

### Request Example

```json
{
  "name": "Jane Doe",
  "avatarUrl": "https://example.com/new-avatar.png"
}
```

### Response (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "name": "Jane Doe",
    "email": "john@example.com",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "avatarUrl": "https://example.com/new-avatar.png",
    "createdAt": "2026-07-01T00:00:00.000Z",
    "updatedAt": "2026-08-01T12:00:00.000Z"
  }
}
```

### Errors

| Status | Message          | Cause                            |
| ------ | ---------------- | -------------------------------- |
| 400    | Validation Error | Invalid `avatarUrl` format, etc. |
| 401    | Unauthorized     | No valid token                   |
| 404    | User not found   | User ID doesn't exist            |

---

## 3. Change Password

`PATCH /api/user/me/password`

Changes the authenticated user's password. Requires the current password for verification.

**Auth:** `CUSTOMER`, `PROVIDER`, `ADMIN`

### Request Body

| Field         | Type   | Required | Description                             |
| ------------- | ------ | -------- | --------------------------------------- |
| `oldPassword` | string | Yes      | The user's current password             |
| `newPassword` | string | Yes      | New password (min 6, max 20 characters) |

### Request Example

```json
{
  "oldPassword": "currentPass123",
  "newPassword": "newSecurePass!"
}
```

### Response (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully",
  "data": null
}
```

### Errors

| Status | Message          | Cause                                       |
| ------ | ---------------- | ------------------------------------------- |
| 400    | Validation Error | `newPassword` too short/long, etc.          |
| 401    | Unauthorized     | No valid token or old password is incorrect |
| 404    | User not found   | User ID doesn't exist                       |

---

## 4. Customer Dashboard

`GET /api/user/dashboard`

Returns aggregated stats and recent orders for the authenticated customer.

**Auth:** `CUSTOMER`

### Response (200)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Customer dashboard fetched successfully",
  "data": {
    "stats": {
      "totalOrders": 12,
      "activeRentals": 2,
      "paymentsMade": 9,
      "reviewsGiven": 4
    },
    "recentOrders": [
      {
        "id": "a1b2c3d4-...",
        "status": "PICKED_UP",
        "startDate": "2026-07-10T00:00:00.000Z",
        "endDate": "2026-07-15T00:00:00.000Z",
        "amount": "120.00",
        "customerId": "u-123",
        "createdAt": "2026-07-08T09:12:00.000Z",
        "updatedAt": "2026-07-10T09:00:00.000Z"
      }
    ]
  }
}
```

### Stats Fields

| Field           | Description                                     |
| --------------- | ----------------------------------------------- |
| `totalOrders`   | Total rental orders placed by this customer     |
| `activeRentals` | Orders with status `PAID` or `PICKED_UP`        |
| `paymentsMade`  | Total payments linked to this customer's orders |
| `reviewsGiven`  | Total reviews submitted by this customer        |

### Errors

| Status | Message      | Cause          |
| ------ | ------------ | -------------- |
| 401    | Unauthorized | No valid token |
