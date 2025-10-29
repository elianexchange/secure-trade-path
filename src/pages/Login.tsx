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
    <div className="min-h-screen h-screen bg-gradient-to-br from-background via-background to-muted/20 flex overflow-hidden relative">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 hover:bg-white/90 transition-all duration-200 shadow-sm z-50 p-2 rounded-full border border-gray-200/50"
        style={{ position: 'fixed', top: '24px', left: '24px' }}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      
      {/* Left Side - Trust Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
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
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm lg:max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tranzio</h1>
            <p className="text-sm text-muted-foreground">Welcome back to secure trading</p>
          </div>

          {/* Login Form */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Sign In</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Access your secure escrow account
                </p>
                {isMobile && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>Mobile users:</strong> If you're having trouble logging in, try refreshing the page or check your internet connection.
                    </p>
                  </div>
                )}
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
                      placeholder="Enter your email"
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

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-12 h-11 border-2 focus:border-primary transition-colors"
                      {...register('password')}
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
                  {errors.password && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password.message}
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
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

                {/* Links */}
                <div className="text-center space-y-3">
                  <div className="text-sm">
                    Don't have an account?{' '}
                    <Link 
                      to="/signup" 
                      className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                    >
                      Sign up now
                    </Link>
                  </div>
                  <div className="text-sm">
                    <Link 
                      to="/forgot-password" 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">Trusted by leading financial institutions</p>
            <div className="flex justify-center items-center space-x-4 opacity-60">
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">PCI DSS</span>
              </div>
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">SOC 2</span>
              </div>
              <div className="w-14 h-7 bg-muted rounded flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground">ISO 27001</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
