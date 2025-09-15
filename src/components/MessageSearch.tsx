import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  MessageCircle, 
  FileText, 
  Clock,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useMessages } from '@/contexts/MessageContext';
import { MessageSearchResult } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface MessageSearchProps {
  transactionId?: string;
  onResultClick: (result: MessageSearchResult) => void;
  onClose: () => void;
}

export default function MessageSearch({ 
  transactionId, 
  onResultClick, 
  onClose 
}: MessageSearchProps) {
  const { searchMessages } = useMessages();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MessageSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    messageType: 'all',
    dateRange: 'all',
    hasAttachments: false
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load search history from localStorage
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('tranzio_search_history') || '[]');
    setSearchHistory(history);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await searchMessages(query, transactionId);
      
      // Apply filters
      let filteredResults = searchResults;
      
      if (filters.messageType !== 'all') {
        filteredResults = filteredResults.filter(result => 
          result.message.messageType === filters.messageType
        );
      }
      
      if (filters.hasAttachments) {
        filteredResults = filteredResults.filter(result => 
          result.message.attachments && result.message.attachments.length > 0
        );
      }
      
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            cutoffDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        filteredResults = filteredResults.filter(result => 
          new Date(result.message.timestamp) >= cutoffDate
        );
      }

      setResults(filteredResults);
      
      // Add to search history
      if (!searchHistory.includes(query)) {
        const newHistory = [query, ...searchHistory.slice(0, 9)];
        setSearchHistory(newHistory);
        localStorage.setItem('tranzio_search_history', JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'FILE':
        return <FileText className="h-4 w-4" />;
      case 'SYSTEM':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessageTypeLabel = (messageType: string) => {
    switch (messageType) {
      case 'FILE':
        return 'File';
      case 'SYSTEM':
        return 'System';
      default:
        return 'Text';
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Search Messages</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filters
          </Button>
          
          {results.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/20 rounded-lg">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={filters.messageType}
                onChange={(e) => setFilters(prev => ({ ...prev, messageType: e.target.value }))}
                className="w-full mt-1 text-xs border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="TEXT">Text</option>
                <option value="FILE">File</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full mt-1 text-xs border rounded px-2 py-1"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center space-x-2 text-xs">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasAttachments: e.target.checked }))}
                  className="rounded"
                />
                <span>Has Files</span>
              </label>
            </div>
          </div>
        )}

        {/* Search History */}
        {!query && searchHistory.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Searches</h4>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((historyQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchHistoryClick(historyQuery)}
                  className="text-xs h-7"
                >
                  {historyQuery}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={`${result.message.id}-${index}`}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onResultClick(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getMessageTypeIcon(result.message.messageType)}
                      <Badge variant="secondary" className="text-xs">
                        {getMessageTypeLabel(result.message.messageType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(result.message.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p 
                      className="text-sm text-foreground"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(result.message.content, query)
                      }}
                    />
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      Transaction: {result.conversation.transactionId.slice(-8)}
                    </p>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isSearching && query && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No messages found for "{query}"</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
