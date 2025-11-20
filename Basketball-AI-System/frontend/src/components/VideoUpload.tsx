import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [preview, setPreview] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Force video to show first frame when preview changes
  useEffect(() => {
    if (preview && videoRef.current) {
      const video = videoRef.current;
      video.load(); // Reload video
      video.currentTime = 0.1; // Set to first frame
      video.style.visibility = 'visible';
      video.style.opacity = '1';
    }
  }, [preview]);

  const validateFile = (file: File): string | null => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!validTypes.includes(file.type)) {
      return 'Please upload MP4, MOV, or AVI files only';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
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
    
    // Revoke old preview URL if exists
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    setSelectedFile(file);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);
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
    setPreview('');
    setError('');
    if (preview) {
      URL.revokeObjectURL(preview);
    }
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
            key="preview"
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

            {preview && (
              <div 
                className="w-full rounded-lg bg-black relative overflow-hidden" 
                style={{ 
                  minHeight: '300px',
                  maxHeight: '600px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative',
                  aspectRatio: 'auto'
                }}
              >
                <video
                  ref={videoRef}
                  key={preview}
                  src={preview}
                  controls
                  preload="auto"
                  playsInline
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    maxHeight: '600px',
                    display: 'block',
                    backgroundColor: '#000000',
                    objectFit: 'contain',
                    visibility: 'visible',
                    opacity: '1',
                    margin: '0 auto'
                  }}
                  onError={(e) => {
                    console.error('❌ Video load error:', e);
                    const target = e.currentTarget;
                    const error = target.error;
                    console.error('Video error details:', {
                      error: error ? {
                        message: error.message,
                        code: error.code,
                        name: error.name
                      } : 'No error object',
                      networkState: target.networkState,
                      readyState: target.readyState,
                      src: target.src,
                      currentSrc: target.currentSrc
                    });
                    setError(`Failed to load video preview: ${error?.message || 'Unknown error'}. Please try another file.`);
                  }}
                  onLoadStart={(e) => {
                    console.log('🔄 Video load started');
                  }}
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;
                    const aspectRatio = video.videoWidth / video.videoHeight;
                    const isLandscape = aspectRatio > 1;
                    
                    console.log('✅ Video metadata loaded:', {
                      width: video.videoWidth,
                      height: video.videoHeight,
                      aspectRatio: aspectRatio.toFixed(2),
                      orientation: isLandscape ? 'landscape' : 'portrait',
                      duration: video.duration,
                      readyState: video.readyState
                    });
                    
                    // Adjust container for landscape videos
                    if (isLandscape) {
                      const container = video.parentElement;
                      if (container) {
                        container.style.minHeight = '300px';
                        container.style.maxHeight = '600px';
                        // For landscape, let video determine height based on width
                        video.style.width = '100%';
                        video.style.height = 'auto';
                      }
                    } else {
                      // For portrait, maintain reasonable height
                      const container = video.parentElement;
                      if (container) {
                        container.style.minHeight = '400px';
                        container.style.maxHeight = '800px';
                      }
                    }
                    
                    // Force video to show first frame
                    video.currentTime = 0.1;
                  }}
                  onLoadedData={(e) => {
                    console.log('✅ Video data loaded');
                    const video = e.currentTarget;
                    video.style.visibility = 'visible';
                    video.style.opacity = '1';
                  }}
                  onCanPlay={(e) => {
                    console.log('✅ Video can play');
                    const video = e.currentTarget;
                    video.style.visibility = 'visible';
                    video.style.opacity = '1';
                  }}
                  onCanPlayThrough={(e) => {
                    console.log('✅ Video can play through');
                  }}
                >
                  Your browser does not support the video tag.
                </video>
                {!selectedFile && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <p>Loading video preview...</p>
                  </div>
                )}
              </div>
            )}

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Processing video...
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
                <span>Analyze Video</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

