# Alternative to Google Apps Script - Formspree

Since Google Apps Script requires Google account authentication, here's a simpler alternative using Formspree.

## Why Formspree?
- ✅ No Google account required
- ✅ No CORS issues
- ✅ Free tier available
- ✅ Easy setup
- ✅ Data goes to your email + dashboard

## Setup Steps

### Step 1: Create Formspree Account
1. Go to [formspree.io](https://formspree.io)
2. Sign up for a free account
3. Create a new form
4. Copy your form endpoint URL

### Step 2: Update Your Code
Replace the Google Apps Script URL with your Formspree URL in `src/config/waitlist.ts`:

```typescript
export const GOOGLE_SCRIPT_URL = 'https://formspree.io/f/YOUR_FORM_ID';
```

### Step 3: Update the Form Data Format
Formspree expects a different data format. Update `src/components/WaitlistModal.tsx`:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    // Formspree expects form data, not JSON
    const formData = new FormData();
    formData.append('email', formData.email);
    formData.append('firstName', formData.firstName);
    formData.append('lastName', formData.lastName);
    formData.append('phone', formData.phone || '');
    formData.append('interest', formData.interest);
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
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

## Other Alternatives

### Option 2: Netlify Forms
If you're hosting on Netlify, you can use Netlify Forms:
- Add `netlify` attribute to your form
- No server-side code needed
- Data goes to Netlify dashboard

### Option 3: Airtable
- Create an Airtable base
- Use Airtable API
- More control over data structure

### Option 4: Email Service
- Use EmailJS to send emails directly
- No database needed
- Data goes to your email

## Recommendation

For the quickest fix, I recommend **Formspree** because:
1. It's free
2. No CORS issues
3. No Google account required
4. Easy to set up
5. You get email notifications

Would you like me to help you set up Formspree, or would you prefer to try the Google Apps Script with "Anyone with Google account" first?
