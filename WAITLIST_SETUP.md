# Waitlist Data Capture Setup Guide

## Current Status
✅ Form data is now logged to browser console for testing
❌ No persistent storage yet

## Quick Test (Immediate)
1. Open your website in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Fill out and submit the waitlist form
5. You'll see the data logged like this:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "interest": "individual"
}
```

## Option 1: Google Sheets (Easiest - No Backend Required)

### Setup:
1. Create a new Google Sheet
2. Add headers: `Timestamp, Email, First Name, Last Name, Phone, Interest`
3. Go to Extensions > Apps Script
4. Replace the code with:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    new Date(),
    data.email,
    data.firstName,
    data.lastName,
    data.phone,
    data.interest
  ]);
  
  return ContentService.createTextOutput('Success');
}
```

5. Deploy as web app (Execute as: Me, Access: Anyone)
6. Copy the web app URL
7. Update the form to use this URL

### Update Form Code:
Replace the handleSubmit function in `WaitlistModal.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const response = await fetch('YOUR_GOOGLE_APPS_SCRIPT_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      console.log('Successfully added to waitlist!');
      setIsSubmitted(true);
      onSuccess?.();
    } else {
      throw new Error('Failed to submit');
    }
  } catch (error) {
    console.error('Error submitting waitlist:', error);
    alert('Failed to submit. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Option 2: Database with Backend API

### Using Supabase (Recommended):
1. Create account at supabase.com
2. Create new project
3. Create table:
```sql
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  interest VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

4. Get your API URL and anon key
5. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

6. Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

7. Update form submission:
```typescript
import { supabase } from '@/lib/supabase'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .insert([formData])
    
    if (error) throw error;
    
    console.log('Successfully added to waitlist!', data);
    setIsSubmitted(true);
    onSuccess?.();
  } catch (error) {
    console.error('Error submitting waitlist:', error);
    alert('Failed to submit. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Option 3: Email Service (ConvertKit, Mailchimp, etc.)

### Using ConvertKit:
1. Create ConvertKit account
2. Create a form and get the API key
3. Update form submission:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const response = await fetch('https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: 'YOUR_API_KEY',
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        fields: {
          phone: formData.phone,
          interest: formData.interest
        }
      })
    });
    
    if (response.ok) {
      console.log('Successfully added to waitlist!');
      setIsSubmitted(true);
      onSuccess?.();
    } else {
      throw new Error('Failed to submit');
    }
  } catch (error) {
    console.error('Error submitting waitlist:', error);
    alert('Failed to submit. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## Viewing Your Data

### Google Sheets:
- Data appears in your Google Sheet immediately
- Easy to export, filter, and analyze

### Supabase:
- Go to Table Editor in your Supabase dashboard
- View, filter, and export data
- Built-in analytics and insights

### ConvertKit:
- View subscribers in your ConvertKit dashboard
- Set up email sequences and automation

## Recommended Next Steps

1. **Start with Google Sheets** (easiest to set up)
2. **Test the form** to ensure data is captured
3. **Set up email notifications** when new signups occur
4. **Consider upgrading to Supabase** for more advanced features

## Security Notes

- Never expose API keys in frontend code
- Use environment variables for sensitive data
- Consider rate limiting for production
- Validate and sanitize all input data

Would you like me to help you implement any of these options?
