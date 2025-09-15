import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Icon and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-destructive p-3 rounded-full">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to access this page
          </p>
        </div>

        {/* Unauthorized Card */}
        <Card className="shadow-theme border-destructive/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Unauthorized Access</CardTitle>
            <CardDescription>
              Sorry, you don't have the required permissions to view this content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                This page requires specific user roles or permissions that you don't currently have.
              </p>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact support.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1 gap-2"
                asChild
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Link>
              </Button>
              <Button 
                className="flex-1 gap-2 bg-gradient-primary hover:bg-gradient-accent shadow-theme"
                asChild
              >
                <Link to="/">
                  <Home className="h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>

            {/* Support Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Need help? Contact our support team
              </p>
              <Button variant="link" className="text-xs p-0 h-auto text-primary hover:text-primary/80">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
