// Google Apps Script Code for Waitlist Form
// Copy and paste this code into your Google Apps Script editor

function doPost(e) {
  try {
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Log the received data for debugging
    console.log('Received data:', data);
    
    // Validate required fields
    if (!data.email || !data.firstName || !data.lastName) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Missing required fields: email, firstName, lastName'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Prepare the row data
    const rowData = [
      new Date(), // Timestamp
      data.email,
      data.firstName,
      data.lastName,
      data.phone || '', // Phone is optional
      data.interest || 'individual' // Default to individual if not provided
    ];
    
    // Add the data to the sheet
    sheet.appendRow(rowData);
    
    // Log success
    console.log('Successfully added row:', rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data added successfully',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log the error
    console.error('Error processing request:', error);
    
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify the script works
function testScript() {
  const testData = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    interest: 'individual'
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  console.log('Test result:', result.getContent());
}
