import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ResponsiveTest() {
  const isMobile = useIsMobile();

  return (
    <Card className="shadow-theme border-primary/20">
      <CardHeader>
        <CardTitle className="text-gradient-primary">Responsive Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg border-primary/20 hover:border-primary/40 transition-colors">
            <h3 className="font-medium text-responsive-sm">Grid Item 1</h3>
            <p className="text-responsive-xs text-muted-foreground">Responsive grid layout</p>
          </div>
          <div className="p-4 border rounded-lg border-primary/20 hover:border-primary/40 transition-colors">
            <h3 className="font-medium text-responsive-sm">Grid Item 2</h3>
            <p className="text-responsive-xs text-muted-foreground">Adapts to screen size</p>
          </div>
          <div className="p-4 border rounded-lg border-primary/20 hover:border-primary/40 transition-colors">
            <h3 className="font-medium text-responsive-sm">Grid Item 3</h3>
            <p className="text-responsive-xs text-muted-foreground">Mobile-first design</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Badge variant="secondary" className="text-responsive-xs bg-gradient-primary text-white">
            Mobile: {isMobile ? 'Yes' : 'No'}
          </Badge>
          <Badge variant="outline" className="text-responsive-xs border-primary text-primary">
            Screen: {typeof window !== 'undefined' ? `${window.innerWidth}px` : 'Unknown'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
