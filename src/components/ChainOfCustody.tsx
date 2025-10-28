import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  User,
  FileText,
  Download as DownloadIcon
} from 'lucide-react';
import { evidenceService, ChainOfCustodyEntry, EvidenceAuditTrail } from '@/services/evidenceService';

interface ChainOfCustodyProps {
  evidenceId: string;
  className?: string;
}

export default function ChainOfCustody({ evidenceId, className = '' }: ChainOfCustodyProps) {
  const [chainOfCustody, setChainOfCustody] = useState<ChainOfCustodyEntry[]>([]);
  const [auditTrail, setAuditTrail] = useState<EvidenceAuditTrail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChainOfCustody();
  }, [evidenceId]);

  const loadChainOfCustody = () => {
    try {
      const entries = evidenceService.getChainOfCustody(evidenceId);
      const trail = evidenceService.getAuditTrail(evidenceId);
      
      setChainOfCustody(entries);
      setAuditTrail(trail);
    } catch (error) {
      console.error('Error loading chain of custody:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPLOADED':
        return <Upload className="h-4 w-4" />;
      case 'VIEWED':
        return <Eye className="h-4 w-4" />;
      case 'DOWNLOADED':
        return <Download className="h-4 w-4" />;
      case 'MODIFIED':
        return <Edit className="h-4 w-4" />;
      case 'DELETED':
        return <Trash2 className="h-4 w-4" />;
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'UPLOADED':
        return 'bg-green-100 text-green-800';
      case 'VIEWED':
        return 'bg-blue-100 text-blue-800';
      case 'DOWNLOADED':
        return 'bg-orange-100 text-orange-800';
      case 'MODIFIED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETED':
        return 'bg-red-100 text-red-800';
      case 'VERIFIED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const generateReport = () => {
    const report = evidenceService.generateEvidenceReport(evidenceId);
    
    // Create and download report file
    const blob = new Blob([report.report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-report-${evidenceId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Audit Trail Summary */}
      {auditTrail && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Evidence Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{auditTrail.totalViews}</div>
                <div className="text-sm text-gray-600">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{auditTrail.totalDownloads}</div>
                <div className="text-sm text-gray-600">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {new Date(auditTrail.lastAccessed).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">Last Accessed</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${auditTrail.isTampered ? 'text-red-600' : 'text-green-600'}`}>
                  {auditTrail.isTampered ? 'Yes' : 'No'}
                </div>
                <div className="text-sm text-gray-600">Tampered</div>
              </div>
            </div>

            {auditTrail.isTampered && auditTrail.tamperEvidence && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div className="font-medium text-red-900 mb-2">Tampering Detected:</div>
                  <ul className="list-disc list-inside text-sm text-red-800">
                    {auditTrail.tamperEvidence.map((evidence, index) => (
                      <li key={index}>{evidence}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chain of Custody Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Chain of Custody</CardTitle>
            <Button onClick={generateReport} variant="outline" size="sm">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {chainOfCustody.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Chain of Custody</h3>
              <p className="text-gray-600">Chain of custody entries will appear here as evidence is accessed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chainOfCustody.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${getActionColor(entry.action)}`}>
                      {getActionIcon(entry.action)}
                    </div>
                    {index < chainOfCustody.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Entry details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                      <User className="h-4 w-4" />
                      <span>{entry.userName}</span>
                      {entry.ipAddress && entry.ipAddress !== 'unknown' && (
                        <>
                          <span>•</span>
                          <span>IP: {entry.ipAddress}</span>
                        </>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                    )}

                    {entry.userAgent && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Technical Details
                        </summary>
                        <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <div>User Agent: {entry.userAgent}</div>
                          <div>Entry ID: {entry.id}</div>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Chain of Custody Integrity</h4>
              <p className="text-sm text-blue-800">
                This chain of custody record provides a complete audit trail of all evidence access and modifications. 
                Any tampering or unauthorized access will be detected and flagged. This record is legally admissible 
                and cannot be modified without detection.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
