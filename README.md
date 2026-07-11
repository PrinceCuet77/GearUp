# GearUp 🏋️ Application

**"Rent Sports & Outdoor Gear Instantly"**

## Project Overview

GearUp is a backend API for a sports and outdoor equipment rental service. Customers can browse available gear, place rental orders, and return equipment. Providers manage their gear inventory and fulfill rental orders. Admins oversee the platform, manage users, and moderate listings.

[Live URL](https://gear-up-self.vercel.app/)

[Live Postman Colleaction URL](https://documenter.getpostman.com/view/17094363/2sBY4Jximt)

- Admin Credentials

```
Admin Email      : admin@gearup.com
Admin Password   : Password123!
```

## Features

### User (Customer)

- Register and login with email/password
- JWT-based authentication with access & refresh tokens (cookie-based)
- Browse all available gear with filtering and pagination
- View gear details and reviews
- Place rental orders with multiple items
- Cancel rental orders
- Make payments via SSLCommerz gateway
- View payment history
- Submit, update, and delete reviews
- Update profile and change password

### Provider

- Create, update, delete gear listings
- View own gear inventory with filtering & pagination
- View and manage incoming rental orders
- Update order status (confirm, pick-up, return)

### Admin

- View all users and user details
- Suspend or activate user accounts
- Create and update gear categories
- View all gear listings across providers
- View all rentals
- Access provider-specific order details

### 🔧 General

- RESTful API with modular architecture
- Zod-based request validation
- Role-based access control (RBAC)
- Global error handling with Prisma error mapping
- Cookie-based authentication support
- Pagination support on all list endpoints

## Tech Stack

| Category       | Technology                       |
| -------------- | -------------------------------- |
| Runtime        | Node.js (ESNext modules)         |
| Language       | TypeScript                       |
| Framework      | Express.js v5                    |
| ORM            | Prisma v7                        |
| Database       | PostgreSQL                       |
| Authentication | JSON Web Tokens (JWT) + bcryptjs |
| Payment        | SSLCommerz                       |
| Validation     | Zod v4                           |
| Build Tool     | tsup                             |
| Deployment     | Vercel                           |

## Database Schema

The application uses PostgreSQL with the following Prisma models:

### `users`

| Column    | Type          | Constraints                 |
| --------- | ------------- | --------------------------- |
| id        | String (UUID) | PK, auto-generated          |
| name      | String?       | Optional                    |
| email     | String        | Unique                      |
| password  | String        | Hashed with bcrypt          |
| role      | UserRole      | CUSTOMER / PROVIDER / ADMIN |
| status    | UserStatus    | Default: ACTIVE             |
| avatarUrl | String?       | Optional                    |
| createdAt | DateTime      | Auto-generated              |
| updatedAt | DateTime      | Auto-updated                |

### `categories`

| Column      | Type          | Constraints        |
| ----------- | ------------- | ------------------ |
| id          | String (UUID) | PK, auto-generated |
| name        | String        | Unique             |
| description | String?       | Optional           |
| createdAt   | DateTime      | Auto-generated     |
| updatedAt   | DateTime      | Auto-updated       |

### `gear_items`

| Column      | Type          | Constraints        |
| ----------- | ------------- | ------------------ |
| id          | String (UUID) | PK, auto-generated |
| name        | String        | Required           |
| description | String        | Required           |
| price       | Decimal(10,2) | Required           |
| stock       | Int           | Default: 1         |
| images      | String        | Required           |
| isActive    | Boolean       | Default: true      |
| providerId  | String (UUID) | FK → users.id      |
| categoryId  | String (UUID) | FK → categories.id |
| createdAt   | DateTime      | Auto-generated     |
| updatedAt   | DateTime      | Auto-updated       |

### `rental_orders`

| Column     | Type          | Constraints        |
| ---------- | ------------- | ------------------ |
| id         | String (UUID) | PK, auto-generated |
| status     | RentalStatus  | Default: PLACED    |
| startDate  | DateTime      | Required           |
| endDate    | DateTime      | Required           |
| amount     | Decimal(10,2) | Required           |
| customerId | String (UUID) | FK → users.id      |
| createdAt  | DateTime      | Auto-generated     |
| updatedAt  | DateTime      | Auto-updated       |

### `rental_order_items`

| Column        | Type          | Constraints           |
| ------------- | ------------- | --------------------- |
| id            | String (UUID) | PK, auto-generated    |
| quantity      | Int           | Default: 1            |
| price         | Decimal(10,2) | Required              |
| rentalOrderId | String (UUID) | FK → rental_orders.id |
| gearItemId    | String (UUID) | FK → gear_items.id    |

### `payments`

| Column          | Type          | Constraints           |
| --------------- | ------------- | --------------------- |
| id              | String (UUID) | PK, auto-generated    |
| transactionId   | String        | Unique                |
| amount          | Decimal(10,2) | Required              |
| status          | PaymentStatus | Default: PENDING      |
| paidAt          | DateTime?     | Optional              |
| gatewayResponse | Json?         | Optional              |
| rentalOrderId   | String (UUID) | FK → rental_orders.id |
| createdAt       | DateTime      | Auto-generated        |
| updatedAt       | DateTime      | Auto-updated          |

### `reviews`

| Column        | Type          | Constraints           |
| ------------- | ------------- | --------------------- |
| id            | String (UUID) | PK, auto-generated    |
| rating        | Int           | Required              |
| comment       | String        | Required              |
| customerId    | String (UUID) | FK → users.id         |
| gearItemId    | String (UUID) | FK → gear_items.id    |
| rentalOrderId | String (UUID) | FK → rental_orders.id |
| createdAt     | DateTime      | Auto-generated        |
| updatedAt     | DateTime      | Auto-updated          |

### Enums

```
UserRole:      CUSTOMER | PROVIDER | ADMIN
UserStatus:    ACTIVE | SUSPENDED
RentalStatus:  PLACED | CONFIRMED | PAID | PICKED_UP | RETURNED | CANCELLED
PaymentStatus: PENDING | COMPLETED | FAILED
```

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ GearItem : "provides (provider)"
    User ||--o{ RentalOrder : "places (customer)"
    User ||--o{ Review : "writes"
    Category ||--o{ GearItem : "contains"
    GearItem ||--o{ RentalOrderItem : "included in"
    GearItem ||--o{ Review : "receives"
    RentalOrder ||--o{ RentalOrderItem : "contains"
    RentalOrder ||--o{ Payment : "paid via"
    RentalOrder ||--o{ Review : "reviewed after"

    User {
        string id PK
        string name
        string email UK
        string password
        enum role
        enum status
        string avatarUrl
    }

    Category {
        string id PK
        string name UK
        string description
    }

    GearItem {
        string id PK
        string name
        string description
        decimal price
        int stock
        string images
        boolean isActive
        string providerId FK
        string categoryId FK
    }

    RentalOrder {
        string id PK
        enum status
        datetime startDate
        datetime endDate
        decimal amount
        string customerId FK
    }

    RentalOrderItem {
        string id PK
        int quantity
        decimal price
        string rentalOrderId FK
        string gearItemId FK
    }

    Payment {
        string id PK
        string transactionId UK
        decimal amount
        enum status
        datetime paidAt
        json gatewayResponse
        string rentalOrderId FK
    }

    Review {
        string id PK
        int rating
        string comment
        string customerId FK
        string gearItemId FK
        string rentalOrderId FK
    }
```

## Project Structure

```
GearUp/
├── prisma/
│   ├── schema/
│   │   ├── schema.prisma          # Prisma datasource & generator config
│   │   ├── enums.prisma           # All enum definitions
│   │   ├── user.prisma            # User model
│   │   ├── category.prisma        # Category model
│   │   ├── gearItem.prisma        # GearItem model
│   │   ├── rentalOrder.prisma     # RentalOrder model
│   │   ├── rentalOrderItem.prisma # RentalOrderItem model
│   │   ├── payment.prisma         # Payment model
│   │   └── review.prisma          # Review model
│   ├── migrations/                # Database migration files
│   └── seed.ts                    # Database seeder
├── src/
│   ├── config/
│   │   └── index.ts               # Environment variable configuration
│   ├── errors/
│   │   └── ApiError.ts            # Custom error classes
│   ├── lib/
│   │   └── prisma.ts              # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.ts                # JWT auth & role-based guard
│   │   ├── globalErrorHandler.ts  # Global error handler
│   │   ├── notFound.ts            # 404 handler
│   │   └── validate.ts            # Zod validation middleware
│   ├── modules/
│   │   ├── auth/                  # Authentication module
│   │   ├── user/                  # User profile module
│   │   ├── admin/                 # Admin management module
│   │   ├── provider/              # Provider gear & order management
│   │   ├── gears/                 # Public gear browsing
│   │   ├── categories/            # Public category listing
│   │   ├── rentals/               # Rental order management
│   │   ├── payments/              # Payment processing
│   │   └── reviews/               # Review management
│   ├── utils/
│   │   ├── catchAsync.ts          # Async error wrapper
│   │   ├── jwt.ts                 # JWT utility functions
│   │   └── sendResponse.ts        # Standardized API response helper
│   ├── app.ts                     # Express app setup & route registration
│   └── server.ts                  # Server entry point
├── generated/                     # Prisma generated client
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── vercel.json
```

## Setup Steps

### Prerequisites

- Node.js v18+
- PostgreSQL database
- npm or yarn

### 1. Clone the repository

```bash
git clone <repository-url>
cd GearUp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
APP_URL=http://localhost:5000
BCRYPT_SALT_ROUNDS=10
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
SSL_COMMERZ_STORE_ID=your_store_id
SSL_COMMERZ_STORE_PASSWORD=your_store_password
```

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Seed the database (optional)

```bash
npm run seed
```

### 6. Start development server

```bash
npm run dev
```

### 7. Build for production

```bash
npm run build
npm start
```

### 7. Deploy to Vercel

Ensure `dist/server.js` is built, then push to a Vercel-connected repository. The `vercel.json` routes all traffic to `dist/server.js`.

## API Endpoint Reference

Base URL: `https://gear-up-self.vercel.app/api`

### Auth (`/api/auth`)

| Method | Endpoint    | Body                         | Auth | Description              |
| ------ | ----------- | ---------------------------- | ---- | ------------------------ |
| POST   | `/register` | `{ email, password, role? }` | No   | Register a new user      |
| POST   | `/login`    | `{ email, password }`        | No   | Login and get tokens     |
| POST   | `/refresh`  | `{ refreshToken }`           | No   | Refresh access token     |
| POST   | `/logout`   | –                            | No   | Logout and clear cookies |

### User (`/api/user`)

| Method | Endpoint       | Body/Query                     | Auth      | Description              |
| ------ | -------------- | ------------------------------ | --------- | ------------------------ |
| GET    | `/me`          | –                              | All roles | Get current user profile |
| PATCH  | `/me`          | `{ name?, avatarUrl? }`        | All roles | Update own profile       |
| PATCH  | `/me/password` | `{ oldPassword, newPassword }` | All roles | Change password          |

### Admin (`/api/admin`)

| Method | Endpoint                  | Body/Query                                                                                | Auth  | Description           |
| ------ | ------------------------- | ----------------------------------------------------------------------------------------- | ----- | --------------------- |
| GET    | `/users`                  | –                                                                                         | ADMIN | Get all users         |
| GET    | `/user/:userId`           | –                                                                                         | ADMIN | Get user by ID        |
| PATCH  | `/user/:userId/status`    | `{ status }`                                                                              | ADMIN | Update user status    |
| GET    | `/gears`                  | Query: `{ page?, limit?, category?, minPrice?, maxPrice?, search?, sortBy?, sortOrder? }` | ADMIN | Get all gear listings |
| POST   | `/categories`             | `{ name, description? }`                                                                  | ADMIN | Create category       |
| PATCH  | `/categories/:categoryId` | `{ name?, description? }`                                                                 | ADMIN | Update category       |
| GET    | `/categories/:categoryId` | –                                                                                         | ADMIN | Get category by ID    |

### Provider (`/api/provider`)

| Method | Endpoint           | Body/Query                                                                                | Auth            | Description                |
| ------ | ------------------ | ----------------------------------------------------------------------------------------- | --------------- | -------------------------- |
| GET    | `/gears`           | Query: `{ page?, limit?, category?, minPrice?, maxPrice?, search?, sortBy?, sortOrder? }` | PROVIDER        | Get own listed gears       |
| POST   | `/gears`           | `{ name, description, price, stock?, images, categoryId }`                                | PROVIDER        | Create gear listing        |
| GET    | `/gears/:gearId`   | –                                                                                         | PROVIDER        | Get gear by ID             |
| PATCH  | `/gears/:gearId`   | `{ name?, description?, price?, stock?, images?, categoryId?, isActive? }`                | PROVIDER        | Update gear listing        |
| DELETE | `/gears/:gearId`   | –                                                                                         | PROVIDER        | Remove gear from inventory |
| GET    | `/orders`          | Query: `{ page?, limit?, status? }`                                                       | PROVIDER        | Get provider's orders      |
| GET    | `/orders/:orderId` | –                                                                                         | PROVIDER, ADMIN | Get order by ID            |
| PATCH  | `/orders/:orderId` | `{ status: "CONFIRMED" \| "PICKED_UP" \| "RETURNED" }`                                    | PROVIDER        | Update order status        |

### Gears (`/api/gears`)

| Method | Endpoint           | Body/Query                                                                                        | Auth | Description      |
| ------ | ------------------ | ------------------------------------------------------------------------------------------------- | ---- | ---------------- |
| GET    | `/`                | Query: `{ page?, limit?, category?, minPrice?, maxPrice?, brand?, search?, sortBy?, sortOrder? }` | No   | Browse all gears |
| GET    | `/:gearId`         | –                                                                                                 | No   | Get gear details |
| GET    | `/:gearId/reviews` | Query: `{ page?, limit?, sortBy?, sortOrder? }`                                                   | No   | Get gear reviews |

### Categories (`/api/categories`)

| Method | Endpoint | Body/Query | Auth | Description        |
| ------ | -------- | ---------- | ---- | ------------------ |
| GET    | `/`      | –          | No   | Get all categories |

### Rentals (`/api/rentals`)

| Method | Endpoint          | Body/Query                                                  | Auth            | Description          |
| ------ | ----------------- | ----------------------------------------------------------- | --------------- | -------------------- |
| POST   | `/`               | `{ startDate, endDate, items: [{ gearItemId, quantity }] }` | CUSTOMER        | Create rental order  |
| GET    | `/`               | Query: `{ page?, limit?, status?, sortBy?, sortOrder? }`    | CUSTOMER, ADMIN | Get customer rentals |
| GET    | `/:rentalId`      | –                                                           | CUSTOMER, ADMIN | Get rental by ID     |
| PATCH  | `/:rentId/cancel` | –                                                           | CUSTOMER        | Cancel rental        |

### Payments (`/api/payments`)

| Method | Endpoint      | Body/Query                                               | Auth     | Description              |
| ------ | ------------- | -------------------------------------------------------- | -------- | ------------------------ |
| POST   | `/create`     | `{ rentalOrderId }`                                      | CUSTOMER | Initiate payment         |
| POST   | `/confirm`    | Query: `{ orderId, tranId, status }`                     | No       | Confirm payment callback |
| GET    | `/`           | Query: `{ page?, limit?, status?, sortBy?, sortOrder? }` | CUSTOMER | Get payment history      |
| GET    | `/:paymentId` | –                                                        | CUSTOMER | Get payment by ID        |

### Reviews (`/api/reviews`)

| Method | Endpoint     | Body/Query                           | Auth     | Description      |
| ------ | ------------ | ------------------------------------ | -------- | ---------------- |
| POST   | `/`          | `{ rentalOrderId, rating, comment }` | CUSTOMER | Create review    |
| GET    | `/:reviewId` | –                                    | CUSTOMER | Get review by ID |
| PATCH  | `/:reviewId` | `{ rating?, comment? }`              | CUSTOMER | Update review    |
| DELETE | `/:reviewId` | –                                    | CUSTOMER | Delete review    |

## Error Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errorDetails": "Stack trace (development only)"
}
```

### Common HTTP Status Codes Used

| Code | Meaning               | When                            |
| ---- | --------------------- | ------------------------------- |
| 200  | OK                    | Successful GET/PATCH/DELETE     |
| 201  | Created               | Successful POST                 |
| 400  | Bad Request           | Validation error, invalid input |
| 401  | Unauthorized          | Missing or invalid token        |
| 403  | Forbidden             | Insufficient role/permissions   |
| 404  | Not Found             | Resource not found              |
| 409  | Conflict              | Duplicate resource              |
| 500  | Internal Server Error | Unhandled server error          |

## Author

- Rezoan Shakil Prince
- Senior Software Engineer (SSE)
- BJIT Ltd
