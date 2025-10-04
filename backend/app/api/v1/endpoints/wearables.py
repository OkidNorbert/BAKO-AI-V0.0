"""
Wearable data endpoints for health and fitness tracking.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.wearable import WearableDevice, WearableData, WearableSession, WearableType, DataType
from app.schemas.wearable import (
    WearableDeviceCreate, WearableDeviceResponse,
    WearableDataBatch, WearableDataPoint,
    HealthKitSyncRequest, GoogleFitSyncRequest, BLESyncRequest,
    WearableSessionCreate, WearableSessionResponse,
    WearableMetricsResponse, WearableDataQuery
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/devices", response_model=WearableDeviceResponse)
async def create_wearable_device(
    device_data: WearableDeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register a new wearable device for a player."""
    try:
        # Check if device already exists
        existing_device = db.query(WearableDevice).filter(
            WearableDevice.device_identifier == device_data.device_identifier
        ).first()
        
        if existing_device:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Device with this identifier already exists"
            )
        
        # Create new device
        device = WearableDevice(
            player_id=current_user.id,
            device_type=device_data.device_type,
            device_name=device_data.device_name,
            device_identifier=device_data.device_identifier
        )
        
        db.add(device)
        db.commit()
        db.refresh(device)
        
        logger.info(f"✅ Created wearable device: {device.device_name} for player {current_user.id}")
        
        return WearableDeviceResponse.from_orm(device)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error creating wearable device: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating device: {str(e)}"
        )


@router.get("/devices", response_model=List[WearableDeviceResponse])
async def get_wearable_devices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all wearable devices for the current player."""
    devices = db.query(WearableDevice).filter(
        WearableDevice.player_id == current_user.id
    ).all()
    
    return [WearableDeviceResponse.from_orm(device) for device in devices]


@router.post("/data/batch")
async def upload_wearable_data_batch(
    data_batch: WearableDataBatch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload batch of wearable data points."""
    try:
        # Verify device belongs to user
        device = db.query(WearableDevice).filter(
            and_(
                WearableDevice.id == data_batch.device_id,
                WearableDevice.player_id == current_user.id
            )
        ).first()
        
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found or not owned by user"
            )
        
        # Create data points
        data_points = []
        for point in data_batch.data_points:
            data_point = WearableData(
                device_id=data_batch.device_id,
                player_id=current_user.id,
                data_type=point.data_type,
                value=point.value,
                unit=point.unit,
                timestamp=point.timestamp,
                metadata=point.metadata
            )
            data_points.append(data_point)
        
        db.add_all(data_points)
        db.commit()
        
        logger.info(f"✅ Uploaded {len(data_points)} data points for device {data_batch.device_id}")
        
        return {
            "status": "success",
            "data_points_uploaded": len(data_points),
            "device_id": data_batch.device_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error uploading wearable data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading data: {str(e)}"
        )


