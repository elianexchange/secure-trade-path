// EmailJS Configuration
// Get these values from your EmailJS dashboard: https://dashboard.emailjs.com

export const EMAILJS_CONFIG = {
  // Your EmailJS public key (Account > General)
  PUBLIC_KEY: 'AxMpcFl3powwGLHYP',
  
  // Your EmailJS service ID (Email Services)
  SERVICE_ID: 'service_602g1r9',
  
  // Your EmailJS template ID (Email Templates)
  TEMPLATE_ID: 'template_j56i43p'
};

// Email template variables that will be replaced in your template
export const EMAIL_TEMPLATE_VARS = {
  to_name: '{{to_name}}',           // User's full name
  to_email: '{{to_email}}',         // User's email
  from_name: '{{from_name}}',       // Your company name
  company_name: '{{company_name}}', // Tranzio
  website_url: '{{website_url}}',   // Your website URL
  social_x: '{{social_x}}',         // X/Twitter URL
  launch_date: '{{launch_date}}'    // Expected launch date
};
