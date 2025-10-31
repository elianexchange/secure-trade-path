import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import GoogleSignIn from '@/components/GoogleSignIn';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock, 
  AlertCircle,
  Shield,
  CheckCircle,
  Users,
  Globe,
  Zap,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const trustFeatures = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your funds are protected with enterprise-level encryption and secure escrow services"
  },
  {
    icon: CheckCircle,
    title: "100% Verified",
    description: "Every transaction is verified and protected by our comprehensive verification system"
  },
  {
    icon: Users,
    title: "Trusted by Thousands",
    description: "Join over 50,000+ users who trust Tranzio for secure online transactions"
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Connect with buyers and sellers worldwide with our secure platform"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Complete transactions in minutes, not days with our streamlined process"
  }
];

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Auto-rotate carousel features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % trustFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      
      // Show immediate feedback
      toast.loading('Signing you in...', { id: 'login' });
      
      await login(data.email, data.password);
      
      // Success feedback
      toast.success('Successfully signed in!', { id: 'login' });
      
      // Navigate immediately for better UX
      navigate('/app/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide mobile-specific error messages
      let errorMessage = error.message || 'Failed to sign in';
      
      if (isMobile && error.message?.includes('Network connection failed')) {
        errorMessage = 'Please check your internet connection and try again. If the problem persists, try refreshing the page.';
      } else if (isMobile && error.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (isMobile && error.message?.includes('Invalid response format')) {
        errorMessage = 'Server response error. Please try again or refresh the page.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      
      toast.error(errorMessage, { id: 'login' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col lg:flex-row relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white/90 transition-all duration-200 shadow-sm z-50 p-2 rounded-full border border-gray-200/50"
        style={{ position: 'fixed', top: '24px', left: '24px' }}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      
      {/* Left Side - Trust Carousel */}
      <div className="hidden lg:flex lg:w-1/2 lg:h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-16 left-16 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-32 h-32 bg-white/15 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/15 rounded-full blur-xl animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white px-12">
          {/* Trust Features Carousel */}
          <div className="text-center max-w-sm">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {(() => {
                  const IconComponent = trustFeatures[currentFeature].icon;
                  return <IconComponent className="h-12 w-12 text-white/90" />;
                })()}
              </div>
              <h2 className="text-xl font-bold mb-2">{trustFeatures[currentFeature].title}</h2>
              <p className="text-base text-white/90 leading-relaxed">
                {trustFeatures[currentFeature].description}
              </p>
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center space-x-2 mb-4">
              {trustFeatures.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentFeature 
                      ? 'bg-white w-6' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Trust Stats */}
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-xl font-bold">50K+</div>
              <div className="text-xs text-white/70">Active Users</div>
            </div>
            <div>
              <div className="text-xl font-bold">₦2B+</div>
              <div className="text-xs text-white/70">Protected</div>
            </div>
            <div>
              <div className="text-xl font-bold">99.9%</div>
              <div className="text-xs text-white/70">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 lg:h-screen lg:overflow-hidden min-h-0">
        <div className="w-full max-w-sm lg:max-w-md space-y-4 sm:space-y-6 flex-shrink-0">
          {/* Logo Header - Visible on all screens */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tranzio</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back to secure trading</p>
          </div>

          {/* Login Form */}
          <Card className="border border-gray-300 bg-white">
            <CardContent className="pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-sm text-gray-600 mt-1.5 sm:mt-2">
                  Access your secure escrow account
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-11 h-12 text-base border-gray-300 focus:border-blue-500"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email.message}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-11 pr-12 h-12 text-base border-gray-300 focus:border-blue-500"
                      {...register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
                    </div>
                  )}
                  <div className="text-right">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <GoogleSignIn 
                  onSuccess={() => {
                    toast.success('Successfully signed in with Google!');
                    navigate('/app/dashboard');
                  }}
                  onError={(error) => {
                    console.error('Google Sign-In error:', error);
                  }}
                  buttonText="Sign in with Google"
                  className="w-full"
                />

              </form>

              {/* Links Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                  >
                    Sign up now
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
