# Dashboard API Spec

The frontend has 3 role-based dashboard overview pages (`/admin`, `/customer`, `/provider`) that currently render with dummy data (`src/lib/dummy-data.ts`). None of the existing endpoints in [BACKEND_DOCS.md](./BACKEND_DOCS.md) return an aggregated "overview" payload — computing these stats client-side would require fetching entire user/gear/rental lists just to count them, which doesn't scale.

This doc specifies **3 new dashboard endpoints** (one per role) that return exactly the stats + recent-items shape each page needs, in a single request.

> Response envelope follows the existing convention from [BACKEND_DOCS.md](./BACKEND_DOCS.md#error-response-format): `{ success, statusCode, message, data }`. No `meta`/pagination is needed since these are fixed-size summaries, not paginated lists.

---

## 1. Customer Dashboard

`GET /api/dashboard/customer` — Auth: `CUSTOMER`

Powers `src/app/(dashboards)/customer/page.tsx`.

### Stats logic

| Field           | Definition                                                             |
| --------------- | ---------------------------------------------------------------------- |
| `totalOrders`   | Count of all `rental_orders` where `customerId = currentUser.id`       |
| `activeRentals` | Count of the above where `status IN ('PAID', 'PICKED_UP')`             |
| `paymentsMade`  | Count of `payments` joined to this customer's rental orders            |
| `reviewsGiven`  | Count of `reviews` where `customerId = currentUser.id`                 |
| `recentOrders`  | Last 5 of this customer's `rental_orders`, ordered by `createdAt DESC` |

### Response

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

---

## 2. Provider Dashboard

`GET /api/dashboard/provider` — Auth: `PROVIDER`

Powers `src/app/(dashboards)/provider/page.tsx`.

### Stats logic

| Field             | Definition                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `totalGearListed` | Count of `gear_items` where `providerId = currentUser.id`                                                               |
| `totalOrders`     | Count of distinct `rental_orders` containing at least one item whose `gearItem.providerId = currentUser.id`             |
| `pendingOrders`   | Same set as above, filtered to `status = 'PLACED'`                                                                      |
| `recentOrders`    | Last 5 orders from the `totalOrders` set above, ordered by `createdAt DESC`, with `customer` (id, name, email) embedded |

### Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Provider dashboard fetched successfully",
  "data": {
    "stats": {
      "totalGearListed": 15,
      "totalOrders": 34,
      "pendingOrders": 3
    },
    "recentOrders": [
      {
        "id": "b2c3d4e5-...",
        "status": "PLACED",
        "startDate": "2026-08-01T00:00:00.000Z",
        "endDate": "2026-08-05T00:00:00.000Z",
        "amount": "80.00",
        "customerId": "u-456",
        "customer": {
          "id": "u-456",
          "name": "Jane Doe",
          "email": "jane@example.com"
        },
        "createdAt": "2026-07-30T14:20:00.000Z",
        "updatedAt": "2026-07-30T14:20:00.000Z"
      }
    ]
  }
}
```

> ⚠️ Only orders containing **this provider's** gear should count/appear — not all platform orders.

---

## 3. Admin Dashboard

`GET /api/dashboard/admin` — Auth: `ADMIN`

Powers `src/app/(dashboards)/admin/page.tsx`. Stats only — the page's "Quick Actions" links are static, no recent-items list needed.

### Stats logic

| Field             | Definition                                    |
| ----------------- | --------------------------------------------- |
| `totalUsers`      | Count of all rows in `users`                  |
| `activeGears`     | Count of `gear_items` where `isActive = true` |
| `totalRentals`    | Count of all rows in `rental_orders`          |
| `totalCategories` | Count of all rows in `categories`             |

### Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin dashboard fetched successfully",
  "data": {
    "stats": {
      "totalUsers": 128,
      "activeGears": 87,
      "totalRentals": 340,
      "totalCategories": 6
    }
  }
}
```

---

## Error responses

Same as the rest of the API — see [BACKEND_DOCS.md § Error Response Format](./BACKEND_DOCS.md#error-response-format). Notably:

- `401` if not authenticated
- `403` if role doesn't match the endpoint (e.g. a `CUSTOMER` calling `/api/dashboard/provider`)

## Frontend follow-up (once implemented)

Once these are live, the following files need to be switched from dummy data to real `serverFetch` calls:

- [customer/page.tsx](<../src/app/(dashboards)/customer/page.tsx>)
- [provider/page.tsx](<../src/app/(dashboards)/provider/page.tsx>)
- [admin/page.tsx](<../src/app/(dashboards)/admin/page.tsx>)
