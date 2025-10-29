import { disputeService, DisputeEvidence } from './disputeService';

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface MetadataExtractionResult {
  extracted: boolean;
  metadata: Record<string, any>;
  errors: string[];
}

export interface ChainOfCustodyEntry {
  id: string;
  evidenceId: string;
  action: 'UPLOADED' | 'VIEWED' | 'DOWNLOADED' | 'MODIFIED' | 'DELETED' | 'VERIFIED';
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

export interface EvidenceAuditTrail {
  evidenceId: string;
  entries: ChainOfCustodyEntry[];
  totalViews: number;
  totalDownloads: number;
  lastAccessed: string;
  isTampered: boolean;
  tamperEvidence?: string[];
}

export interface FileTypeConfig {
  type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO';
  allowedExtensions: string[];
  maxSize: number; // in bytes
  mimeTypes: string[];
  requiresMetadata: boolean;
  validationRules: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    maxDuration?: number; // for video/audio
    allowedFormats?: string[];
  };
}

class EvidenceService {
  private fileTypeConfigs: FileTypeConfig[] = [];
  private chainOfCustody: Map<string, ChainOfCustodyEntry[]> = new Map();
  private auditTrails: Map<string, EvidenceAuditTrail> = new Map();

  constructor() {
    this.initializeFileTypeConfigs();
  }

