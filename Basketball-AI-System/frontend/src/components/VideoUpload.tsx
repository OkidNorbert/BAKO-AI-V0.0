import { useState, useCallback } from 'react';
import { Upload, Film, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

interface VideoUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  progress?: number;
}

export default function VideoUpload({ onUpload, isUploading = false, progress = 0 }: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): string | null => {
    // Check file extension (backend validates by extension)
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    // Also check MIME type as secondary validation
    const validMimeTypes = [
      'video/mp4', 
      'video/quicktime',  // MOV
      'video/x-msvideo', // AVI
      'video/x-matroska' // MKV
    ];
    
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!hasValidExtension && !validMimeTypes.includes(file.type)) {
      return `Please upload MP4, MOV, AVI, or MKV files only. Current file: ${file.name}`;
    }

    if (file.size === 0) {
      return 'File is empty. Please select a valid video file.';
    }

    if (file.size > maxSize) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum of 500MB`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError('');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200',
              isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500',
              error && 'border-red-500'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              id="video-upload"
              className="hidden"
              accept="video/mp4,video/quicktime,video/x-msvideo"
              onChange={handleFileInput}
            />

            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="flex flex-col items-center justify-center space-y-4">
                <motion.div
                  animate={{ y: isDragging ? -10 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload className={cn(
                    'w-16 h-16 transition-colors',
                    isDragging ? 'text-primary-500' : 'text-gray-400'
                  )} />
                </motion.div>

                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    {isDragging ? 'Drop video here' : 'Drag & drop your basketball video'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or click to browse
                  </p>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Film className="w-4 h-4" />
                    <span>MP4, MOV, AVI</span>
                  </div>
                  <div>Max 500MB</div>
                  <div>5-10 seconds</div>
                </div>
              </div>
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 flex items-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Film className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={clearFile}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Processing video... Real-time analysis will appear below
                  </span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpload}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Start Analysis</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

