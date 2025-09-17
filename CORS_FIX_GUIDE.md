# Fix CORS Error - Step by Step Guide

## The Problem
You're getting a CORS error because your Google Apps Script is not properly configured to handle requests from web browsers. This is a common issue when the script is not deployed as a web app with the correct permissions.

## Solution: Redeploy Your Google Apps Script

### Step 1: Update Your Google Apps Script Code
1. Go to [script.google.com](https://script.google.com)
2. Open your waitlist project
3. **Replace ALL the existing code** with the code from `GOOGLE_APPS_SCRIPT_FIXED.js`
4. **Save the project** (Ctrl+S)

### Step 2: Deploy as a New Web App
1. In your Apps Script project, click **"Deploy"** → **"New deployment"**
2. Click the **gear icon ⚙️** next to "Type" and select **"Web app"**
3. Set the following:
   - **Execute as**: Me (your email)
   - **Who has access**: **Anyone** (this is crucial!)
4. Click **"Deploy"**
5. **Copy the new web app URL** (it will look like: `https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec`)

### Step 3: Update Your Code with the New URL
1. Open `src/config/waitlist.ts`
2. Replace the URL with your new deployment URL:
   ```typescript
   export const GOOGLE_SCRIPT_URL = 'YOUR_NEW_DEPLOYMENT_URL';
   ```

### Step 4: Test the Fix
1. **Test with the HTML file first**:
   - Open `test-waitlist.html` in your browser
   - Update the URL in the file to match your new deployment URL
   - Fill out the form and submit
   - You should see a success message

2. **Test with your React app**:
   - Go to your website
   - Fill out the waitlist form
   - Check if data appears in your Google Sheet

## Why This Fixes the CORS Error

The CORS error occurs because:
1. **Your script wasn't deployed as a web app** - it was just a regular script
2. **The script didn't have "Anyone" access** - it was restricted to your account only
3. **The script didn't handle OPTIONS requests** - needed for CORS preflight

The fixed version:
- ✅ Handles both POST and OPTIONS requests
- ✅ Is deployed as a web app with "Anyone" access
- ✅ Properly handles CORS headers

## Important Notes

- **You MUST create a NEW deployment** - don't just update the existing one
- **The "Anyone" access setting is crucial** - without it, browsers can't access the script
- **Make sure to copy the NEW URL** - the old URL won't work

## If You Still Get CORS Errors

1. **Double-check the deployment settings**:
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone

2. **Try a different browser** or **incognito mode**

3. **Clear your browser cache**

4. **Make sure you're using the NEW deployment URL**

## Test Checklist

- [ ] Updated Google Apps Script code
- [ ] Created new web app deployment
- [ ] Set "Anyone" access
- [ ] Copied new deployment URL
- [ ] Updated `src/config/waitlist.ts` with new URL
- [ ] Test with `test-waitlist.html` works
- [ ] Test with React app works
- [ ] Data appears in Google Sheet

Once you complete these steps, the CORS error should be resolved and your waitlist form should work perfectly!
