/**
 * WebSocket utility functions for Basketball AI
 */

/**
 * Get WebSocket URL from HTTP API URL
 * Converts http://localhost:8000 -> ws://localhost:8000
 * Converts https://tunnel.trycloudflare.com -> wss://tunnel.trycloudflare.com
 * 
 * @param path - WebSocket endpoint path (e.g., '/ws/video-stream/123')
 * @returns Full WebSocket URL with correct protocol
 */
export function getWebSocketUrl(path: string): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Convert HTTP(S) to WS(S)
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = apiUrl.replace(/^https?:\/\//, '');

    // Remove trailing slash from base URL
    const cleanBase = baseUrl.replace(/\/$/, '');

    // Remove leading slash from path
    const cleanPath = path.replace(/^\//, '');

    const wsUrl = `${wsProtocol}://${cleanBase}/${cleanPath}`;

    console.log(`🔌 WebSocket URL: ${wsUrl}`);
    return wsUrl;
}
