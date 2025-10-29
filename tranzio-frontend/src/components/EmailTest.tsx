import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { emailAPI } from '@/services/api';

export function EmailTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: '',
    message: ''
  });

  const handleTestConfiguration = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await emailAPI.testEmailConfiguration();
      setTestResult(result);
      
      if (result.success) {
        toast.success('Email configuration test successful!');
      } else {
        toast.error('Email configuration test failed');
      }
    } catch (error) {
      console.error('Email test error:', error);
      toast.error('Failed to test email configuration');
      setTestResult({
        success: false,
        message: 'Failed to test email configuration'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject || !customEmail.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await emailAPI.sendCustomEmail(customEmail);
      setTestResult(result);
      
      if (result.success) {
        toast.success('Custom email sent successfully!');
        setCustomEmail({ to: '', subject: '', message: '' });
      } else {
        toast.error('Failed to send custom email');
      }
    } catch (error) {
      console.error('Send email error:', error);
      toast.error('Failed to send custom email');
      setTestResult({
        success: false,
        message: 'Failed to send custom email'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5 text-blue-600" />
            Email Configuration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Test your email configuration to ensure notifications are working properly.
          </p>
          
          <Button 
            onClick={handleTestConfiguration}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Email Configuration'}
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              testResult.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="mr-2 h-5 w-5 text-green-600" />
            Send Test Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-to">To Email</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="recipient@example.com"
              value={customEmail.to}
              onChange={(e) => setCustomEmail(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              placeholder="Test Email Subject"
              value={customEmail.subject}
              onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-message">Message</Label>
            <Textarea
              id="email-message"
              placeholder="Enter your test message here..."
              rows={4}
              value={customEmail.message}
              onChange={(e) => setCustomEmail(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <Button 
            onClick={handleSendCustomEmail}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Test Email'}
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              testResult.success 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Configuration Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>For localhost development:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>If no SMTP credentials are provided, the system uses Ethereal Email for testing</li>
              <li>Ethereal Email provides preview URLs for testing without real email delivery</li>
              <li>Check the backend console for Ethereal Email preview URLs</li>
            </ul>
            
            <p className="mt-4"><strong>For production:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Set up Gmail SMTP with App Password</li>
              <li>Or use services like SendGrid, Mailgun, etc.</li>
              <li>Configure environment variables in your .env file</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
