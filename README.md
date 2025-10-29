# Tranzio - Secure Escrow Platform

A comprehensive secure escrow trading platform built with React and Node.js, designed to protect online transactions in Nigeria.

## 🏗️ Project Structure

```
secure-trade-path/
├── tranzio-frontend/          # React frontend application
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── README.md              # Frontend documentation
├── tranzio-backend/           # Node.js backend API
│   ├── src/                   # Source code
│   ├── prisma/                # Database schema
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (for production)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/elianexchange/secure-trade-path.git
   cd secure-trade-path
   ```

2. **Start Frontend**
   ```bash
   cd tranzio-frontend
   npm install
   npm run dev
   ```

3. **Start Backend** (in a new terminal)
   ```bash
   cd tranzio-backend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📱 Features

- **Secure Escrow Trading**: Protect both buyers and sellers
- **Real-time Communication**: WebSocket-powered messaging
- **Mobile-First Design**: Optimized for mobile devices
- **Dispute Resolution**: Built-in dispute management system
- **Payment Protection**: Secure payment handling
- **User Authentication**: JWT-based authentication

## 🛠️ Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- React Router
- WebSocket

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- WebSocket

## 📦 Deployment

### Frontend (Netlify)
```bash
cd tranzio-frontend
npm run build
# Deploy to Netlify
```

### Backend (Render/Heroku)
```bash
cd tranzio-backend
npm run build
# Deploy to your preferred platform
```

## 🔧 Environment Variables

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend-url.com/api
VITE_WS_URL=https://your-backend-url.com
VITE_APP_NAME=Tranzio
```

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
PORT=3000
```

## 📚 Documentation

- [Frontend Documentation](./tranzio-frontend/README.md)
- [Backend Documentation](./tranzio-backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🌐 Live Application

- **Frontend**: https://tranzzio.netlify.app
- **Backend API**: https://tranzio-backend.onrender.com

## 📞 Support

For support, email support@tranzio.com or create an issue in this repository.