@router.post("/healthkit/sync")
async def sync_healthkit_data(
    request: HealthKitSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync Apple HealthKit data."""
    try:
        # Find or create Apple Watch device
        device = db.query(WearableDevice).filter(
            and_(
                WearableDevice.player_id == current_user.id,
                WearableDevice.device_type == WearableType.APPLE_WATCH
            )
        ).first()
        
        if not device:
            # Create Apple Watch device
            device = WearableDevice(
                player_id=current_user.id,
                device_type=WearableType.APPLE_WATCH,
                device_name="Apple Watch",
                device_identifier=f"apple_watch_{current_user.id}"
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        
        # Process HealthKit samples
        data_points = []
        for sample in request.samples:
            # Map HealthKit data types to our schema
            data_type = _map_healthkit_to_data_type(sample.get('type'))
            if data_type:
                data_point = WearableData(
                    device_id=device.id,
                    player_id=current_user.id,
                    data_type=data_type,
                    value=float(sample.get('value', 0)),
                    unit=sample.get('unit', ''),
                    timestamp=datetime.fromisoformat(sample.get('timestamp', datetime.now().isoformat())),
                    metadata=sample
                )
                data_points.append(data_point)
        
        if data_points:
            db.add_all(data_points)
            db.commit()
        
        logger.info(f"✅ Synced {len(data_points)} HealthKit samples for player {current_user.id}")
        
        return {
            "status": "success",
            "samples_synced": len(data_points),
            "device_id": device.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error syncing HealthKit data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing HealthKit data: {str(e)}"
        )


@router.post("/google-fit/sync")
async def sync_google_fit_data(
    request: GoogleFitSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync Google Fit data."""
    try:
        # Find or create Google Fit device
        device = db.query(WearableDevice).filter(
            and_(
                WearableDevice.player_id == current_user.id,
                WearableDevice.device_type == WearableType.GOOGLE_FIT
            )
        ).first()
        
        if not device:
            # Create Google Fit device
            device = WearableDevice(
                player_id=current_user.id,
                device_type=WearableType.GOOGLE_FIT,
                device_name="Google Fit",
                device_identifier=f"google_fit_{current_user.id}"
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        
        # Process Google Fit dataset
        data_points = []
        for data_point in request.dataset:
            data_type = _map_google_fit_to_data_type(data_point.get('dataTypeName'))
            if data_type:
                point = WearableData(
                    device_id=device.id,
                    player_id=current_user.id,
                    data_type=data_type,
                    value=float(data_point.get('value', 0)),
                    unit=data_point.get('unit', ''),
                    timestamp=datetime.fromisoformat(data_point.get('startTime', datetime.now().isoformat())),
                    metadata=data_point
                )
                data_points.append(point)
        
        if data_points:
            db.add_all(data_points)
            db.commit()
        
        logger.info(f"✅ Synced {len(data_points)} Google Fit data points for player {current_user.id}")
        
        return {
            "status": "success",
            "data_points_synced": len(data_points),
            "device_id": device.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error syncing Google Fit data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing Google Fit data: {str(e)}"
        )


@router.post("/ble/sync")
async def sync_ble_data(
    request: BLESyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sync BLE heart rate monitor data."""
    try:
        # Find or create BLE device
        device = db.query(WearableDevice).filter(
            and_(
                WearableDevice.player_id == current_user.id,
                WearableDevice.device_identifier == request.device_identifier
            )
        ).first()
        
        if not device:
            # Create BLE device
            device = WearableDevice(
                player_id=current_user.id,
                device_type=WearableType.BLE_HRM,
                device_name=f"BLE HRM {request.device_identifier}",
                device_identifier=request.device_identifier
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        
        # Create heart rate data point
        data_point = WearableData(
            device_id=device.id,
            player_id=current_user.id,
            data_type=DataType.HEART_RATE,
            value=request.heart_rate,
            unit="bpm",
            timestamp=request.timestamp,
            metadata=request.metadata
        )
        
        db.add(data_point)
        db.commit()
        
        logger.info(f"✅ Synced BLE heart rate: {request.heart_rate} bpm for player {current_user.id}")
        
        return {
            "status": "success",
            "heart_rate": request.heart_rate,
            "device_id": device.id
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error syncing BLE data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing BLE data: {str(e)}"
        )


@router.get("/metrics/{player_id}")
async def get_wearable_metrics(
    player_id: int,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get wearable metrics for a player."""
    try:
        # Set default date range if not provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=7)
        
        # Get aggregated metrics
        metrics = db.query(
            func.count(WearableData.id).label('total_data_points'),
            func.avg(WearableData.value).filter(WearableData.data_type == DataType.HEART_RATE).label('avg_heart_rate'),
            func.max(WearableData.value).filter(WearableData.data_type == DataType.HEART_RATE).label('max_heart_rate'),
            func.sum(WearableData.value).filter(WearableData.data_type == DataType.STEPS).label('total_steps'),
            func.sum(WearableData.value).filter(WearableData.data_type == DataType.CALORIES).label('calories_burned')
        ).filter(
            and_(
                WearableData.player_id == player_id,
                WearableData.timestamp >= start_date,
                WearableData.timestamp <= end_date
            )
        ).first()
        
        return WearableMetricsResponse(
            player_id=player_id,
            date_range=f"{start_date.date()} to {end_date.date()}",
            total_steps=int(metrics.total_steps or 0),
            avg_heart_rate=float(metrics.avg_heart_rate or 0),
            max_heart_rate=float(metrics.max_heart_rate or 0),
            calories_burned=float(metrics.calories_burned or 0),
            distance_covered=0.0,  # TODO: Calculate from steps
            sleep_hours=None,  # TODO: Calculate from sleep data
            hrv_avg=None,  # TODO: Calculate from HRV data
            active_minutes=0,  # TODO: Calculate from activity data
            sessions_count=0  # TODO: Count training sessions
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting wearable metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting metrics: {str(e)}"
        )


def _map_healthkit_to_data_type(healthkit_type: str) -> Optional[DataType]:
    """Map HealthKit data types to our schema."""
    mapping = {
        'HKQuantityTypeIdentifierHeartRate': DataType.HEART_RATE,
        'HKQuantityTypeIdentifierHeartRateVariability': DataType.HEART_RATE_VARIABILITY,
        'HKQuantityTypeIdentifierStepCount': DataType.STEPS,
        'HKQuantityTypeIdentifierActiveEnergyBurned': DataType.ACTIVE_ENERGY,
        'HKQuantityTypeIdentifierBasalEnergyBurned': DataType.RESTING_ENERGY,
        'HKQuantityTypeIdentifierDistanceWalkingRunning': DataType.DISTANCE,
        'HKCategoryTypeIdentifierSleepAnalysis': DataType.SLEEP_ANALYSIS,
        'HKQuantityTypeIdentifierOxygenSaturation': DataType.BLOOD_OXYGEN,
        'HKQuantityTypeIdentifierBodyTemperature': DataType.BODY_TEMPERATURE
    }
    return mapping.get(healthkit_type)


def _map_google_fit_to_data_type(google_fit_type: str) -> Optional[DataType]:
    """Map Google Fit data types to our schema."""
    mapping = {
        'com.google.heart_rate.bpm': DataType.HEART_RATE,
        'com.google.step_count.delta': DataType.STEPS,
        'com.google.calories.expended': DataType.CALORIES,
        'com.google.distance.delta': DataType.DISTANCE,
        'com.google.active_minutes': DataType.ACTIVE_ENERGY
    }
    return mapping.get(google_fit_type)
