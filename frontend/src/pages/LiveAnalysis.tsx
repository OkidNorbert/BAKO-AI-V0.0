import React, { useEffect, useRef, useState } from 'react';
import { Camera, Video, Activity, AlertCircle, ArrowLeft } from 'lucide-react';
import { getWebSocketUrl } from '../utils/websocket';

interface AnalysisResult {
    action: {
        label: string;
        confidence: number;
    };
    metrics: {
        jump_height: number;
        movement_speed: number;
        form_score: number;
        pose_stability: number;
    };
    annotated_frame?: string;
}

const LiveAnalysis: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [fps, setFps] = useState(0);

    useEffect(() => {
        return () => {
            stopStream();
        };
    }, []);

    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                setIsStreaming(true);
                setError(null);
                connectWebSocket();
            }
        } catch (err) {
            setError("Could not access camera. Please ensure you have granted permission.");
            console.error(err);
        }
    };

    const stopStream = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsStreaming(false);
        setResult(null);
    };

    const connectWebSocket = () => {
        const wsUrl = getWebSocketUrl('/ws/analyze');
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to analysis server');
            startSendingFrames();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setResult(data);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setError("Live analysis unavailable. Please try uploading a video instead.");
        };

        wsRef.current = ws;
    };

    const startSendingFrames = () => {
        if (!videoRef.current || !canvasRef.current || !wsRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        let lastTime = Date.now();
        let frameCount = 0;

        const sendFrame = () => {
            if (!isStreaming || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

            if (videoRef.current && ctx && canvasRef.current) {
                // Draw video frame to canvas
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);

                // Convert to base64
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.7);

                // Send to server
                wsRef.current.send(dataUrl);

                // Calculate FPS
                frameCount++;
                const now = Date.now();
                if (now - lastTime >= 1000) {
                    setFps(frameCount);
                    frameCount = 0;
                    lastTime = now;
                }
            }

            requestAnimationFrame(sendFrame);
        };

        sendFrame();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-500" />
                            Live Analysis
                        </h1>
                        <p className="text-gray-400 mt-2">Real-time basketball performance tracking</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-gray-800 shadow-2xl">
                        {!isStreaming && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                <Camera className="w-16 h-16 mb-4 opacity-50" />
                                <p>Camera is inactive</p>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 bg-gray-900/90 z-10">
                                <AlertCircle className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium">{error}</p>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            className={`w - full h - full object - cover ${result?.annotated_frame ? 'hidden' : ''} `}
                            playsInline
                            muted
                        />

                        {/* Annotated Frame Overlay */}
                        {result?.annotated_frame && (
                            <img
                                src={`data: image / jpeg; base64, ${result.annotated_frame} `}
                                className="w-full h-full object-cover absolute inset-0"
                                alt="Analysis Overlay"
                            />
                        )}

                        {/* Overlay */}
                        {result && (
                            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/10 z-20">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-sm font-medium text-red-400">LIVE • {fps} FPS</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {result.action.label.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div className="text-sm text-gray-400">
                                    Confidence: {(result.action.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex gap-4">
                        {!isStreaming ? (
                            <button
                                onClick={startStream}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                <Camera className="w-5 h-5" />
                                Start Camera
                            </button>
                        ) : (
                            <button
                                onClick={stopStream}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                            >
                                <Video className="w-5 h-5" />
                                Stop Camera
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-400" />
                            Real-time Metrics
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Jump Height</span>
                                    <span className="text-white font-mono">{result?.metrics.jump_height.toFixed(2) || '0.00'}m</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${Math.min((result?.metrics.jump_height || 0) * 100, 100)}% ` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Movement Speed</span>
                                    <span className="text-white font-mono">{result?.metrics.movement_speed.toFixed(1) || '0.0'}m/s</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-300"
                                        style={{ width: `${Math.min((result?.metrics.movement_speed || 0) * 20, 100)}% ` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Form Score</span>
                                    <span className="text-white font-mono">{((result?.metrics.form_score || 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 transition-all duration-300"
                                        style={{ width: `${(result?.metrics.form_score || 0) * 100}% ` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Stability</span>
                                    <span className="text-white font-mono">{((result?.metrics.pose_stability || 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 transition-all duration-300"
                                        style={{ width: `${(result?.metrics.pose_stability || 0) * 100}% ` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveAnalysis;
