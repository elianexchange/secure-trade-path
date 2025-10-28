import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import WaitlistModal from '@/components/WaitlistModal';
import { 
  Shield, 
  CheckCircle, 
  ArrowRight,
  CreditCard,
  Package,
  Search,
  Clock,
  Handshake,
  Calculator,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  MessageCircle,
  ChevronUp,
  Star,
  Users,
  TrendingUp,
  Award,
  Zap,
  Lock,
  Globe,
  Smartphone,
  DollarSign,
  Truck,
  CheckCircle2,
  UserCheck,
  Plus,
  BarChart3,
  Loader2
} from 'lucide-react';

export default function Landing() {
  const [transactionAmount, setTransactionAmount] = useState('');
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentUserType, setCurrentUserType] = useState(0);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const userTypes = [
    { text: "Individuals", icon: Users, color: "text-primary" },
    { text: "Vendors", icon: UserCheck, color: "text-secondary" },
    { text: "Marketers", icon: TrendingUp, color: "text-primary" },
    { text: "Entrepreneurs", icon: Star, color: "text-secondary" },
    { text: "Businesses", icon: Globe, color: "text-primary" }
  ];

  const transactionSteps = [
    { text: "Paid", icon: DollarSign, color: "text-green-500", delay: 0 },
    { text: "Secured", icon: Lock, color: "text-blue-500", delay: 1 },
    { text: "Confirmed", icon: CheckCircle, color: "text-primary", delay: 2 },
    { text: "Processed", icon: RefreshCw, color: "text-yellow-500", delay: 3 },
    { text: "Delivered", icon: Truck, color: "text-green-600", delay: 4 },
    { text: "Completed", icon: CheckCircle2, color: "text-primary", delay: 5 }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Scroll-triggered animation for timeline steps
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const stepIndex = parseInt(entry.target.getAttribute('data-step') || '0');
          setVisibleSteps(prev => {
            if (!prev.includes(stepIndex)) {
              return [...prev, stepIndex].sort();
            }
            return prev;
          });
        }
      });
    }, observerOptions);

    // Observe all step items
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach((item, index) => {
      item.setAttribute('data-step', index.toString());
      observer.observe(item);
    });

    return () => {
      stepItems.forEach(item => observer.unobserve(item));
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUserType((prev) => (prev + 1) % userTypes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      return () => card.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const calculateFee = (amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    // 2.5% fee structure
    const fee = numAmount * 0.025;
    setCalculatedFee(fee);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTransactionAmount(value);
    calculateFee(value);
  };

  // Helper function to position icons randomly across the entire right section
  const getIconPosition = (index: number) => {
    const positions = [
      { x: 25, y: 20 },   // Top left area - visible
      { x: 80, y: 15 },   // Top right area - visible
      { x: 70, y: 40 },   // Middle right - visible
      { x: 85, y: 70 },   // Bottom right - visible
      { x: 20, y: 75 },   // Bottom left - visible
      { x: 60, y: 35 }    // Middle area - visible
    ];
    return positions[index % positions.length];
  };

  const handleWaitlistClick = () => {
    setIsWaitlistLoading(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      setIsWaitlistModalOpen(true);
      setIsWaitlistLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile padding wrapper */}
      <div className="px-4 sm:px-6 lg:px-0 mobile-padding-wrapper">
      {/* Header Navigation */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-5xl mx-auto py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                {/* Main Logo Container */}
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  
                  {/* Central Shield */}
                  <div className="relative z-10">
                    <Shield className="h-5 w-5 text-white drop-shadow-sm" />
                  </div>
                  
                  {/* Security Ring */}
                  <div className="absolute inset-1 border border-white/20 rounded-lg"></div>
                  
                  {/* Corner Accents */}
                  <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                  <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                  <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                  
                  {/* Glow Effect */}
                  <div className="absolute -inset-0.5 bg-primary/20 rounded-xl blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary/80 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-green-500/80 rounded-full flex items-center justify-center animate-pulse" style={{animationDelay: '0.5s'}}>
                  <CheckCircle className="h-1.5 w-1.5 text-white" />
                </div>
              </div>
              
              {/* Logo Text */}
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-none">
                  Tranzio
                </span>
                <span className="text-xs text-muted-foreground font-medium tracking-wider">
                  SECURE ESCROW
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-1 cursor-pointer group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">How It Works</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="flex items-center space-x-1 cursor-pointer group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Security</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="flex items-center space-x-1 cursor-pointer group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Pricing</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="flex items-center space-x-1 cursor-pointer group">
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Support</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="outline" className="border-border text-foreground hover:bg-muted/50 px-4 py-2 h-auto transition-all duration-200" asChild>
                <Link to="/signup">Sign Up <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button className="bg-primary hover:bg-primary/90 px-4 py-2 h-auto transition-all duration-200" asChild>
                <Link to="/login">Login <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border/40 animate-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">How It Works</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Security</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pricing</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Support</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col space-y-2 pt-4 border-t border-border/40">
                  <Button variant="outline" className="border-border text-foreground hover:bg-muted/50" asChild>
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button className="bg-primary hover:bg-primary/90" asChild>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      Login <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 sm:py-16 lg:py-24 bg-gradient-to-br from-background via-muted/10 to-muted/20 relative overflow-hidden min-h-screen md:min-h-0 hero-100vh">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0">
          {/* Large Glowing Orbs */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/10 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-secondary/8 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-1/3 left-1/2 w-28 h-28 bg-primary/8 rounded-full blur-3xl animate-pulse delay-300"></div>
          
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:50px_50px] animate-grid-move"></div>
          
          {/* Floating Geometric Shapes */}
          <div className="absolute top-32 left-20 w-12 h-12 border border-primary/10 rounded-lg rotate-45 animate-spin-slow"></div>
          <div className="absolute top-40 right-32 w-8 h-8 border border-secondary/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 left-32 w-16 h-16 border border-primary/10 rounded-lg rotate-12 animate-bounce-slow"></div>
          <div className="absolute bottom-40 right-20 w-6 h-6 border border-secondary/10 rounded-full animate-ping"></div>
          
          {/* Animated Particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 3}s`
              }}
            />
          ))}
          
          {/* Additional Floating Icons */}
          <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center animate-float">
            <CreditCard className="h-4 w-4 text-primary/60" />
          </div>
          <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
            <Shield className="h-3 w-3 text-secondary/60" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '2s'}}>
            <Lock className="h-3.5 w-3.5 text-primary/60" />
          </div>
          <div className="absolute bottom-1/3 right-1/3 w-5 h-5 bg-secondary/10 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '3s'}}>
            <CheckCircle className="h-2.5 w-2.5 text-secondary/60" />
          </div>
          
          {/* Animated Connection Lines */}
          <div className="absolute top-1/2 left-1/4 w-32 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-24 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-28 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Subtle Wave Animation */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-primary/5 to-transparent animate-wave"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <article className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="space-y-4">
                <div className="inline-block bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">Secure Escrow Platform</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Trust in every
                  <span className="text-primary block">transaction</span>
                </h1>
                
                <p className="text-xl font-semibold text-muted-foreground flex items-center space-x-2">
                  <span>Built for</span>
                  <span className="relative inline-block min-w-[120px]">
                    {userTypes.map((type, index) => (
                      <span
                        key={type.text}
                        className={`absolute inset-0 flex items-center space-x-2 transition-all duration-500 ${
                          index === currentUserType ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                      >
                        <type.icon className={`h-5 w-5 ${type.color}`} />
                        <span className={type.color}>{type.text}</span>
                      </span>
                    ))}
                  </span>
                </p>
                
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                  An end-to-end transaction solution that seamlessly integrates payments, 
                  fulfilment and support into your marketplace or ecommerce store.
                </p>
              </div>
              
              {/* Enhanced Button Design */}
              <div className="relative group">
                <Button 
                  size="lg" 
                  onClick={handleWaitlistClick}
                  disabled={isWaitlistLoading}
                  className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-base px-6 py-3 h-auto transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 font-medium disabled:opacity-70 disabled:cursor-not-allowed" 
                >
                  {isWaitlistLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Opening...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Waitlist</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </article>

            {/* Enhanced Right Graphic - Advanced 3D Card System with Transaction Flow */}
            <div className={`relative transition-all duration-1000 delay-300 mt-8 lg:mt-0 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Enhanced Background Effects */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Animated Background Particles */}
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 5}s`,
                      animationDuration: `${3 + Math.random() * 4}s`
                    }}
                  />
                ))}
                
                {/* Animated Geometric Shapes */}
                <div className="absolute top-10 left-10 w-16 h-16 border border-primary/20 rounded-lg rotate-45 animate-spin-slow"></div>
                <div className="absolute top-20 right-20 w-12 h-12 border border-secondary/20 rounded-full animate-pulse"></div>
                <div className="absolute bottom-20 left-20 w-20 h-20 border border-primary/20 rounded-lg rotate-12 animate-bounce-slow"></div>
                <div className="absolute bottom-10 right-10 w-8 h-8 border border-secondary/20 rounded-full animate-ping"></div>
                
                  {/* Subtle background patterns */}
                <div className="absolute top-10 right-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 left-10 w-24 h-24 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-10 w-16 h-16 bg-primary/5 rounded-full blur-2xl animate-pulse delay-500"></div>
                </div>

                {/* Appearing/Disappearing Transaction Icons */}
                {transactionSteps.map((step, index) => (
                  <div
                    key={step.text}
                    className="absolute w-12 h-12"
                    style={{
                      left: `${getIconPosition(index).x}%`,
                      top: `${getIconPosition(index).y}%`,
                      animationDelay: `${step.delay * 0.8}s`
                    }}
                  >
                    <div className="relative w-full h-full animate-fade-in-out">
                      {/* Icon Container */}
                      <div className={`absolute inset-0 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white flex items-center justify-center group/icon hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`h-4 w-4 ${step.color} group-hover/icon:scale-110 transition-transform duration-300`} />
                      </div>
                      
                      {/* Text Label */}
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg border border-white/50">
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">{step.text}</span>
                      </div>
                      
                      {/* Subtle Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-sm opacity-0 group-hover/icon:scale-110 transition-opacity duration-500"></div>
                    </div>
                  </div>
                ))}

              <div 
                ref={cardRef}
                className="relative z-10 perspective-1000"
                style={{
                  transform: `perspective(1000px) rotateX(${(mousePosition.y - 200) * 0.02}deg) rotateY(${(mousePosition.x - 400) * 0.02}deg)`,
                  transition: 'transform 0.1s ease-out'
                }}
              >
                {/* Floating Particles Background - Spread across right section */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-primary/30 rounded-full animate-float"
                      style={{
                        left: `${20 + (i % 4) * 20}%`,
                        top: `${25 + Math.floor(i / 4) * 30}%`,
                        animationDelay: `${i * 0.4}s`,
                        animationDuration: `${3 + i * 0.5}s`
                      }}
                    />
                  ))}
                </div>

                {/* Main Credit Card - Enhanced 3D */}
                <div className="w-72 sm:w-80 h-40 sm:h-48 mx-auto bg-gradient-to-br from-foreground via-muted-foreground to-foreground rounded-2xl shadow-2xl transform rotate-3 relative hover:rotate-6 transition-all duration-700 hover:scale-105 group">
                  {/* Card Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Card Content */}
                  <div className="absolute inset-4 bg-white/10 rounded-xl backdrop-blur-sm"></div>
                  
                  {/* Card Chip */}
                  <div className="absolute top-6 left-6 w-8 h-6 bg-yellow-400/80 rounded-sm"></div>
                  
                  {/* Card Number */}
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="text-sm font-mono mb-2 tracking-wider">0000 0000 0000 0000</div>
                    <div className="flex items-center space-x-4">
                      <div className="text-xs">VALID THRU</div>
                      <div className="text-xs">12/25</div>
                    </div>
                  </div>
                  
                  {/* Card Logo */}
                  <div className="absolute top-6 right-6 text-white/80">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>

                
                {/* Enhanced Tranzio Logo Above Card */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                  <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center relative">
                    {/* Glowing Ring */}
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-full flex items-center justify-center relative z-10 shadow-lg overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10"></div>
                      
                      {/* Central Shield */}
                      <Shield className="h-5 w-5 text-white relative z-10" />
                      
                      {/* Security Ring */}
                      <div className="absolute inset-1 border border-white/30 rounded-full"></div>
                      
                      {/* Corner Accents */}
                      <div className="absolute top-1 left-1 w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="absolute top-1 right-1 w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="absolute bottom-1 left-1 w-1 h-1 bg-white/60 rounded-full"></div>
                      <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/60 rounded-full"></div>
                      
                      {/* Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-transparent rounded-full blur-sm"></div>
                      
                      {/* Floating Elements */}
                      <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-white/80 rounded-full animate-pulse"></div>
                      <div className="absolute -bottom-0.5 -left-0.5 w-0.5 h-0.5 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Floating Elements */}
                <div className="absolute -top-4 right-8 animate-pulse">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/30">
                    <RefreshCw className="h-4 w-4 text-primary" />
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 space-y-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center animate-pulse backdrop-blur-sm border border-border/30">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-muted to-muted/80 rounded-full flex items-center justify-center backdrop-blur-sm border border-border/30">
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Additional Floating Icons */}
                <div className="absolute -bottom-4 left-8 animate-bounce delay-1000">
                  <div className="w-6 h-6 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-secondary/30">
                    <Lock className="h-3 w-3 text-secondary" />
                  </div>
                </div>

                <div className="absolute bottom-8 right-16 animate-pulse delay-500">
                  <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-muted/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-primary/20">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                  </div>
                </div>

                {/* Geometric Shapes - Spread across right section */}
                <div className="absolute top-8 left-20 w-4 h-4 bg-primary/40 rounded-full animate-ping delay-700"></div>
                <div className="absolute top-20 right-15 w-3 h-3 bg-secondary/50 rounded-full animate-pulse delay-300"></div>
                <div className="absolute bottom-15 left-30 w-5 h-5 bg-primary/30 rotate-45 animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 right-20 w-3 h-3 bg-secondary/40 rounded-full animate-pulse delay-500"></div>
                <div className="absolute bottom-1/3 left-15 w-4 h-4 bg-primary/35 rounded-full animate-ping delay-1200"></div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Transaction Calculator Section */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background rounded-2xl shadow-lg p-8 border border-border/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Transaction Calculator</h2>
              <p className="text-muted-foreground">Calculate your transaction fees instantly</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Label htmlFor="amount" className="text-foreground font-medium">Transaction Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={transactionAmount}
                  onChange={handleAmountChange}
                  className="text-lg py-3"
                />
                <p className="text-sm text-muted-foreground">Our fee: 2.5% of transaction value</p>
              </div>
              
              <div className="bg-muted/30 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Fee: ₦{calculatedFee.toLocaleString()}</div>
                <div className="text-muted-foreground">Net Amount: ₦{(parseFloat(transactionAmount) || 0) - calculatedFee}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview of Achievements */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-200">
              <div className="text-5xl font-bold text-foreground group-hover:text-primary transition-colors">₦10M+</div>
              <div className="text-muted-foreground">Monthly GMV</div>
            </div>
            <div className="text-center space-y-3 relative group hover:scale-105 transition-transform duration-200">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-20 bg-border"></div>
              <div className="text-5xl font-bold text-foreground group-hover:text-primary transition-colors">250+</div>
              <div className="text-muted-foreground">Marketplace Partners</div>
            </div>
            <div className="text-center space-y-3 relative group hover:scale-105 transition-transform duration-200">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-px h-20 bg-border"></div>
              <div className="text-5xl font-bold text-foreground group-hover:text-primary transition-colors">840,000+</div>
              <div className="text-muted-foreground">Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Zero Worries Section */}
      <section className="py-12 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-lg p-6 border border-blue-500/20 relative overflow-hidden">
            {/* Creative Background Elements */}
            <div className="absolute inset-0">
              {/* Animated Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] animate-grid-move rounded-2xl"></div>
              
              {/* Floating Geometric Shapes */}
              <div className="absolute top-8 left-16 w-12 h-12 border border-white/20 rounded-lg rotate-45 animate-spin-slow"></div>
              <div className="absolute top-12 right-20 w-8 h-8 border border-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-8 left-20 w-16 h-16 border border-white/20 rounded-lg rotate-12 animate-bounce-slow"></div>
              <div className="absolute bottom-12 right-16 w-6 h-6 border border-white/20 rounded-full animate-ping"></div>
              
              {/* Glowing Orbs */}
              <div className="absolute top-4 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute bottom-4 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
              
              {/* Creative Small Boxes - Much Smaller */}
              <div className="absolute top-1/3 left-1/4 flex space-x-1">
                <div className="w-1 h-1 bg-white/30 rounded-sm animate-pulse"></div>
                <div className="w-0.5 h-0.5 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <div className="w-1.5 h-0.5 bg-white/25 rounded-sm animate-pulse" style={{animationDelay: '0.6s'}}></div>
                <div className="w-0.5 h-1 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '0.9s'}}></div>
              </div>
              <div className="absolute bottom-1/3 right-1/4 flex space-x-0.5">
                <div className="w-0.5 h-0.5 bg-white/25 rounded-sm animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-1 h-0.5 bg-white/30 rounded-sm animate-pulse" style={{animationDelay: '0.8s'}}></div>
                <div className="w-0.5 h-1.5 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '1.1s'}}></div>
                <div className="w-1 h-1 bg-white/25 rounded-sm animate-pulse" style={{animationDelay: '1.4s'}}></div>
              </div>
              <div className="absolute top-1/2 left-1/3 flex space-x-0.5">
                <div className="w-0.5 h-1 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '0.7s'}}></div>
                <div className="w-1.5 h-0.5 bg-white/30 rounded-sm animate-pulse" style={{animationDelay: '1s'}}></div>
                <div className="w-0.5 h-0.5 bg-white/25 rounded-sm animate-pulse" style={{animationDelay: '1.3s'}}></div>
                <div className="w-1 h-1 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '1.6s'}}></div>
              </div>
              <div className="absolute top-1/4 right-1/3 flex space-x-0.5">
                <div className="w-1 h-0.5 bg-white/25 rounded-sm animate-pulse" style={{animationDelay: '0.4s'}}></div>
                <div className="w-0.5 h-1.5 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '0.7s'}}></div>
                <div className="w-0.5 h-0.5 bg-white/30 rounded-sm animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
              <div className="absolute bottom-1/4 left-1/2 flex space-x-0.5">
                <div className="w-0.5 h-0.5 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '0.6s'}}></div>
                <div className="w-1 h-1 bg-white/25 rounded-sm animate-pulse" style={{animationDelay: '0.9s'}}></div>
                <div className="w-0.5 h-1 bg-white/30 rounded-sm animate-pulse" style={{animationDelay: '1.2s'}}></div>
                <div className="w-1.5 h-0.5 bg-white/20 rounded-sm animate-pulse" style={{animationDelay: '1.5s'}}></div>
              </div>
            </div>
            
            <div className="text-center relative z-10">
              <div className="space-y-6">
                {/* Main Heading */}
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Buy with <span className="text-yellow-300">zero worries</span>, 
                  <br />
                  sell with <span className="text-green-300">assurance</span>
                </h2>
                
                {/* Subheading */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xl md:text-2xl font-semibold text-white/90">
                    No Scam. No Fraud. No Worries.
                  </p>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-8 pt-4">
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium">100% Secure</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                    <span className="text-white/90 font-medium">Bank Protected</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    <span className="text-white/90 font-medium">Instant Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard Demo Section */}
      <section className="py-24 bg-gradient-to-br from-muted/20 via-background to-muted/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Real Dashboard UI Demo */}
            <div className="relative">
              {/* Actual Dashboard Interface */}
              <div className="relative w-full max-w-xs mx-auto">
                {/* Dashboard Container - Compact replica */}
                <div className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500 animate-dashboard-entrance">
                  {/* Dashboard Header - Compact */}
                  <div className="bg-card border-b border-border p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center animate-spin-slow">
                          <Shield className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground text-sm">Dashboard</h3>
                          <p className="text-xs text-muted-foreground">Welcome back, John</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                        <span className="text-xs text-muted-foreground">Live</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Stats - Compact Cards */}
                  <div className="p-4 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card border border-border rounded-lg p-3 animate-bounce-in" style={{animationDelay: '0.5s'}}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-lg font-bold text-card-foreground animate-count-up">₦2.45M</p>
                          </div>
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center animate-wiggle">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-card border border-border rounded-lg p-3 animate-bounce-in" style={{animationDelay: '1s'}}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Active</p>
                            <p className="text-lg font-bold text-card-foreground animate-pulse-number">3</p>
                          </div>
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center animate-wiggle" style={{animationDelay: '0.5s'}}>
                            <Clock className="h-4 w-4 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Transaction - Compact */}
                    <div className="bg-card border border-border rounded-lg p-4 animate-slide-up" style={{animationDelay: '1.5s'}}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-card-foreground text-sm">Active TXN</h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs animate-pulse-badge">Live</Badge>
                      </div>
                      
                      {/* Transaction Details - Compact */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">ID</span>
                          <span className="text-xs font-mono text-card-foreground">#TXN-001</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <span className="text-sm font-semibold text-card-foreground animate-money-glow">₦50K</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Party</span>
                          <span className="text-xs text-card-foreground">Sarah J.</span>
                        </div>
                      </div>

                      {/* Progress Steps - Compact */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-success-pulse">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-card-foreground">Payment</p>
                            <p className="text-xs text-muted-foreground">Secured</p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">✓</Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-success-pulse" style={{animationDelay: '0.5s'}}>
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-card-foreground">Order</p>
                            <p className="text-xs text-muted-foreground">Confirmed</p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">✓</Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-current-step">
                            <Package className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-card-foreground">Transit</p>
                            <p className="text-xs text-muted-foreground">ABC123</p>
                          </div>
                          <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs animate-pulse">●</Badge>
                        </div>

                        <div className="flex items-center space-x-2 opacity-60">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <Truck className="h-3 w-3 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Delivery</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                          <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">⏳</Badge>
                        </div>
                      </div>

                      {/* Progress Bar - Compact */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span className="animate-counter-text">60%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-green-500 via-blue-500 to-gray-300 h-1.5 rounded-full animate-progress-wow" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions - Compact */}
                    <div className="grid grid-cols-2 gap-3 animate-slide-up" style={{animationDelay: '2s'}}>
                      <Button className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs animate-button-glow">
                        <Plus className="h-3 w-3 mr-1" />
                        New
                      </Button>
                      <Button variant="outline" className="h-8 text-xs animate-button-float">
                        <Search className="h-3 w-3 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center animate-float">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
                  <Lock className="h-3 w-3 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <div className="flex flex-col justify-center h-full space-y-4">
              <div className="space-y-4">
                <div className="inline-block bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">Live Dashboard Demo</span>
                </div>
                
                <h2 className="text-4xl font-bold text-foreground leading-tight">
                  See Your Transactions 
                  <span className="text-primary block">In Real-Time</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Experience the actual Tranzio dashboard with live transaction tracking, 
                  real-time updates, and comprehensive security monitoring.
                </p>
              </div>

              {/* Features List - Compact */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-gray-200/30">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Real-Time Tracking</h3>
                    <p className="text-sm text-muted-foreground">Live updates and progress indicators</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-gray-200/30">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Secure Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Bank-level security & encryption</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-gray-200/30">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Instant Notifications</h3>
                    <p className="text-sm text-muted-foreground">Immediate status updates</p>
                  </div>
                </div>

              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  onClick={handleWaitlistClick}
                  disabled={isWaitlistLoading}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 h-auto transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isWaitlistLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Opening...
                    </>
                  ) : (
                    <>
                      Join Waitlist <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50/30 via-background to-blue-50/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="inline-block bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">How It Works</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  Simple & Secure
                  <span className="text-primary block">Transaction Process</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Tranzio simplifies transactions by securely holding the buyer's payment in the 
                  Tranzio Vault until the order is fulfilled and inspected. 
                  Once both parties are satisfied, the funds are released, ensuring a 
                  smooth and worry-free process.
                </p>
              </div>
            </div>

            {/* Right - Animated Transaction Flow Dashboard */}
            <div className="relative">
              {/* Dashboard Container */}
              <div className="relative w-full max-w-xs mx-auto">
                {/* Dashboard Frame */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3 relative overflow-hidden dashboard-animation">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/50">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center">
                        <Shield className="h-2.5 w-2.5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-xs">Dashboard</h3>
                        <p className="text-xs text-gray-500">#TXN-001</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600">Active</span>
                    </div>
                  </div>

                  {/* Transaction Flow Steps */}
                  <div className="space-y-2">
                    {/* Step 1: Payment Initiated */}
                    <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200/30 animate-slide-in-left" style={{animationDelay: '0.2s'}}>
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                        <DollarSign className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 text-xs">Payment</h4>
                          <span className="text-xs text-green-600 font-medium">✓</span>
                        </div>
                        <p className="text-xs text-gray-600">Secured</p>
                      </div>
                    </div>

                    {/* Step 2: Order Confirmed */}
                    <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200/30 animate-slide-in-left" style={{animationDelay: '0.6s'}}>
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-sm">
                        <Package className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 text-xs">Order</h4>
                          <span className="text-xs text-green-600 font-medium">✓</span>
                        </div>
                        <p className="text-xs text-gray-600">Confirmed</p>
                      </div>
                    </div>

                    {/* Step 3: In Transit (Current Active Step) */}
                    <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/30 animate-slide-in-left animate-pulse" style={{animationDelay: '1s'}}>
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow-sm relative">
                        <Truck className="h-3 w-3 text-white" />
                        <div className="absolute -inset-0.5 bg-orange-500/30 rounded-full animate-ping"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 text-xs">Transit</h4>
                          <span className="text-xs text-orange-600 font-medium animate-pulse">●</span>
                        </div>
                        <p className="text-xs text-gray-600">In Progress</p>
                      </div>
                    </div>

                    {/* Step 4: Delivery Pending */}
                    <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gray-50 border border-gray-200/30 opacity-60 animate-slide-in-left" style={{animationDelay: '1.4s'}}>
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <Search className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-500 text-xs">Delivery</h4>
                          <span className="text-xs text-gray-400 font-medium">⏳</span>
                        </div>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                    </div>

                    {/* Step 5: Funds Release */}
                    <div className="flex items-center space-x-2 p-1.5 rounded-md bg-gray-50 border border-gray-200/30 opacity-60 animate-slide-in-left" style={{animationDelay: '1.8s'}}>
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-500 text-xs">Release</h4>
                          <span className="text-xs text-gray-400 font-medium">⏳</span>
                        </div>
                        <p className="text-xs text-gray-400">Funds</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>60%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 h-1 rounded-full animate-progress" style={{width: '60%'}}></div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-400/30 rounded-full animate-float"></div>
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-purple-400/30 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-1/2 right-1 w-0.5 h-0.5 bg-orange-400/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
                </div>

                {/* Connection Lines Animation */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Animated connection lines between steps */}
                  <svg className="w-full h-full" viewBox="0 0 200 150">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="rgb(147, 51, 234)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 30 45 Q 100 30 170 45"
                      stroke="url(#lineGradient)"
                      strokeWidth="1"
                      fill="none"
                      strokeDasharray="2,2"
                      className="animate-dash"
                    />
                    <circle cx="30" cy="45" r="1.5" fill="rgb(59, 130, 246)" className="animate-pulse" />
                    <circle cx="100" cy="30" r="1.5" fill="rgb(147, 51, 234)" className="animate-pulse" style={{animationDelay: '0.5s'}} />
                    <circle cx="170" cy="45" r="1.5" fill="rgb(249, 115, 22)" className="animate-pulse" style={{animationDelay: '1s'}} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* How It Works Section - Minimalist Timeline */}
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Shield className="h-3 w-3 text-primary mr-2" />
                <span className="text-xs font-medium text-primary">How It Works</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                4 Simple Steps to
                <span className="text-primary block">Secure Trading</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Experience the most secure and transparent trading process
              </p>
            </div>

            {/* Minimalist Timeline */}
            <div className="space-y-6">
              {/* Step 1: Agree */}
              <div className={`group relative step-item ${visibleSteps.includes(0) ? 'animate' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 step-icon">
                    <Handshake className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4 group-hover:bg-gray-100 transition-colors duration-300 step-card">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Agree</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Everyone <span className="font-medium text-blue-600">AGREES</span> to the terms. Buyer, seller and agent agree to the transaction terms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Secure */}
              <div className={`group relative step-item ${visibleSteps.includes(1) ? 'animate' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 step-icon">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4 group-hover:bg-gray-100 transition-colors duration-300 step-card">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Secure</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Money is <span className="font-medium text-green-600">SECURED</span> in Trust. Verified buyers commit to the transaction by paying into our secured escrow account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Deliver */}
              <div className={`group relative step-item ${visibleSteps.includes(2) ? 'animate' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 step-icon">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4 group-hover:bg-gray-100 transition-colors duration-300 step-card">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Deliver</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Seller <span className="font-medium text-orange-600">DELIVERS</span> to Buyer. Verified seller arranges delivery of products or services as agreed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Pay */}
              <div className={`group relative step-item ${visibleSteps.includes(3) ? 'animate' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 step-icon">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-lg p-4 group-hover:bg-gray-100 transition-colors duration-300 step-card">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Pay</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <span className="font-medium text-purple-600">WHEN APPROVED</span>, Money is PAID to Seller. Tranzio releases funds once approved by the buyer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Clock className="h-4 w-4 text-primary mr-2" />
                <span className="text-xs font-medium text-primary">Average success rate: 99 %</span>
              </div>
            </div>
          </div>
        </section>

      {/* Wallet System Section */}
      <section className="py-24 bg-gradient-to-br from-green-50/30 via-background to-blue-50/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Creative Bank Cards Animation */}
            <div className="relative">
              <div className="w-96 h-80 mx-auto relative">
                {/* Background Glow Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>
                
                {/* First Bank Card - Access Bank */}
                <div className="absolute top-8 left-4 w-72 h-44 bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-2xl shadow-2xl transform rotate-3 hover:rotate-6 transition-all duration-700 hover:scale-105 group animate-card-float">
                  {/* Card Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Card Content */}
                  <div className="absolute inset-4 text-white">
                    {/* Bank Logo */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-xs font-semibold">ACCESS BANK</div>
                    </div>
                    
                    {/* Card Number */}
                    <div className="mb-4">
                      <div className="text-lg font-mono tracking-wider">1234 5678 9012 3456</div>
                      <div className="text-xs text-white/80 mt-1">Tranzio Virtual Account</div>
                    </div>
                    
                    {/* Account Details */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs text-white/80">Account Name</div>
                        <div className="text-sm font-semibold">John Doe</div>
                      </div>
                      <div className="text-xs text-white/80">Valid 12/28</div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/60 rounded-full animate-ping"></div>
                </div>

                {/* Second Bank Card - GTBank */}
                <div className="absolute bottom-8 right-4 w-72 h-44 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-2xl shadow-2xl transform -rotate-2 hover:-rotate-4 transition-all duration-700 hover:scale-105 group animate-card-float" style={{animationDelay: '1s'}}>
                  {/* Card Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Card Content */}
                  <div className="absolute inset-4 text-white">
                    {/* Bank Logo */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-xs font-semibold">GTBANK</div>
                    </div>
                    
                    {/* Card Number */}
                    <div className="mb-4">
                      <div className="text-lg font-mono tracking-wider">9876 5432 1098 7654</div>
                      <div className="text-xs text-white/80 mt-1">Tranzio Virtual Account</div>
                    </div>
                    
                    {/* Account Details */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-xs text-white/80">Account Name</div>
                        <div className="text-sm font-semibold">Sarah Johnson</div>
                      </div>
                      <div className="text-xs text-white/80">Valid 12/28</div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/60 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                </div>

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <path
                    d="M100 120 Q200 80 300 200"
                    fill="none"
                    stroke="url(#connectionGradient)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="animate-dash-flow"
                  />
                  <defs>
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Floating Icons */}
                <div className="absolute top-4 right-8 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center animate-float">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div className="absolute bottom-4 left-8 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '1s'}}>
                  <Shield className="h-3 w-3 text-green-600" />
                </div>
                <div className="absolute top-1/2 left-2 w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center animate-float" style={{animationDelay: '2s'}}>
                  <CheckCircle className="h-2.5 w-2.5 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="inline-block bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                  <span className="text-sm font-medium text-primary">Virtual Wallet System</span>
                </div>
                
                <h2 className="text-4xl font-bold text-foreground leading-tight">
                  Unique Account Numbers
                  <span className="text-primary block">For Every User</span>
                </h2>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Get your own unique Nigerian bank account numbers upon verification. 
                  Receive payments, make transactions, and manage your funds with complete 
                  security and flexibility. Withdraw anytime or top up your account instantly.
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-gray-200/30">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Instant Account Generation</h3>
                    <p className="text-sm text-muted-foreground">Get unique Nigerian bank account numbers immediately after verification</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-gray-200/30">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Secure Transactions</h3>
                    <p className="text-sm text-muted-foreground">All transactions are protected with bank-level security and encryption</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/50 border border-gray-200/30">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Flexible Fund Management</h3>
                    <p className="text-sm text-muted-foreground">Withdraw funds anytime or top up your account instantly</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  size="lg" 
                  onClick={handleWaitlistClick}
                  disabled={isWaitlistLoading}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 h-auto transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isWaitlistLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Opening...
                    </>
                  ) : (
                    <>
                      Join Waitlist <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes fade-in-out {
          0%, 100% { 
            opacity: 0; 
            transform: scale(0.8) translateY(10px); 
          }
          20%, 80% { 
            opacity: 1; 
            transform: scale(1) translateY(0px); 
          }
        }
        
        @keyframes slide-in-left {
          0% {
            opacity: 0;
            transform: translateX(-30px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(30px); 
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0) rotate(0deg); 
          }
          50% {
            transform: translateY(-10px) rotate(5deg); 
          }
        }
        
        @keyframes spin-slow {
          0% { 
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes grid-move {
          0% {
            transform: translate(0, 0); 
          }
          100% {
            transform: translate(50px, 50px); 
          }
        }
        
        @keyframes wave {
          0% {
            transform: translateX(-100%); 
          }
          100% {
            transform: translateX(100%); 
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out infinite;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-grid-move {
          animation: grid-move 20s linear infinite;
        }
        
        .animate-wave {
          animation: wave 3s ease-in-out infinite;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .animate-slide-in-left {
            animation-duration: 0.6s;
          }
          
          /* Force mobile padding */
          .mobile-padding-wrapper {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          
          /* Increase mobile font sizes more aggressively */
          h1, h2, h3, h4, h5, h6 {
            font-size: 1.3em !important;
          }
          
          .text-3xl {
            font-size: 2.25rem !important; /* 36px */
          }
          
          .text-4xl {
            font-size: 2.75rem !important; /* 44px */
          }
          
          .text-5xl {
            font-size: 3.5rem !important; /* 56px */
          }
          
          .text-6xl {
            font-size: 4rem !important; /* 64px */
          }
          
          .text-lg {
            font-size: 1.25rem !important; /* 20px */
          }
          
          .text-xl {
            font-size: 1.5rem !important; /* 24px */
          }
          
          .text-2xl {
            font-size: 1.875rem !important; /* 30px */
          }
          
          .text-sm {
            font-size: 1rem !important; /* 16px */
          }
          
          .text-base {
            font-size: 1.125rem !important; /* 18px */
          }
          
          /* Ensure hero section takes full viewport on mobile */
          .hero-100vh {
            min-height: 100vh !important;
          }
          
          /* Reduce dashboard animation font sizes on mobile */
          .dashboard-animation h3,
          .dashboard-animation h4,
          .dashboard-animation p,
          .dashboard-animation span {
            font-size: 0.75rem !important; /* 12px - same as text-xs */
          }
        }
        
        @media (max-width: 480px) {
          .mobile-padding-wrapper {
            padding-left: 0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }

        /* New section animations */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }
        
        @keyframes floatUp {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .animate-slide-in-up {
          animation: slideInUp 0.8s ease-out;
        }

        .animate-fade-in-scale {
          animation: fadeInScale 0.6s ease-out;
        }
        
        .animate-pulse-glow {
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .animate-float-up {
          animation: floatUp 3s ease-in-out infinite;
        }

        /* Staggered animations for grid items */
        .step-card:nth-child(1) { animation-delay: 0.1s; }
        .step-card:nth-child(2) { animation-delay: 0.2s; }
        .step-card:nth-child(3) { animation-delay: 0.3s; }
        .step-card:nth-child(4) { animation-delay: 0.4s; }

        .benefit-card:nth-child(1) { animation-delay: 0.1s; }
        .benefit-card:nth-child(2) { animation-delay: 0.2s; }
        .benefit-card:nth-child(3) { animation-delay: 0.3s; }
        .benefit-card:nth-child(4) { animation-delay: 0.4s; }
        .benefit-card:nth-child(5) { animation-delay: 0.5s; }
        .benefit-card:nth-child(6) { animation-delay: 0.6s; }

        /* Minimalist Timeline Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes iconPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes cardGlow {
          0%, 100% {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
        }

        /* Scroll-triggered animations */
        .step-item {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-item.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .step-item.animate .step-icon {
          animation: iconPulse 0.6s ease-out;
        }

        .step-item.animate .step-card {
          animation: slideInLeft 0.6s ease-out;
        }

        /* Hover effects */
        .step-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .step-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-icon:hover {
          transform: scale(1.1);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .step-item {
            transform: translateY(15px);
          }
          
          .step-card {
            padding: 0.75rem;
          }
          
          .step-icon {
            width: 2.5rem;
            height: 2.5rem;
          }
        }

        @media (max-width: 480px) {
          .step-item {
            transform: translateY(10px);
          }
        }
        `
      }} />

      {/* Waitlist Modal - Outside padding wrapper */}
      <WaitlistModal 
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        onSuccess={() => {
          // Optional: Add any success handling here
          console.log('User joined waitlist successfully!');
        }}
        isLoading={isWaitlistLoading}
      />
      </div>
      
      {/* Footer - Outside padding wrapper */}
      <footer className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                {/* Main Logo Container - Same as Navigation */}
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  
                  {/* Central Shield */}
                  <Shield className="h-5 w-5 text-white relative z-10" />
                  
                  {/* Security Checkmark */}
                  <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-green-500/80 rounded-full flex items-center justify-center animate-pulse" style={{animationDelay: '0.5s'}}>
                    <CheckCircle className="h-1.5 w-1.5 text-white" />
                  </div>
                </div>
                
                {/* Logo Text */}
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent leading-none">
                    Tranzio
                  </span>
                  <span className="text-xs text-gray-400 font-medium tracking-wider">
                    ESCROW
                  </span>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md mx-auto md:mx-0">
                The future of secure trading. Buy with zero worries, sell with assurance.
              </p>
              <div className="flex space-x-4 justify-center md:justify-start">
                {/* Instagram */}
                <a href="https://www.instagram.com/tranzzio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Follow us on Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* X (Twitter) */}
                <a href="https://x.com/tranzzio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="Follow us on X">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links and Legal - Two columns on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-8 md:col-span-2">
              {/* Quick Links */}
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">How it Works</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Security</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Support</a></li>
                </ul>
              </div>
              
              {/* Legal */}
              <div className="text-center md:text-left">
                <h3 className="text-lg font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cookie Policy</a></li>
                  <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Compliance</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-white/80 text-center md:text-right">
                Tranzio Ltd is a company registered in Nigeria. VAT Number: 3507080FH. 
                Registered number: 614918.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
