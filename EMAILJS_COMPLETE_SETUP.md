# Complete EmailJS Setup Guide for Waitlist Emails

## Step 1: Create EmailJS Account

1. **Go to [emailjs.com](https://emailjs.com)**
2. **Sign up for a free account**
3. **Verify your email address**

## Step 2: Set Up Email Service

1. **Go to "Email Services" in your dashboard**
2. **Click "Add New Service"**
3. **Choose your email provider** (Gmail, Outlook, etc.)
4. **Follow the setup instructions** for your email provider
5. **Copy your Service ID** (you'll need this)

## Step 3: Create Email Template

1. **Go to "Email Templates" in your dashboard**
2. **Click "Create New Template"**
3. **Use this HTML template**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Tranzio Waitlist</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Welcome to Tranzio! 🎉
            </h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                The future of secure trading
            </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                Hi {{to_name}},
            </h2>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for joining the Tranzio waitlist! We're excited to have you on board as we build the future of secure trading.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0;">
                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">
                    What to expect:
                </h3>
                <ul style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Early access to Tranzio when we launch</li>
                    <li>Exclusive updates on our progress</li>
                    <li>Special launch offers for waitlist members</li>
                    <li>Priority support during beta testing</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <div style="background-color: #667eea; color: #ffffff; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Expected Launch: Q2 2024
                </div>
            </div>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Stay connected with us and be the first to know about updates:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{social_x}}" style="background-color: #1da1f2; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 0 10px;">
                    Follow us on X
                </a>
                <a href="{{website_url}}" style="background-color: #667eea; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 0 10px;">
                    Visit Website
                </a>
            </div>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                Thanks for your patience and support. We can't wait to show you what we're building!
            </p>
            
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
                Best regards,<br>
                <strong>The Tranzio Team</strong>
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
            <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                You received this email because you joined the Tranzio waitlist.
            </p>
            <p style="color: #999999; font-size: 14px; margin: 0;">
                © 2024 Tranzio. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
```

4. **Set the subject line**: `Welcome to the Tranzio Waitlist! 🎉`
5. **Save the template and copy the Template ID**

## Step 4: Get Your Public Key

1. **Go to "Account" → "General" in your dashboard**
2. **Copy your Public Key**

## Step 5: Update Your Configuration

1. **Open `src/config/email.ts`**
2. **Replace the placeholder values**:
   ```typescript
   export const EMAILJS_CONFIG = {
     PUBLIC_KEY: 'your_actual_public_key',
     SERVICE_ID: 'your_actual_service_id',
     TEMPLATE_ID: 'your_actual_template_id'
   };
   ```

## Step 6: Test Your Setup

1. **Fill out the waitlist form**
2. **Check your email** for the welcome message
3. **Verify the template variables** are replaced correctly

## Template Variables Used

- `{{to_name}}` - User's full name (firstName + lastName)
- `{{to_email}}` - User's email address
- `{{social_x}}` - X/Twitter URL
- `{{website_url}}` - Your website URL
- `{{launch_date}}` - Expected launch date

## Free Tier Limits

- **200 emails per month** (free tier)
- **Unlimited templates**
- **All features included**

## Benefits

✅ **Professional design** - Rich HTML emails  
✅ **Easy customization** - Visual template editor  
✅ **Reliable delivery** - Good inbox placement  
✅ **No backend needed** - Works from frontend  
✅ **Free tier** - 200 emails/month  

## Next Steps

Once you have your EmailJS credentials, I'll update your waitlist form to automatically send welcome emails!