  private initializeFileTypeConfigs() {
    this.fileTypeConfigs = [
      {
        type: 'IMAGE',
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
        maxSize: 10 * 1024 * 1024, // 10MB
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'],
        requiresMetadata: true,
        validationRules: {
          minWidth: 100,
          maxWidth: 8000,
          minHeight: 100,
          maxHeight: 8000,
          allowedFormats: ['JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'SVG']
        }
      },
      {
        type: 'DOCUMENT',
        allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
        maxSize: 50 * 1024 * 1024, // 50MB
        mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text'],
        requiresMetadata: false,
        validationRules: {
          allowedFormats: ['PDF', 'DOC', 'DOCX', 'TXT', 'RTF', 'ODT']
        }
      },
      {
        type: 'VIDEO',
        allowedExtensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
        maxSize: 500 * 1024 * 1024, // 500MB
        mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm'],
        requiresMetadata: true,
        validationRules: {
          minWidth: 320,
          maxWidth: 4096,
          minHeight: 240,
          maxHeight: 2160,
          maxDuration: 600, // 10 minutes
          allowedFormats: ['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM']
        }
      },
      {
        type: 'AUDIO',
        allowedExtensions: ['.mp3', '.wav', '.aac', '.ogg', '.m4a'],
        maxSize: 100 * 1024 * 1024, // 100MB
        mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/mp4'],
        requiresMetadata: true,
        validationRules: {
          maxDuration: 1800, // 30 minutes
          allowedFormats: ['MP3', 'WAV', 'AAC', 'OGG', 'M4A']
        }
      }
    ];
  }

  // Validate file before upload
  async validateFile(file: File, evidenceType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO'): Promise<FileValidationResult> {
    const config = this.fileTypeConfigs.find(c => c.type === evidenceType);
    if (!config) {
      return {
        isValid: false,
        errors: ['Invalid evidence type'],
        warnings: [],
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension ${fileExtension} is not allowed for ${evidenceType} evidence`);
    }

    // Check MIME type
    if (!config.mimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed for ${evidenceType} evidence`);
    }

    // Check file size
    if (file.size > config.maxSize) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(config.maxSize)}`);
    }

    // Check file size warnings
    if (file.size > config.maxSize * 0.8) {
      warnings.push(`File size is close to the maximum allowed size`);
    }

    // Additional validation for images
    if (evidenceType === 'IMAGE' && config.requiresMetadata) {
      try {
        const imageMetadata = await this.extractImageMetadata(file);
        if (imageMetadata.extracted) {
          const { width, height } = imageMetadata.metadata;
          
          if (width && height) {
            if (config.validationRules.minWidth && width < config.validationRules.minWidth) {
              errors.push(`Image width ${width}px is below minimum ${config.validationRules.minWidth}px`);
            }
            if (config.validationRules.maxWidth && width > config.validationRules.maxWidth) {
              errors.push(`Image width ${width}px exceeds maximum ${config.validationRules.maxWidth}px`);
            }
            if (config.validationRules.minHeight && height < config.validationRules.minHeight) {
              errors.push(`Image height ${height}px is below minimum ${config.validationRules.minHeight}px`);
            }
            if (config.validationRules.maxHeight && height > config.validationRules.maxHeight) {
              errors.push(`Image height ${height}px exceeds maximum ${config.validationRules.maxHeight}px`);
            }
          }
        }
      } catch (error) {
        warnings.push('Could not extract image metadata for validation');
      }
    }

    // Additional validation for video/audio
    if ((evidenceType === 'VIDEO' || evidenceType === 'AUDIO') && config.requiresMetadata) {
      try {
        const mediaMetadata = await this.extractMediaMetadata(file);
        if (mediaMetadata.extracted) {
          const { duration } = mediaMetadata.metadata;
          
          if (duration && config.validationRules.maxDuration) {
            if (duration > config.validationRules.maxDuration) {
              errors.push(`Media duration ${Math.round(duration)}s exceeds maximum ${config.validationRules.maxDuration}s`);
            }
          }
        }
      } catch (error) {
        warnings.push('Could not extract media metadata for validation');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }

  // Extract metadata from files
  async extractImageMetadata(file: File): Promise<MetadataExtractionResult> {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            
            // Extract basic metadata
            const metadata = {
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: img.naturalWidth / img.naturalHeight,
              fileSize: file.size,
              lastModified: new Date(file.lastModified).toISOString(),
              mimeType: file.type
            };

            // Try to extract EXIF data if available
            this.extractEXIFData(file).then(exifData => {
              resolve({
                extracted: true,
                metadata: { ...metadata, exif: exifData },
                errors: []
              });
            }).catch(() => {
              resolve({
                extracted: true,
                metadata,
                errors: []
              });
            });
          } else {
            resolve({
              extracted: false,
              metadata: {},
              errors: ['Could not create canvas context']
            });
          }
        } catch (error) {
          resolve({
            extracted: false,
            metadata: {},
            errors: ['Error processing image metadata']
          });
        }
      };

      img.onerror = () => {
        resolve({
          extracted: false,
          metadata: {},
          errors: ['Could not load image for metadata extraction']
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async extractMediaMetadata(file: File): Promise<MetadataExtractionResult> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const audio = document.createElement('audio');

      const extractVideoMetadata = () => {
        return new Promise<Record<string, any>>((resolveVideo) => {
          video.onloadedmetadata = () => {
            resolveVideo({
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              fileSize: file.size,
              lastModified: new Date(file.lastModified).toISOString(),
              mimeType: file.type
            });
          };
          video.onerror = () => resolveVideo({});
          video.src = URL.createObjectURL(file);
        });
      };

      const extractAudioMetadata = () => {
        return new Promise<Record<string, any>>((resolveAudio) => {
          audio.onloadedmetadata = () => {
            resolveAudio({
              duration: audio.duration,
              fileSize: file.size,
              lastModified: new Date(file.lastModified).toISOString(),
              mimeType: file.type
            });
          };
          audio.onerror = () => resolveAudio({});
          audio.src = URL.createObjectURL(file);
        });
      };

      if (file.type.startsWith('video/')) {
        extractVideoMetadata().then(metadata => {
          resolve({
            extracted: Object.keys(metadata).length > 0,
            metadata,
            errors: []
          });
        });
      } else if (file.type.startsWith('audio/')) {
        extractAudioMetadata().then(metadata => {
          resolve({
            extracted: Object.keys(metadata).length > 0,
            metadata,
            errors: []
          });
        });
      } else {
        resolve({
          extracted: false,
          metadata: {},
          errors: ['Unsupported media type']
        });
      }
    });
  }

  async extractEXIFData(file: File): Promise<Record<string, any>> {
    // This is a simplified EXIF extraction
    // In a real implementation, you'd use a library like exif-js or piexifjs
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const dataView = new DataView(arrayBuffer);
          
          // Basic EXIF header check
          if (dataView.getUint16(0) === 0xFFD8) { // JPEG marker
            // Look for EXIF marker (0xFFE1)
            for (let i = 2; i < arrayBuffer.byteLength - 1; i++) {
              if (dataView.getUint16(i) === 0xFFE1) {
                // Found EXIF data
                const exifData = this.parseEXIFData(dataView, i + 2);
                resolve(exifData);
                return;
              }
            }
          }
          resolve({});
        } catch (error) {
          resolve({});
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  private parseEXIFData(dataView: DataView, offset: number): Record<string, any> {
    // Simplified EXIF parsing
    // In a real implementation, you'd use a proper EXIF library
    const exifData: Record<string, any> = {};
    
    try {
      // Check for EXIF header
      const exifHeader = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3)
      );
      
      if (exifHeader === 'Exif') {
        // Basic EXIF data extraction would go here
        exifData.hasExif = true;
        exifData.orientation = this.getEXIFOrientation(dataView, offset + 6);
        exifData.camera = this.getEXIFCamera(dataView, offset + 6);
        exifData.gps = this.getEXIFGPS(dataView, offset + 6);
      }
    } catch (error) {
      // Ignore EXIF parsing errors
    }
    
    return exifData;
  }

  private getEXIFOrientation(dataView: DataView, offset: number): number {
    // Simplified orientation extraction
    try {
      // Look for orientation tag (0x0112)
      return 1; // Default orientation
    } catch (error) {
      return 1;
    }
  }

  private getEXIFCamera(dataView: DataView, offset: number): Record<string, any> {
    // Simplified camera data extraction
    return {
      make: '',
      model: '',
      software: ''
    };
  }

  private getEXIFGPS(dataView: DataView, offset: number): Record<string, any> {
    // Simplified GPS data extraction
    return {
      latitude: null,
      longitude: null,
      altitude: null
    };
  }

  // Chain of custody management
  addChainOfCustodyEntry(evidenceId: string, action: ChainOfCustodyEntry['action'], userId: string, userName: string, notes?: string): ChainOfCustodyEntry {
    const entry: ChainOfCustodyEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      evidenceId,
      action,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      notes
    };

    const existingEntries = this.chainOfCustody.get(evidenceId) || [];
    existingEntries.push(entry);
    this.chainOfCustody.set(evidenceId, existingEntries);

    // Update audit trail
    this.updateAuditTrail(evidenceId, entry);

    return entry;
  }

  getChainOfCustody(evidenceId: string): ChainOfCustodyEntry[] {
    return this.chainOfCustody.get(evidenceId) || [];
  }

  getAuditTrail(evidenceId: string): EvidenceAuditTrail | null {
    return this.auditTrails.get(evidenceId) || null;
  }

  private updateAuditTrail(evidenceId: string, entry: ChainOfCustodyEntry) {
    const existingTrail = this.auditTrails.get(evidenceId);
    const entries = this.chainOfCustody.get(evidenceId) || [];

    const auditTrail: EvidenceAuditTrail = {
      evidenceId,
      entries,
      totalViews: entries.filter(e => e.action === 'VIEWED').length,
      totalDownloads: entries.filter(e => e.action === 'DOWNLOADED').length,
      lastAccessed: entry.timestamp,
      isTampered: this.checkForTampering(entries),
      tamperEvidence: this.checkForTampering(entries) ? this.getTamperEvidence(entries) : undefined
    };

    this.auditTrails.set(evidenceId, auditTrail);
  }

  private checkForTampering(entries: ChainOfCustodyEntry[]): boolean {
    // Check for suspicious patterns that might indicate tampering
    const suspiciousPatterns = [
      // Multiple rapid downloads
      this.checkRapidDownloads(entries),
      // Unusual access patterns
      this.checkUnusualAccess(entries),
      // Missing expected entries
      this.checkMissingEntries(entries)
    ];

    return suspiciousPatterns.some(pattern => pattern);
  }

  private checkRapidDownloads(entries: ChainOfCustodyEntry[]): boolean {
    const downloads = entries.filter(e => e.action === 'DOWNLOADED');
    if (downloads.length < 2) return false;

    // Check for downloads within 5 minutes of each other
    for (let i = 1; i < downloads.length; i++) {
      const timeDiff = new Date(downloads[i].timestamp).getTime() - new Date(downloads[i - 1].timestamp).getTime();
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        return true;
      }
    }

    return false;
  }

  private checkUnusualAccess(entries: ChainOfCustodyEntry[]): boolean {
    // Check for access outside business hours (simplified)
    const businessHours = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9 AM to 5 PM
    const unusualAccess = entries.filter(entry => {
      const hour = new Date(entry.timestamp).getHours();
      return !businessHours.includes(hour);
    });

    return unusualAccess.length > entries.length * 0.3; // More than 30% outside business hours
  }

  private checkMissingEntries(entries: ChainOfCustodyEntry[]): boolean {
    // Check for missing expected entries
    const hasUpload = entries.some(e => e.action === 'UPLOADED');
    const hasView = entries.some(e => e.action === 'VIEWED');
    
    // If there are views but no upload, something's wrong
    return hasView && !hasUpload;
  }

  private getTamperEvidence(entries: ChainOfCustodyEntry[]): string[] {
    const evidence: string[] = [];

    if (this.checkRapidDownloads(entries)) {
      evidence.push('Multiple rapid downloads detected');
    }

    if (this.checkUnusualAccess(entries)) {
      evidence.push('Unusual access patterns detected');
    }

    if (this.checkMissingEntries(entries)) {
      evidence.push('Missing expected chain of custody entries');
    }

    return evidence;
  }

  private getClientIP(): string {
    // In a real implementation, this would be provided by the backend
    return 'unknown';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Upload evidence with validation and metadata extraction
  async uploadEvidence(
    disputeId: string,
    file: File,
    evidenceType: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO',
    description?: string,
    userId?: string,
    userName?: string
  ): Promise<{
    success: boolean;
    data?: DisputeEvidence;
    error?: string;
  }> {
    try {
      // Validate file
      const validation = await this.validateFile(file, evidenceType);
      if (!validation.isValid) {
        return {
          success: false,
          error: `File validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Extract metadata
      let metadata: Record<string, any> = {};
      if (evidenceType === 'IMAGE') {
        const imageMetadata = await this.extractImageMetadata(file);
        if (imageMetadata.extracted) {
          metadata = imageMetadata.metadata;
        }
      } else if (evidenceType === 'VIDEO' || evidenceType === 'AUDIO') {
        const mediaMetadata = await this.extractMediaMetadata(file);
        if (mediaMetadata.extracted) {
          metadata = mediaMetadata.metadata;
        }
      }

      // Upload file (this would typically call your file upload service)
      const fileUrl = await this.uploadFile(file);

      // Create evidence record
      const evidence: DisputeEvidence = {
        id: `evidence_${Date.now()}`,
        fileName: file.name,
        fileType: evidenceType,
        fileUrl,
        description,
        uploadedBy: userId || 'unknown',
        uploadedAt: new Date().toISOString(),
        metadata
      };

      // Add to chain of custody
      if (userId && userName) {
        this.addChainOfCustodyEntry(evidence.id, 'UPLOADED', userId, userName, 'Evidence uploaded');
      }

      // Call dispute service to add evidence
      const result = await disputeService.addEvidence(disputeId, {
        fileName: evidence.fileName,
        fileType: evidence.fileType,
        fileUrl: evidence.fileUrl,
        description: evidence.description
      });

      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: 'Failed to add evidence to dispute'
        };
      }
    } catch (error) {
      console.error('Error uploading evidence:', error);
      return {
        success: false,
        error: 'An error occurred while uploading evidence'
      };
    }
  }

  private async uploadFile(file: File): Promise<string> {
    // This would typically call your file upload service
    // For now, we'll create a mock URL
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/uploads/${file.name}`);
      }, 1000);
    });
  }

  // Get file type configuration
  getFileTypeConfig(type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO'): FileTypeConfig | null {
    return this.fileTypeConfigs.find(config => config.type === type) || null;
  }

  // Get all file type configurations
  getAllFileTypeConfigs(): FileTypeConfig[] {
    return this.fileTypeConfigs;
  }

  // Generate evidence report
  generateEvidenceReport(evidenceId: string): {
    evidence: DisputeEvidence | null;
    auditTrail: EvidenceAuditTrail | null;
    chainOfCustody: ChainOfCustodyEntry[];
    report: string;
  } {
    const chainOfCustody = this.getChainOfCustody(evidenceId);
    const auditTrail = this.getAuditTrail(evidenceId);

    let report = `Evidence Report for ${evidenceId}\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    if (auditTrail) {
      report += `Total Views: ${auditTrail.totalViews}\n`;
      report += `Total Downloads: ${auditTrail.totalDownloads}\n`;
      report += `Last Accessed: ${auditTrail.lastAccessed}\n`;
      report += `Tampered: ${auditTrail.isTampered ? 'Yes' : 'No'}\n\n`;

      if (auditTrail.isTampered && auditTrail.tamperEvidence) {
        report += `Tamper Evidence:\n`;
        auditTrail.tamperEvidence.forEach(evidence => {
          report += `- ${evidence}\n`;
        });
        report += '\n';
      }
    }

    report += `Chain of Custody:\n`;
    chainOfCustody.forEach((entry, index) => {
      report += `${index + 1}. ${entry.action} by ${entry.userName} at ${entry.timestamp}\n`;
      if (entry.notes) {
        report += `   Notes: ${entry.notes}\n`;
      }
    });

    return {
      evidence: null, // Would be populated from dispute service
      auditTrail,
      chainOfCustody,
      report
    };
  }
}

export const evidenceService = new EvidenceService();
