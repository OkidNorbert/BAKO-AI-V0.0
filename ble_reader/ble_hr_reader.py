#!/usr/bin/env python3
"""
BLE Heart Rate Monitor Reader for Linux
Connects to BLE heart rate monitors and streams data to the backend.
"""

import asyncio
import logging
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any
import requests
from bleak import BleakClient, BleakScanner
from bleak.backends.device import BLEDevice

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
API_TOKEN = os.getenv("API_TOKEN", "")  # JWT token for authentication
PLAYER_ID = int(os.getenv("PLAYER_ID", "1"))
DEVICE_NAME_FILTER = os.getenv("DEVICE_NAME_FILTER", "")  # Filter by device name
SCAN_TIMEOUT = 10  # seconds


class BLEHeartRateReader:
    """BLE Heart Rate Monitor Reader."""
    
    def __init__(self, backend_url: str, api_token: str, player_id: int):
        self.backend_url = backend_url
        self.api_token = api_token
        self.player_id = player_id
        self.client: Optional[BleakClient] = None
        self.device: Optional[BLEDevice] = None
        self.is_connected = False
        
    async def scan_for_devices(self) -> list[BLEDevice]:
        """Scan for BLE heart rate monitors."""
        logger.info("🔍 Scanning for BLE devices...")
        
        devices = await BleakScanner.discover(timeout=SCAN_TIMEOUT)
        hr_devices = []
        
        for device in devices:
            # Filter for heart rate monitors
            if self._is_heart_rate_device(device):
                hr_devices.append(device)
                logger.info(f"📱 Found HR device: {device.name} ({device.address})")
        
        return hr_devices
    
    def _is_heart_rate_device(self, device: BLEDevice) -> bool:
        """Check if device is a heart rate monitor."""
        if not device.name:
            return False
        
        # Common heart rate monitor names
        hr_keywords = [
            "heart", "hr", "polar", "wahoo", "garmin", "fitbit", 
            "tickr", "rhythm", "chest", "strap", "monitor"
        ]
        
        name_lower = device.name.lower()
        return any(keyword in name_lower for keyword in hr_keywords)
    
    async def connect_to_device(self, device: BLEDevice) -> bool:
        """Connect to a BLE heart rate monitor."""
        try:
            logger.info(f"🔗 Connecting to {device.name} ({device.address})...")
            
            self.client = BleakClient(device.address)
            await self.client.connect()
            
            # Check if heart rate service is available
            services = await self.client.get_services()
            if "0000180d-0000-1000-8000-00805f9b34fb" not in [str(s.uuid) for s in services]:
                logger.warning("⚠️ Heart rate service not found on device")
                await self.client.disconnect()
                return False
            
            self.device = device
            self.is_connected = True
            logger.info(f"✅ Connected to {device.name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to {device.name}: {e}")
            return False
    
    async def start_heart_rate_monitoring(self):
        """Start monitoring heart rate data."""
        if not self.client or not self.is_connected:
            logger.error("❌ Not connected to any device")
            return
        
        try:
            # Heart Rate Service UUID
            HR_SERVICE_UUID = "0000180d-0000-1000-8000-00805f9b34fb"
            # Heart Rate Measurement Characteristic UUID
            HR_CHARACTERISTIC_UUID = "00002a37-0000-1000-8000-00805f9b34fb"
            
            logger.info("💓 Starting heart rate monitoring...")
            
            def heart_rate_callback(sender, data):
                """Callback for heart rate data."""
                try:
                    # Parse heart rate data
                    heart_rate = self._parse_heart_rate_data(data)
                    if heart_rate:
                        asyncio.create_task(self._send_heart_rate_data(heart_rate))
                except Exception as e:
                    logger.error(f"❌ Error parsing heart rate data: {e}")
            
            # Start notifications
            await self.client.start_notify(HR_CHARACTERISTIC_UUID, heart_rate_callback)
            logger.info("✅ Heart rate monitoring started")
            
            # Keep monitoring until interrupted
            try:
                while self.is_connected:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                logger.info("🛑 Stopping heart rate monitoring...")
            finally:
                await self.client.stop_notify(HR_CHARACTERISTIC_UUID)
                
        except Exception as e:
            logger.error(f"❌ Error in heart rate monitoring: {e}")
    
    def _parse_heart_rate_data(self, data: bytearray) -> Optional[int]:
        """Parse heart rate data from BLE characteristic."""
        try:
            # Heart rate format: flags (1 byte) + heart rate (1-2 bytes)
            if len(data) < 2:
                return None
            
            flags = data[0]
            heart_rate = data[1]
            
            # If bit 0 of flags is set, heart rate is 16-bit
            if flags & 0x01:
                if len(data) >= 3:
                    heart_rate = int.from_bytes(data[1:3], byteorder='little')
            
            return heart_rate if 30 <= heart_rate <= 220 else None
            
        except Exception as e:
            logger.error(f"❌ Error parsing heart rate data: {e}")
            return None
    
    async def _send_heart_rate_data(self, heart_rate: int):
        """Send heart rate data to backend."""
        try:
            payload = {
                "player_id": self.player_id,
                "device_identifier": self.device.address,
                "heart_rate": heart_rate,
                "timestamp": datetime.now().isoformat(),
                "metadata": {
                    "device_name": self.device.name,
                    "device_address": self.device.address
                }
            }
            
            headers = {"Authorization": f"Bearer {self.api_token}"} if self.api_token else {}
            
            response = requests.post(
                f"{self.backend_url}/api/v1/wearables/ble/sync",
                json=payload,
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"💓 Heart rate: {heart_rate} bpm (sent to backend)")
            else:
                logger.warning(f"⚠️ Failed to send heart rate data: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ Error sending heart rate data: {e}")
    
    async def disconnect(self):
        """Disconnect from the device."""
        if self.client and self.is_connected:
            try:
                await self.client.disconnect()
                self.is_connected = False
                logger.info("🔌 Disconnected from device")
            except Exception as e:
                logger.error(f"❌ Error disconnecting: {e}")


async def main():
    """Main function to run the BLE heart rate reader."""
    logger.info("🚀 Starting BLE Heart Rate Monitor Reader...")
    
    # Initialize reader
    reader = BLEHeartRateReader(BACKEND_URL, API_TOKEN, PLAYER_ID)
    
    try:
        # Scan for devices
        devices = await reader.scan_for_devices()
        
        if not devices:
            logger.warning("⚠️ No heart rate monitors found")
            return
        
        # Connect to first available device
        for device in devices:
            if await reader.connect_to_device(device):
                break
        else:
            logger.error("❌ Failed to connect to any device")
            return
        
        # Start monitoring
        await reader.start_heart_rate_monitoring()
        
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down...")
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
    finally:
        await reader.disconnect()


if __name__ == "__main__":
    # Check if bleak is available
    try:
        import bleak
    except ImportError:
        logger.error("❌ Bleak library not found. Install with: pip install bleak")
        exit(1)
    
    # Run the reader
    asyncio.run(main())
