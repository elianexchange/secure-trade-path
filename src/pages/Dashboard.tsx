import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

const transactionStats = [
  {
    title: 'Total Transactions',
    value: '24',
    change: '+12%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-success'
  },
  {
    title: 'Active Orders',
    value: '8',
    change: '+3',
    trend: 'up',
    icon: Package,
    color: 'text-info'
  },
  {
    title: 'Pending Payments',
    value: '3',
    change: '-2',
    trend: 'down',
    icon: Clock,
    color: 'text-warning'
  },
  {
    title: 'Completed Orders',
    value: '13',
    change: '+5',
    trend: 'up',
    icon: CheckCircle,
    color: 'text-success'
  }
];

const recentTransactions = [
  {
    id: 'TRX-001',
    vendor: 'TechVendor Pro',
    item: 'MacBook Pro 16"',
    amount: '$2,499.00',
    status: 'In Escrow',
    date: '2024-01-15'
  },
  {
    id: 'TRX-002',
    vendor: 'Electronics Hub',
    item: 'iPhone 15 Pro',
    amount: '$999.00',
    status: 'Delivered',
    date: '2024-01-14'
  },
  {
    id: 'TRX-003',
    vendor: 'Home Supplies Co.',
    item: 'Office Chair',
    amount: '$299.00',
    status: 'Pending',
    date: '2024-01-13'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Escrow':
      return 'bg-info text-info-foreground';
    case 'Delivered':
      return 'bg-success text-success-foreground';
    case 'Pending':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your transactions and manage orders safely</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Transaction
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {transactionStats.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stat.trend === 'up' ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
                )}
                <span>{stat.change} from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          <CardDescription>Your latest escrow transactions and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-light p-2 rounded-lg">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{transaction.item}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.vendor} • {transaction.id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium text-foreground">{transaction.amount}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription>Frequently used features for faster access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-3">
              <Package className="h-4 w-4" />
              Create New Order
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <DollarSign className="h-4 w-4" />
              Make Payment
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3">
              <CheckCircle className="h-4 w-4" />
              Confirm Delivery
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Security Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your transactions are protected by our escrow system. Funds are only released when both parties confirm completion.
            </p>
            <div className="flex items-center gap-2 text-xs text-success">
              <CheckCircle className="h-3 w-3" />
              <span>SSL Encrypted • Verified Vendors • 24/7 Support</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}