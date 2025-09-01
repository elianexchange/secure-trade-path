import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Clock, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Download,
  RefreshCw
} from 'lucide-react';

const orders = [
  {
    id: 'ORD-001',
    item: 'MacBook Pro 16" M3',
    vendor: 'TechVendor Pro',
    amount: '$2,499.00',
    status: 'In Transit',
    progress: 75,
    estimatedDelivery: '2024-01-18',
    trackingNumber: 'TRK123456789',
    stages: [
      { name: 'Order Placed', completed: true, date: '2024-01-15 10:30 AM' },
      { name: 'Payment Escrowed', completed: true, date: '2024-01-15 10:45 AM' },
      { name: 'Vendor Confirmed', completed: true, date: '2024-01-15 11:00 AM' },
      { name: 'Item Shipped', completed: true, date: '2024-01-16 09:15 AM' },
      { name: 'In Transit', completed: false, date: 'Current' },
      { name: 'Delivered', completed: false, date: 'Pending' }
    ]
  },
  {
    id: 'ORD-002',
    item: 'iPhone 15 Pro',
    vendor: 'Electronics Hub',
    amount: '$999.00',
    status: 'Delivered',
    progress: 100,
    estimatedDelivery: '2024-01-14',
    trackingNumber: 'TRK987654321',
    stages: [
      { name: 'Order Placed', completed: true, date: '2024-01-12 02:15 PM' },
      { name: 'Payment Escrowed', completed: true, date: '2024-01-12 02:30 PM' },
      { name: 'Vendor Confirmed', completed: true, date: '2024-01-12 03:00 PM' },
      { name: 'Item Shipped', completed: true, date: '2024-01-13 08:30 AM' },
      { name: 'In Transit', completed: true, date: '2024-01-13 04:00 PM' },
      { name: 'Delivered', completed: true, date: '2024-01-14 11:30 AM' }
    ]
  },
  {
    id: 'ORD-003',
    item: 'Office Chair',
    vendor: 'Home Supplies Co.',
    amount: '$299.00',
    status: 'Processing',
    progress: 25,
    estimatedDelivery: '2024-01-20',
    trackingNumber: 'Pending',
    stages: [
      { name: 'Order Placed', completed: true, date: '2024-01-16 04:20 PM' },
      { name: 'Payment Escrowed', completed: true, date: '2024-01-16 04:35 PM' },
      { name: 'Vendor Confirmed', completed: false, date: 'Pending' },
      { name: 'Item Shipped', completed: false, date: 'Pending' },
      { name: 'In Transit', completed: false, date: 'Pending' },
      { name: 'Delivered', completed: false, date: 'Pending' }
    ]
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Processing':
      return 'bg-warning text-warning-foreground';
    case 'In Transit':
      return 'bg-info text-info-foreground';
    case 'Delivered':
      return 'bg-success text-success-foreground';
    case 'Cancelled':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Processing':
      return Clock;
    case 'In Transit':
      return Truck;
    case 'Delivered':
      return CheckCircle;
    case 'Cancelled':
      return AlertCircle;
    default:
      return Package;
  }
};

export default function OrderStatus() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Status</h1>
          <p className="text-muted-foreground">Track your orders and manage deliveries</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.map((order) => {
          const StatusIcon = getStatusIcon(order.status);
          
          return (
            <Card key={order.id} className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-light p-2 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{order.item}</CardTitle>
                      <CardDescription>
                        {order.id} • {order.vendor} • {order.amount}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(order.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order Progress</span>
                    <span className="text-foreground font-medium">{order.progress}%</span>
                  </div>
                  <Progress value={order.progress} className="h-2" />
                </div>

                {/* Delivery Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-medium text-foreground">{order.estimatedDelivery}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-medium text-foreground">{order.trackingNumber}</p>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Order Timeline</h4>
                  <div className="space-y-3">
                    {order.stages.map((stage, index) => (
                      <div key={stage.name} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          stage.completed 
                            ? 'bg-success text-success-foreground' 
                            : index === order.stages.findIndex(s => !s.completed)
                            ? 'bg-info text-info-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {stage.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : index === order.stages.findIndex(s => !s.completed) ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-current" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-medium ${
                            stage.completed ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {stage.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{stage.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contact Vendor
                  </Button>
                  
                  {order.trackingNumber !== 'Pending' && (
                    <Button variant="outline" className="gap-2">
                      <Truck className="h-4 w-4" />
                      Track Package
                    </Button>
                  )}
                  
                  {order.status === 'Delivered' && (
                    <>
                      <Button className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Confirm Delivery
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Receipt
                      </Button>
                    </>
                  )}
                  
                  {order.status === 'Processing' && (
                    <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <Card className="shadow-card bg-muted/50">
        <CardHeader>
          <CardTitle className="text-foreground">Need Help?</CardTitle>
          <CardDescription>Having issues with your order? We're here to help.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Live Chat Support
            </Button>
            <Button variant="outline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Report an Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}