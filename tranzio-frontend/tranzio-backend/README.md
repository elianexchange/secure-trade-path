# Tranzio Backend API

Backend API for the Tranzio Escrow Trading Platform built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Registration, login, profile management
- **Escrow System**: Secure trading with payment protection
- **Real-time Updates**: WebSocket support for live notifications
- **File Uploads**: Support for item images and documents
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting, input validation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Zod schemas
- **Testing**: Jest + Supertest

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd tranzio-backend
npm install
```

### 2. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/tranzio_db"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:8080

# Security
BCRYPT_ROUNDS=12
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (admin only)

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item
- `GET /api/items/:id` - Get item by ID
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order status

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 🗄️ Database Schema

The platform uses the following main entities:

- **Users**: Buyers, vendors, and admins
- **Items**: Products available for sale
- **Orders**: Trading transactions with escrow protection
- **Transactions**: Payment and escrow operations
- **Notifications**: System alerts and updates
- **Messages**: Communication between parties
- **Disputes**: Conflict resolution system

## 🔐 Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🚧 Development Status

### ✅ Completed
- Project setup and configuration
- Database schema design
- Authentication system
- Basic route structure
- Middleware implementation

### 🚧 In Progress
- Core business logic implementation
- Escrow workflow
- Payment processing

### 📋 Planned
- Real-time features (WebSocket)
- File upload system
- Advanced search and filtering
- Email notifications
- Payment gateway integration

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Production Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:8080` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔗 Links

- **Frontend**: [Tranzio Frontend](../)
- **API Docs**: `http://localhost:3001/api`
- **Health Check**: `http://localhost:3001/health`
- **Prisma Studio**: `http://localhost:3001/db:studio`
