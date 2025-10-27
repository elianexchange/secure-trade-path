import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import OptimizedMessageThread from './OptimizedMessageThread';
import { cn } from '@/lib/utils';

interface ResponsiveMessageContainerProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyRole: 'BUYER' | 'SELLER';
  title?: string;
  className?: string;
}

export default function ResponsiveMessageContainer({
  isOpen,
  onClose,
  transactionId,
  counterpartyId,
  counterpartyName,
  counterpartyRole,
  title = "Chat with Counterparty",
  className
}: ResponsiveMessageContainerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (!isOpen) return null;

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Communicate securely with your transaction partner
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <OptimizedMessageThread
              transactionId={transactionId}
              counterpartyId={counterpartyId}
              counterpartyName={counterpartyName}
              counterpartyRole={counterpartyRole}
              className="h-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Communicate securely with your transaction partner
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 pb-6">
          <OptimizedMessageThread
            transactionId={transactionId}
            counterpartyId={counterpartyId}
            counterpartyName={counterpartyName}
            counterpartyRole={counterpartyRole}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
