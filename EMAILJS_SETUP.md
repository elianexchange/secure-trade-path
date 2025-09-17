# EmailJS Setup for Waitlist Emails

## What is EmailJS?
EmailJS allows you to send emails directly from your frontend without a backend server. It's perfect for waitlist confirmations.

## Setup Steps

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://emailjs.com)
2. Sign up for a free account
3. Create a new service (Gmail, Outlook, etc.)

### Step 2: Get Your Credentials
1. Go to "Account" → "General"
2. Copy your **Public Key**
3. Go to "Email Services" and copy your **Service ID**
4. Go to "Email Templates" and create a template with **Template ID**

### Step 3: Update Your Code
Add EmailJS to your project:

```bash
npm install @emailjs/browser
```

### Step 4: Create Email Configuration
Create `src/config/email.ts`:

```typescript
export const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',
  SERVICE_ID: 'YOUR_SERVICE_ID',
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID'
};
```

### Step 5: Update WaitlistModal
Add email sending to your form submission:

```typescript
import emailjs from '@emailjs/browser';

const sendWelcomeEmail = async (formData: any) => {
  try {
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      {
        to_email: formData.email,
        to_name: `${formData.firstName} ${formData.lastName}`,
        from_name: 'Tranzio Team',
        message: 'Welcome to the Tranzio waitlist!'
      },
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    console.log('Welcome email sent successfully!');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};
```

## Email Template Variables
Use these variables in your EmailJS template:
- `{{to_name}}` - User's full name
- `{{to_email}}` - User's email
- `{{from_name}}` - Your name/company
- `{{message}}` - Custom message

## Benefits of EmailJS
- ✅ Free tier available
- ✅ No backend required
- ✅ Easy integration
- ✅ Reliable delivery
- ✅ Custom templates

## Recommendation
For a waitlist, I recommend starting with **Formspree's auto-responder** (Option 1) as it's:
- Already set up
- Free
- No additional code needed
- Reliable

Would you like me to help you set up the Formspree auto-responder, or would you prefer the EmailJS integration?
