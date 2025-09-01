import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Store,
  CheckCircle,
  MessageCircle,
  Heart
} from 'lucide-react';

const vendors = [
  {
    id: 'VND-001',
    name: 'TechVendor Pro',
    rating: 4.9,
    reviewCount: 1247,
    location: 'San Francisco, CA',
    specialties: ['Electronics', 'Computers', 'Mobile Devices'],
    trustLevel: 'Verified',
    responseTime: '< 2 hours',
    completedOrders: 3456,
    avatar: '/placeholder.svg',
    description: 'Leading electronics vendor with 10+ years experience in premium tech products.',
    phone: '+1 (555) 123-4567',
    email: 'contact@techvendorpro.com'
  },
  {
    id: 'VND-002',
    name: 'Home Supplies Co.',
    rating: 4.7,
    reviewCount: 892,
    location: 'Austin, TX',
    specialties: ['Furniture', 'Home Decor', 'Appliances'],
    trustLevel: 'Premium',
    responseTime: '< 1 hour',
    completedOrders: 2134,
    avatar: '/placeholder.svg',
    description: 'Your trusted partner for quality home furnishing and interior solutions.',
    phone: '+1 (555) 987-6543',
    email: 'orders@homesupplies.com'
  },
  {
    id: 'VND-003',
    name: 'Electronics Hub',
    rating: 4.8,
    reviewCount: 2156,
    location: 'New York, NY',
    specialties: ['Smartphones', 'Tablets', 'Accessories'],
    trustLevel: 'Verified',
    responseTime: '< 3 hours',
    completedOrders: 5678,
    avatar: '/placeholder.svg',
    description: 'Specialized in latest mobile technology with competitive pricing.',
    phone: '+1 (555) 456-7890',
    email: 'support@electronichub.com'
  }
];

const getTrustLevelColor = (level: string) => {
  switch (level) {
    case 'Premium':
      return 'bg-primary text-primary-foreground';
    case 'Verified':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function VendorDetails() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Details</h1>
          <p className="text-muted-foreground">Browse and connect with trusted vendors</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Heart className="h-4 w-4" />
          Saved Vendors
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search vendors by name or specialty..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {filteredVendors.map((vendor) => (
          <Card key={vendor.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                {/* Vendor Avatar */}
                <Avatar className="h-16 w-16">
                  <AvatarImage src={vendor.avatar} alt={vendor.name} />
                  <AvatarFallback className="bg-primary-light text-primary">
                    {vendor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Vendor Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-foreground">{vendor.name}</h3>
                        <Badge className={getTrustLevelColor(vendor.trustLevel)}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {vendor.trustLevel}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium text-foreground">{vendor.rating}</span>
                          <span>({vendor.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{vendor.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm" className="gap-2">
                      <Heart className="h-3 w-3" />
                      Save
                    </Button>
                  </div>

                  <p className="text-muted-foreground mb-4">{vendor.description}</p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {vendor.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Response Time</p>
                      <p className="font-medium text-foreground">{vendor.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed Orders</p>
                      <p className="font-medium text-foreground">{vendor.completedOrders.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Trust Level</p>
                      <p className="font-medium text-foreground">{vendor.trustLevel}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{vendor.phone}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>{vendor.email}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Contact Vendor
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Store className="h-4 w-4" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust & Safety Info */}
      <Card className="shadow-card bg-primary-light/10">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Vendor Verification Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            All our vendors go through a comprehensive verification process to ensure safe and reliable transactions.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Business License Verification</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Background Check Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Customer Review Validation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Escrow Agreement Signed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}