import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  required = false,
  className,
  minDate,
  maxDate
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date);
      }
    }
  }, [value]);

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatInputValue = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatInputValue(date));
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue) {
      const date = new Date(inputValue);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(date);
        onChange(inputValue);
      }
    } else {
      setSelectedDate(null);
      onChange('');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return true;
    if (minDate && date < new Date(minDate)) return true;
    if (maxDate && date > new Date(maxDate)) return true;
    
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="date-picker" className="text-sm font-medium text-foreground">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id="date-picker"
          type="date"
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
        />
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-auto p-0" align="start">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="h-8 w-8 p-0 hover:bg-primary/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <h3 className="font-semibold text-foreground">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="h-8 w-8 p-0 hover:bg-primary/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {daysOfWeek.map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="bg-white h-10" />;
                  }
                  
                  const disabled = isDateDisabled(day);
                  const selected = isDateSelected(day);
                  const today = isToday(day);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => !disabled && handleDateSelect(day)}
                      disabled={disabled}
                      className={cn(
                        "h-10 text-sm transition-colors relative",
                        "hover:bg-primary/10 focus:bg-primary/10 focus:outline-none",
                        disabled && "text-gray-400 cursor-not-allowed hover:bg-transparent",
                        !disabled && "text-gray-900 hover:text-primary",
                        selected && "bg-primary text-white hover:bg-primary/90",
                        today && !selected && "bg-primary/20 text-primary font-semibold"
                      )}
                    >
                      {day.getDate()}
                      {today && !selected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Today: {new Date().toLocaleDateString()}</span>
                  {selectedDate && (
                    <span>Selected: {formatDisplayDate(selectedDate)}</span>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
