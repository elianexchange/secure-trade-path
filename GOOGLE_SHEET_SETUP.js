// Google Apps Script to set up your Google Sheet with proper headers
// Run this function once to set up your sheet

function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Set up headers in the first row
  const headers = [
    'Timestamp',
    'Email', 
    'First Name',
    'Last Name',
    'Phone',
    'Interest'
  ];
  
  // Clear the sheet and add headers
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format the header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f0f0f0');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  console.log('Sheet setup complete! Headers added:', headers);
}
