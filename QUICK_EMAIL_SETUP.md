# Quick Email Setup - 5 Minutes

## What I've Done ✅

1. **Installed EmailJS** - Added `@emailjs/browser` package
2. **Created email configuration** - `src/config/email.ts`
3. **Updated waitlist form** - Added automatic email sending
4. **Created beautiful email template** - Professional HTML design
5. **Added error handling** - Won't break if email fails

## What You Need to Do (5 minutes)

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://emailjs.com)
2. Sign up (free)
3. Verify your email

### Step 2: Set Up Email Service
1. Go to "Email Services" → "Add New Service"
2. Choose Gmail/Outlook (whatever you use)
3. Follow setup instructions
4. Copy your **Service ID**

### Step 3: Create Email Template
1. Go to "Email Templates" → "Create New Template"
2. Copy the HTML template from `EMAILJS_COMPLETE_SETUP.md`
3. Set subject: `Welcome to the Tranzio Waitlist! 🎉`
4. Copy your **Template ID**

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key**

### Step 5: Update Configuration
1. Open `src/config/email.ts`
2. Replace the placeholder values:
   ```typescript
   export const EMAILJS_CONFIG = {
     PUBLIC_KEY: 'your_actual_public_key',
     SERVICE_ID: 'your_actual_service_id', 
     TEMPLATE_ID: 'your_actual_template_id'
   };
   ```

## That's It! 🎉

Once you update the configuration:
- ✅ **Form submissions** go to Formspree (for your records)
- ✅ **Welcome emails** are sent automatically via EmailJS
- ✅ **Beautiful HTML emails** with your branding
- ✅ **200 emails/month free** (more than enough for waitlist)

## Test It

1. Fill out the waitlist form
2. Check your email for the welcome message
3. Verify the template looks good

## Need Help?

The complete setup guide is in `EMAILJS_COMPLETE_SETUP.md` with detailed instructions and the HTML email template.
