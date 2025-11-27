import { useEffect, useRef, useState } from 'react';
import { Video, X, Loader2 } from 'lucide-react';
import { getWebSocketUrl } from '../utils/websocket';

interface RealTimeVisualizationProps {
  videoId: string | null;
  isProcessing: boolean;
  onClose?: () => void;
}

export default function RealTimeVisualization({
  videoId,
  isProcessing,
  onClose
}: RealTimeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) {
      // Close connection if no video ID
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't close connection when processing is done - keep showing frames
    // Only close if videoId changes or component unmounts

    // Connect to WebSocket with dynamic URL
    const wsUrl = getWebSocketUrl(`/ws/video-stream/${videoId}`);
    
    // Only connect if we're processing or if we don't have an existing connection
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Already connected, don't create a new connection
      return;
    }
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Connected to video stream WebSocket');
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'frame' && data.data) {
          // Decode base64 image
          const img = new Image();
          img.onload = () => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                // Set canvas size to match image
                canvasRef.current.width = img.width;
                canvasRef.current.height = img.height;

                // Draw image
                ctx.drawImage(img, 0, 0);
                setFrameCount(prev => prev + 1);
              }
            }
          };
          img.src = `data:image/${data.format || 'jpeg'};base64,${data.data}`;
        }
      } catch (err) {
        console.error('Error processing frame:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Real-time visualization unavailable. Video will still be processed.');
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [videoId, isProcessing]);

  if (!videoId) {
    return null;
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-white font-medium text-sm">
            {isConnected ? 'Live Visualization' : 'Connecting...'}
          </span>
          {isProcessing && (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-4">
          {frameCount > 0 && (
            <span className="text-gray-400 text-xs">
              {frameCount} frames
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas for displaying annotated frames */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
          style={{ display: 'block' }}
        />

        {/* Placeholder when no frames received */}
        {!isConnected && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <Video className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm">Connecting to video stream...</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-black/50">
            <p className="text-sm">{error}</p>
            <p className="text-xs text-gray-500 mt-2">Real-time visualization unavailable</p>
          </div>
        )}

        {/* Info overlay */}
        {isConnected && frameCount > 0 && (
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-xs text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>YOLO Detection + MediaPipe Pose</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

