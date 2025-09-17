# 🚀 Google Sheets Waitlist Setup - Quick Start

## ✅ What's Done
- ✅ Form code updated to send data to Google Sheets
- ✅ Configuration file created (`src/config/waitlist.ts`)
- ✅ Error handling added
- ✅ Console logging for debugging

## 📋 Step-by-Step Setup

### 1. Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create new spreadsheet
3. Name it "Tranzio Waitlist"
4. Add headers in row 1:
   ```
   A1: Timestamp    B1: Email    C1: First Name
   D1: Last Name    E1: Phone    F1: Interest
   ```

### 2. Set up Google Apps Script
1. In your Google Sheet: **Extensions** → **Apps Script**
2. Delete all existing code
3. Paste this code:
```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      new Date(),
      data.email,
      data.firstName,
      data.lastName,
      data.phone || '',
      data.interest
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
4. Click **Save** (Ctrl+S)
5. Click **Deploy** → **New Deployment**
6. Choose **Web app**
7. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
8. Click **Deploy**
9. **COPY THE WEB APP URL** (looks like: `https://script.google.com/macros/s/...`)

### 3. Update Your Code
1. Open `src/config/waitlist.ts`
2. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with your actual URL:
```typescript
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_URL/exec';
```

### 4. Test It!
1. Start your dev server: `npm run dev`
2. Open your website
3. Fill out the waitlist form
4. Check your Google Sheet - data should appear immediately!

## 🔍 Troubleshooting

### If data doesn't appear:
1. Check browser console (F12) for errors
2. Make sure the Google Script URL is correct
3. Verify the Google Apps Script is deployed as "Anyone"
4. Check that the sheet headers match exactly

### Common Issues:
- **CORS Error**: Make sure Google Script is deployed with "Anyone" access
- **404 Error**: Double-check the Google Script URL
- **Permission Error**: Make sure you're logged into the correct Google account

## 📊 Viewing Your Data

Once set up, every waitlist submission will automatically appear in your Google Sheet with:
- Timestamp of submission
- Email address
- First and last name
- Phone number (if provided)
- Interest type (Individual/Business/Marketplace)

## 🎉 You're Done!

Your waitlist form now captures all user data directly to Google Sheets. No backend server needed!

## Next Steps (Optional):
- Set up email notifications when new signups occur
- Create charts and analytics in Google Sheets
- Export data to CSV for other tools
- Set up automated email sequences
