import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import GoogleSignIn from '@/components/GoogleSignIn';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  Lock, 
  User,
  AlertCircle,
  Shield,
  CheckCircle,
  Users,
  Globe,
  Zap,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  ArrowLeft
} from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupFormData = z.infer<typeof signupSchema>;

const platformBenefits = [
  {
    icon: Shield,
    title: "Escrow Protection",
    description: "Your money is held securely until you're satisfied with your purchase"
  },
  {
    icon: CheckCircle,
    title: "Verified Sellers",
    description: "All vendors are thoroughly verified and rated by our community"
  },
  {
    icon: Users,
    title: "Community Trust",
    description: "Join thousands of satisfied users building trust through secure transactions"
  },
  {
    icon: Globe,
    title: "Global Marketplace",
    description: "Access buyers and sellers from around the world safely"
  },
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Get paid instantly when your items are delivered and confirmed"
  },
  {
    icon: Award,
    title: "Premium Support",
    description: "24/7 customer support to help with any transaction issues"
  }
];

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentBenefit, setCurrentBenefit] = useState(0);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  // Auto-rotate platform benefits
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBenefit((prev) => (prev + 1) % platformBenefits.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsLoading(true);
      
      // Show immediate feedback
      toast.loading('Creating your account...', { id: 'signup' });
      
      await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      
      // Success feedback
      toast.success('Account created successfully! Please login to continue.', { id: 'signup' });
      
      // Navigate to login
      navigate('/login');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = error.message || 'Failed to create account. Please try again.';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message?.includes('Network connection failed')) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      
      toast.error(errorMessage, { id: 'signup' });
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
      
      {/* Left Side - Platform Benefits Carousel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-16 left-16 w-24 h-24 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-16 right-16 w-32 h-32 bg-white/15 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/15 rounded-full blur-xl animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-white px-12">
          {/* Platform Benefits Carousel */}
          <div className="text-center max-w-sm">
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                {(() => {
                  const IconComponent = platformBenefits[currentBenefit].icon;
                  return <IconComponent className="h-12 w-12 text-white/90" />;
                })()}
              </div>
              <h2 className="text-xl font-bold mb-2">{platformBenefits[currentBenefit].title}</h2>
              <p className="text-base text-white/90 leading-relaxed">
                {platformBenefits[currentBenefit].description}
              </p>
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center space-x-2 mb-4">
              {platformBenefits.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBenefit(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentBenefit 
                      ? 'bg-white w-6' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Platform Stats */}
          <div className="mt-6 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-xl font-bold">50K+</div>
              <div className="text-xs text-white/70">Happy Users</div>
            </div>
            <div>
              <div className="text-xl font-bold">₦2B+</div>
              <div className="text-xs text-white/70">Protected</div>
            </div>
            <div>
              <div className="text-xl font-bold">4.9★</div>
              <div className="text-xs text-white/70">Rating</div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-6 text-center">
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 text-yellow-300 fill-current" />
              ))}
            </div>
            <p className="text-xs text-white/80 italic">
              "Tranzio made my first online sale so easy and secure!"
            </p>
            <p className="text-xs text-white/60 mt-1">- Sarah M., Verified Seller</p>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-sm lg:max-w-md space-y-6 pt-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-primary">Tranzio</h1>
            <p className="text-sm text-muted-foreground">Secure Trading Platform</p>
          </div>

          {/* Signup Form */}
          <Card className="shadow-xl border border-gray-200 bg-white">
            <CardContent className="pt-8 pb-8 px-6 sm:px-8">
              {/* Form Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-sm text-gray-600 mt-2">Start your secure trading journey today</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      className="pl-11 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      {...register('firstName')}
                    />
                  </div>
                  {errors.firstName && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName.message}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      className="pl-11 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      {...register('lastName')}
                    />
                  </div>
                  {errors.lastName && (
                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-11 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password (min. 6 characters)"
                    className="pl-11 pr-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    className="pl-11 pr-12 h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    {...register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword.message}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In */}
            <GoogleSignIn 
              onSuccess={(user) => {
                toast.success('Account created successfully with Google!');
                navigate('/dashboard');
              }}
              onError={(error) => {
                toast.error(`Google sign-up failed: ${error.message}`);
              }}
              buttonText="Sign up with Google"
              className="w-full"
            />

            {/* Terms and Conditions */}
            <div className="text-center text-xs text-gray-600 mt-6 pt-4 border-t border-gray-200">
              By creating an account, you agree to our{' '}
              <Link 
                to="/terms-and-conditions" 
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Terms & Conditions
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
