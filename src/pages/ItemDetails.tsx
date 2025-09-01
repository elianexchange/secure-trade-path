import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';

const savedItems = [
  {
    id: 'ITM-001',
    name: 'MacBook Pro 16" M3',
    description: 'Latest MacBook Pro with M3 chip, 16GB RAM, 512GB SSD',
    category: 'Electronics',
    estimatedPrice: '$2,499.00',
    priority: 'High',
    status: 'Active',
    dateAdded: '2024-01-15'
  },
  {
    id: 'ITM-002',
    name: 'Office Ergonomic Chair',
    description: 'Herman Miller Aeron chair, size B, graphite color',
    category: 'Furniture',
    estimatedPrice: '$1,200.00',
    priority: 'Medium',
    status: 'Quoted',
    dateAdded: '2024-01-14'
  },
  {
    id: 'ITM-003',
    name: 'iPhone 15 Pro Max',
    description: '256GB, Titanium Blue, unlocked',
    category: 'Electronics',
    estimatedPrice: '$1,199.00',
    priority: 'Low',
    status: 'Draft',
    dateAdded: '2024-01-13'
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-destructive text-destructive-foreground';
    case 'Medium':
      return 'bg-warning text-warning-foreground';
    case 'Low':
      return 'bg-success text-success-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'bg-success text-success-foreground';
    case 'Quoted':
      return 'bg-info text-info-foreground';
    case 'Draft':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function ItemDetails() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Item Details</h1>
          <p className="text-muted-foreground">Manage your desired items and their specifications</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items by name or description..." className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Form */}
      {showForm && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Add New Item</CardTitle>
            <CardDescription>Provide details about the item you want to purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input id="itemName" placeholder="Enter item name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g., Electronics, Furniture" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide detailed specifications and requirements"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="estimatedPrice">Estimated Price</Label>
                <Input id="estimatedPrice" placeholder="$0.00" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Needed By</Label>
                <Input id="deadline" type="date" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button>Save Item</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className="space-y-4">
        {savedItems.map((item) => (
          <Card key={item.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary-light p-2 rounded-lg">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.id}</p>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground font-medium">{item.estimatedPrice}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.dateAdded}</span>
                    </div>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}