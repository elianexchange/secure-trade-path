import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Lock, 
  Eye, 
  EyeOff,
  Loader2, 
  AlertCircle,
  Shield,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const passwordRequirements = [
  { text: "At least 8 characters long", check: (password: string) => password.length >= 8 },
  { text: "Contains uppercase letter", check: (password: string) => /[A-Z]/.test(password) },
  { text: "Contains lowercase letter", check: (password: string) => /[a-z]/.test(password) },
  { text: "Contains number", check: (password: string) => /\d/.test(password) },
];

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const resetToken = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchedPassword = watch('newPassword', '');

  useEffect(() => {
    if (!resetToken) {
      toast.error('Invalid or missing reset token');
      navigate('/forgot-password');
    }
  }, [resetToken, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!resetToken) {
      toast.error('Invalid reset token');
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.setNewPassword(resetToken, data.newPassword);
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
                
                <h2 className="text-2xl font-bold text-foreground mb-2">Password Reset Complete</h2>
                <p className="text-muted-foreground mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
        onClick={() => navigate('/forgot-password')}
        className="fixed top-6 left-6 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white/90 transition-all duration-200 shadow-sm z-50 p-2 rounded-full border border-gray-200/50"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      
      {/* Left Side - Security Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative overflow-hidden">
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
                Create a strong, secure password to protect your account. 
                Your security is our top priority.
              </p>
            </div>
            
            {/* Security Features */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-white/80" />
                <div>
                  <div className="text-sm font-medium">Bank-Grade Security</div>
                  <div className="text-xs text-white/70">256-bit encryption</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-white/80" />
                <div>
                  <div className="text-sm font-medium">Secure Reset Process</div>
                  <div className="text-xs text-white/70">Verified identity required</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
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

          {/* Reset Password Form */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Set New Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a strong password to secure your account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      className="pl-10 pr-12 h-11 border-2 focus:border-primary transition-colors"
                      {...register('newPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 hover:bg-muted"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.newPassword.message}
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      className="pl-10 pr-12 h-11 border-2 focus:border-primary transition-colors"
                      {...register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 hover:bg-muted"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword.message}
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                {watchedPassword && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Password Requirements:</p>
                    <div className="space-y-1">
                      {passwordRequirements.map((requirement, index) => {
                        const isValid = requirement.check(watchedPassword);
                        return (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isValid ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              {isValid && <CheckCircle className="h-3 w-3 text-green-600" />}
                            </div>
                            <span className={isValid ? 'text-green-700' : 'text-muted-foreground'}>
                              {requirement.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
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
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Your password is encrypted and stored securely
            </p>
            <div className="flex justify-center items-center space-x-4 opacity-60">
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">AES-256</span>
              </div>
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">bcrypt</span>
              </div>
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
