import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Mail, 
  Loader2, 
  AlertCircle,
  Shield,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const securityFeatures = [
  {
    icon: Shield,
    title: "Secure Reset Process",
    description: "Your password reset is protected with bank-grade security measures"
  },
  {
    icon: CheckCircle,
    title: "Verified Identity",
    description: "We verify your identity before allowing password changes"
  }
];

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await authAPI.resetPassword(data.email);
      setIsEmailSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => navigate('/login')}
            className="mb-6 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white/90 transition-all duration-200 shadow-sm p-2 rounded-full border border-gray-200/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h2>
                <p className="text-muted-foreground mb-6">
                  We've sent a password reset link to your email address. 
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Didn't receive the email? Check your spam folder or</p>
                  </div>
                  
                  <Button
                    onClick={() => setIsEmailSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  
                  <div className="text-sm">
                    <Link 
                      to="/login" 
                      className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex overflow-hidden relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/login')}
        className="fixed top-6 left-6 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white/90 transition-all duration-200 shadow-sm z-50 p-2 rounded-full border border-gray-200/50"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      
      {/* Left Side - Security Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-16 left-16 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-32 h-32 bg-white/15 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/15 rounded-full blur-xl animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white px-12">
          <div className="text-center max-w-sm">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-white/90" />
              </div>
              <h2 className="text-xl font-bold mb-2">Secure Password Reset</h2>
              <p className="text-base text-white/90 leading-relaxed">
                Your account security is our priority. We'll help you reset your password safely and securely.
              </p>
            </div>
            
            {/* Security Features */}
            <div className="space-y-4">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5 text-white/80" />
                    <div>
                      <div className="text-sm font-medium">{feature.title}</div>
                      <div className="text-xs text-white/70">{feature.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm lg:max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tranzio</h1>
            <p className="text-sm text-muted-foreground">Reset your password securely</p>
          </div>

          {/* Forgot Password Form */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Forgot Password?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email address and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10 h-11 border-2 focus:border-primary transition-colors"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Links */}
                <div className="text-center space-y-3">
                  <div className="text-sm">
                    Remember your password?{' '}
                    <Link 
                      to="/login" 
                      className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                    >
                      Sign in
                    </Link>
                  </div>
                  <div className="text-sm">
                    Don't have an account?{' '}
                    <Link 
                      to="/signup" 
                      className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Your password reset link will expire in 1 hour for security
            </p>
            <div className="flex justify-center items-center space-x-4 opacity-60">
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">SSL</span>
              </div>
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">256-bit</span>
              </div>
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">AES</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
