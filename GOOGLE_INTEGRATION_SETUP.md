# Google Authentication & Notifications Integration Setup

This guide will help you integrate Google OAuth authentication and Google-based notifications into your Tranzio application without breaking the existing system.

## 🔧 Prerequisites

1. **Google Cloud Console Account**
2. **Gmail API Access**
3. **OAuth 2.0 Credentials**

## 📋 Step-by-Step Setup

### 1. Google Cloud Console Setup

#### A. Create a New Project (or use existing)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID**

#### B. Enable Required APIs
1. Go to **APIs & Services** > **Library**
2. Enable the following APIs:
   - **Google+ API** (for user profile data)
   - **Gmail API** (for sending notifications)
   - **Google Identity** (for OAuth)

#### C. Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web Application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
5. Copy the **Client ID** and **Client Secret**

### 2. Environment Variables Setup

#### Frontend (.env)
```bash
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# API Configuration
VITE_API_URL=https://your-backend-url.com
```

#### Backend (.env)
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-frontend-url.com/auth/google/callback

# Frontend URL for email links
FRONTEND_URL=https://your-frontend-url.com

# Existing variables (keep these)
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
# ... other existing variables
```

### 3. Database Migration

Run the following command to update your database schema:

```bash
cd tranzio-backend
npx prisma migrate dev --name add_google_auth_fields
npx prisma generate
```

### 4. Install Required Dependencies

#### Frontend
```bash
npm install google-auth-library
```

#### Backend
```bash
npm install googleapis google-auth-library
```

### 5. Gmail API Setup (for notifications)

#### A. Create Service Account
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Download the JSON key file
4. Store it securely (e.g., in your backend environment)

#### B. Enable Domain-wide Delegation (Optional)
If you want to send emails on behalf of users:
1. In Service Account settings, enable **Domain-wide Delegation**
2. Add the service account to your Google Workspace domain

## 🚀 Features Included

### 1. Google OAuth Authentication
- **Login with Google**: Users can sign in using their Google account
- **Signup with Google**: New users can create accounts via Google
- **Account Linking**: Existing users can link their Google account
- **Profile Sync**: Automatically syncs name, email, and profile picture

### 2. Google-based Notifications
- **Gmail Integration**: Send notifications via Gmail API
- **Rich HTML Emails**: Beautiful, responsive email templates
- **Transaction Notifications**: Real-time email notifications for:
  - Transaction created
  - Transaction joined
  - Payment updates
  - Dispute alerts
  - Message notifications
  - System alerts

### 3. Preserved Existing System
- **Backward Compatibility**: All existing auth methods still work
- **Dual Authentication**: Users can use both email/password and Google
- **Seamless Integration**: No breaking changes to existing functionality

## 📧 Email Notification Templates

The system includes professional email templates for:

### Transaction Lifecycle
- **Transaction Created**: Welcome email with transaction details
- **Transaction Joined**: Notification when counterparty joins
- **Payment Confirmed**: Payment status updates
- **Item Shipped**: Shipping notifications
- **Transaction Completed**: Completion confirmations

### System Notifications
- **Welcome Email**: New user onboarding
- **Security Alerts**: Important security notifications
- **Account Updates**: Profile and settings changes

### Dispute Notifications
- **Dispute Opened**: Alert when dispute is raised
- **Dispute Resolved**: Resolution notifications
- **Evidence Submitted**: Evidence submission alerts

## 🔒 Security Features

### 1. OAuth 2.0 Security
- **Secure Token Exchange**: JWT tokens for API authentication
- **Token Refresh**: Automatic token refresh handling
- **Scope Limitation**: Minimal required permissions

### 2. Data Protection
- **Encrypted Storage**: Sensitive data encrypted at rest
- **Secure Transmission**: HTTPS for all communications
- **Privacy Compliance**: GDPR and privacy-friendly implementation

### 3. Access Control
- **Role-based Access**: Maintains existing role system
- **Permission Validation**: Proper permission checks
- **Audit Logging**: Comprehensive activity logging

## 🧪 Testing

### 1. Local Development
```bash
# Start backend
cd tranzio-backend
npm run dev

# Start frontend
cd secure-trade-path
npm run dev
```

### 2. Test Google Sign-In
1. Navigate to login page
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify user creation/login

### 3. Test Email Notifications
1. Create a transaction
2. Check Gmail for notification
3. Verify email content and formatting

## 🚨 Troubleshooting

### Common Issues

#### 1. "Google Sign-In not working"
- Check Google Client ID configuration
- Verify redirect URIs match exactly
- Ensure Google APIs are enabled

#### 2. "Email notifications not sending"
- Verify Gmail API is enabled
- Check service account permissions
- Ensure proper OAuth scopes

#### 3. "Database errors"
- Run Prisma migrations
- Check database connection
- Verify schema updates

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=google:*
```

## 📚 API Endpoints

### Google Authentication
- `POST /api/google/auth` - Authenticate with Google
- `GET /api/google/linked/:userId` - Check Google link status
- `DELETE /api/google/unlink/:userId` - Unlink Google account

### Email Notifications
- Integrated with existing notification system
- Automatic email sending for all notification types
- Rich HTML templates with transaction details

## 🔄 Migration Strategy

### Phase 1: Setup (No Breaking Changes)
1. Add Google OAuth to login/signup pages
2. Implement backend Google auth service
3. Add database fields for Google integration

### Phase 2: Email Integration
1. Integrate Gmail API for notifications
2. Create email templates
3. Test notification delivery

### Phase 3: Enhancement
1. Add Google Calendar integration (optional)
2. Implement Google Drive file sharing (optional)
3. Add advanced Google Workspace features

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review Google Cloud Console logs
3. Check application logs
4. Verify environment variables

## 🎯 Next Steps

After successful integration:
1. **Monitor Usage**: Track Google sign-in adoption
2. **Optimize Templates**: Refine email templates based on user feedback
3. **Add Features**: Consider additional Google integrations
4. **Scale**: Monitor performance and scale as needed

---

**Note**: This integration maintains full backward compatibility with your existing authentication and notification systems. Users can continue using email/password authentication while also having the option to use Google OAuth.
