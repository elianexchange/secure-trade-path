# Update Your EmailJS Template with Tranzio Branding

## Step 1: Go to EmailJS Dashboard

1. **Open [dashboard.emailjs.com](https://dashboard.emailjs.com)**
2. **Go to "Email Templates"**
3. **Click on your template** (template_j56i43p)

## Step 2: Update the Template

### Subject Line
Set the subject to:
```
Welcome to the Tranzio Waitlist! 🎉
```

### HTML Content
Copy and paste this HTML into your template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Tranzio Waitlist</title>
    <style>
        body {
            font-family: 'Open Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: #4c11c2;
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        
        .header p {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin: 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .features-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 30px 0;
        }
        
        .features-box h3 {
            color: #4c11c2;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        
        .features-list {
            list-style: none;
            padding: 0;
        }
        
        .features-list li {
            color: #4a5568;
            font-size: 15px;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .features-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #4c11c2;
            font-weight: bold;
        }
        
        .launch-badge {
            text-align: center;
            margin: 40px 0;
        }
        
        .badge {
            display: inline-block;
            background: #4c11c2;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
        }
        
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-section p {
            color: #4a5568;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .cta-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .cta-button {
            display: inline-block;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
        }
        
        .cta-button.primary {
            background: #4c11c2;
            color: white;
        }
        
        .cta-button.secondary {
            background: #f8fafc;
            color: #4c11c2;
            border: 2px solid #e2e8f0;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #718096;
            font-size: 14px;
            margin: 0 0 8px 0;
        }
        
        .company {
            color: #4c11c2;
            font-weight: 600;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .cta-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .cta-button {
                width: 100%;
                max-width: 280px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <h1>Welcome to Tranzio! 🎉</h1>
            <p>The future of secure trading</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">Hi {{to_name}},</div>
            
            <div class="message">
                Thank you for joining the Tranzio waitlist! We're thrilled to have you on board as we build the future of secure trading. Your trust means everything to us.
            </div>
            
            <div class="features-box">
                <h3>✨ What to expect as a waitlist member:</h3>
                <ul class="features-list">
                    <li>Early access to Tranzio when we launch</li>
                    <li>Exclusive updates on our development progress</li>
                    <li>Special launch offers reserved for waitlist members</li>
                    <li>Priority support during our beta testing phase</li>
                    <li>Direct line to our team for feedback and suggestions</li>
                </ul>
            </div>
            
            <div class="launch-badge">
                <div class="badge">Expected Launch: {{launch_date}}</div>
            </div>
            
            <div class="cta-section">
                <p>Stay connected and be the first to know about updates:</p>
                <div class="cta-buttons">
                    <a href="{{social_x}}" class="cta-button primary">Follow us on X</a>
                    <a href="{{website_url}}" class="cta-button secondary">Visit Website</a>
                </div>
            </div>
            
            <div class="message">
                We're working hard to create something truly special for the trading community. Your patience and support mean the world to us.
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #4a5568; font-size: 16px; margin: 0;">
                    Best regards,<br>
                    <strong style="color: #4c11c2;">The Tranzio Team</strong>
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>You received this email because you joined the Tranzio waitlist.</p>
            <p>© 2024 <span class="company">Tranzio</span>. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

## Step 3: Save and Test

1. **Save the template**
2. **Test with your waitlist form**
3. **Check your email** for the new design

## Template Features

✅ **Tranzio Branding** - Uses your exact colors (#4c11c2, #7c3aed)  
✅ **Professional Design** - Clean, modern layout  
✅ **Mobile Responsive** - Looks great on all devices  
✅ **Tranzio Logo** - SVG logo in the header  
✅ **Consistent Typography** - Open Sans font family  
✅ **Call-to-Action Buttons** - Links to X and website  
✅ **Feature List** - Highlights waitlist benefits  
✅ **Launch Date Badge** - Shows expected launch  

## Template Variables Used

- `{{to_name}}` - User's full name
- `{{to_email}}` - User's email (for recipient field)
- `{{social_x}}` - X/Twitter URL
- `{{website_url}}` - Your website URL
- `{{launch_date}}` - Expected launch date

The template now perfectly matches your website's design system and branding! 🎉
