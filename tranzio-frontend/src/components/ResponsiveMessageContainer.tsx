import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, X } from 'lucide-react';
import EnhancedMessageThread from './EnhancedMessageThread';
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
        <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col h-full">
          <div className="flex-1 overflow-hidden min-h-0">
            <EnhancedMessageThread
              transactionId={transactionId}
              counterpartyId={counterpartyId}
              counterpartyName={counterpartyName}
              counterpartyRole={counterpartyRole}
              onClose={onClose}
              className="h-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col">
        <div className="flex-1 overflow-hidden min-h-0">
          <EnhancedMessageThread
            transactionId={transactionId}
            counterpartyId={counterpartyId}
            counterpartyName={counterpartyName}
            counterpartyRole={counterpartyRole}
            onClose={onClose}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
