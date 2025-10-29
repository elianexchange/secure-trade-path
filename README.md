# Tranzio Frontend

The frontend application for Tranzio - Nigeria's leading secure escrow trading platform.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file for local development:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
VITE_APP_NAME=Tranzio
```

## 📱 Features

- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: WebSocket integration
- **Secure Authentication**: JWT-based auth
- **Transaction Management**: Create and manage escrow transactions
- **Dispute Resolution**: Built-in dispute handling
- **PWA Support**: Progressive Web App capabilities

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── services/           # API services
├── utils/              # Utility functions
├── types/              # TypeScript types
└── lib/                # Library configurations
```

## 🎨 UI Components

Built with:
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **Lucide React** - Icons

## 🔗 API Integration

- **REST API**: Backend communication
- **WebSocket**: Real-time updates
- **File Upload**: Image and document handling

## 📦 Deployment

The frontend is deployed on Netlify:
- **URL**: https://tranzzio.netlify.app
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

- [Component Documentation](./src/components/README.md)
- [API Integration](./src/services/README.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 🤝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on mobile devices
4. Update documentation as needed

## 📄 License

This project is part of Tranzio and is licensed under the MIT License.