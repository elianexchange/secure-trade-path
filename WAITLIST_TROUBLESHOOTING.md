# Waitlist Form Troubleshooting Guide

## Problem: Form shows "User joined waitlist successfully!" but no data appears in Google Sheets

This issue typically occurs when the Google Apps Script is not properly configured or deployed. Here's how to fix it:

## Step 1: Verify Google Apps Script Setup

### 1.1 Check Your Google Apps Script Code
1. Go to [script.google.com](https://script.google.com)
2. Open your waitlist project
3. Replace the existing code with the code from `GOOGLE_APPS_SCRIPT_CODE.js`
4. Save the project (Ctrl+S)

### 1.2 Test the Script
1. In the Apps Script editor, click on the function dropdown and select `testScript`
2. Click the "Run" button (▶️)
3. Check the "Execution log" for any errors
4. If successful, you should see a test entry in your Google Sheet

## Step 2: Verify Google Apps Script Deployment

### 2.1 Deploy as Web App
1. In your Apps Script project, click "Deploy" → "New deployment"
2. Click the gear icon ⚙️ next to "Type" and select "Web app"
3. Set the following:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. Click "Deploy"
5. Copy the web app URL (it should look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### 2.2 Update the URL in Your Code
1. Open `src/config/waitlist.ts`
2. Replace the URL with your new deployment URL:
   ```typescript
   export const GOOGLE_SCRIPT_URL = 'YOUR_NEW_DEPLOYMENT_URL';
   ```

## Step 3: Test the Integration

### 3.1 Use the Test File
1. Open `test-waitlist.html` in your browser
2. Fill out the form and click "Test Submit"
3. Check the result message for any errors

### 3.2 Check Browser Console
1. Open your website in a browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Fill out the waitlist form and submit
5. Look for any error messages or logs

## Step 4: Common Issues and Solutions

### Issue 1: "Bad Request Error 400"
**Cause**: The Google Apps Script is not deployed as a web app
**Solution**: Follow Step 2.1 to properly deploy the script

### Issue 2: "CORS Error" or "Network Error"
**Cause**: The script URL is incorrect or the script is not accessible
**Solution**: 
- Verify the URL in `src/config/waitlist.ts`
- Make sure the script is deployed with "Anyone" access
- Check that the script ID in the URL matches your deployment

### Issue 3: "Script function not found"
**Cause**: The script doesn't have a `doPost` function
**Solution**: Make sure you copied the complete code from `GOOGLE_APPS_SCRIPT_CODE.js`

### Issue 4: Data appears in wrong columns
**Cause**: The Google Sheet doesn't have the correct headers
**Solution**: 
1. Open your Google Sheet
2. Add these headers in the first row:
   - A1: Timestamp
   - B1: Email
   - C1: First Name
   - D1: Last Name
   - E1: Phone
   - F1: Interest

## Step 5: Verify Everything Works

1. **Test with the HTML file**: Use `test-waitlist.html` to verify the script works
2. **Test with your website**: Fill out the actual waitlist form
3. **Check the Google Sheet**: Verify data appears in the correct columns
4. **Check the console**: Look for any error messages

## Debugging Tips

### Enable Detailed Logging
The updated `WaitlistModal.tsx` now includes detailed console logging. Check your browser's console for:
- Form data being sent
- Response status and headers
- Any error messages

### Check Google Apps Script Logs
1. Go to your Apps Script project
2. Click "Executions" in the left sidebar
3. Look for recent executions and any error messages

### Test the Script Manually
1. In Apps Script, run the `testScript` function
2. Check if it successfully adds a test row to your sheet

## Still Having Issues?

If you're still experiencing problems:

1. **Double-check the URL**: Make sure it's the correct deployment URL
2. **Verify permissions**: Ensure the script is deployed with "Anyone" access
3. **Check the sheet**: Make sure you're looking at the correct Google Sheet
4. **Test with a new deployment**: Try creating a new deployment with a different name

## Quick Fix Checklist

- [ ] Google Apps Script code is correct (use `GOOGLE_APPS_SCRIPT_CODE.js`)
- [ ] Script is deployed as a web app
- [ ] Script has "Anyone" access
- [ ] URL in `src/config/waitlist.ts` is correct
- [ ] Google Sheet has proper headers
- [ ] Test with `test-waitlist.html` works
- [ ] Browser console shows no errors
