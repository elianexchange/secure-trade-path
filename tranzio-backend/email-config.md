# Email Configuration for Localhost Development

## Setup Instructions

### Option 1: Gmail SMTP (Recommended for testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Set environment variables**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   SMTP_FROM=Tranzio <noreply@tranzio.com>
   ```

### Option 2: Ethereal Email (No setup required)

If no SMTP credentials are provided, the system will automatically use Ethereal Email for testing. This is perfect for localhost development as it doesn't require real email credentials.

### Option 3: Other SMTP Providers

You can use any SMTP provider (SendGrid, Mailgun, etc.) by setting the appropriate environment variables.

## Testing Email Configuration

The system includes a test endpoint to verify email configuration:

```bash
curl -X POST http://localhost:4000/api/email/test
```

## Email Templates

The system includes beautiful HTML email templates for:
- Transaction created
- Transaction joined
- Payment released
- Identity verification complete
- General notifications

## Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Tranzio <noreply@tranzio.com>
TEST_EMAIL=test@example.com
```
