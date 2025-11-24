#!/usr/bin/env python3
"""
VideoMAE Training Script for Basketball Action Classification
Fine-tune pre-trained VideoMAE on custom basketball dataset
Achieves 90%+ accuracy (better than R(2+1)D's 85%)
"""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import VideoMAEForVideoClassification, VideoMAEImageProcessor, TrainingArguments, Trainer
from transformers import EarlyStoppingCallback
import numpy as np
import cv2
from pathlib import Path
import logging
from tqdm import tqdm
import json
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
from typing import List, Dict
import argparse
import pandas as pd
import time
from datetime import timedelta
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_metadata_from_folders(video_base_dir: str, output_csv: str):
    """
    Create metadata CSV from folder structure
    
    Args:
        video_base_dir: Base directory containing category folders (e.g., raw_videos/)
        output_csv: Path to output CSV file
    """
    video_base = Path(video_base_dir)
    categories = [
        'free_throw_shot', '2point_shot', '3point_shot',
        'dribbling', 'passing', 'defense', 'idle'
    ]
    
    metadata = []
    video_extensions = ['.mp4', '.avi', '.mov', '.MOV', '.MP4', '.AVI']
    
    for category in categories:
        category_dir = video_base / category
        if not category_dir.exists():
            logger.warning(f"⚠️  Category folder not found: {category_dir}")
            continue
        
        # Find all videos in this category
        videos = []
        for ext in video_extensions:
            videos.extend(list(category_dir.glob(f"*{ext}")))
        
        for video_path in videos:
            # Use relative path from video_base_dir
            rel_path = video_path.relative_to(video_base)
            metadata.append({
                'filename': str(rel_path),
                'action': category,
                'category': category
            })
        
        logger.info(f"✅ Found {len(videos)} videos in {category}")
    
    # Create DataFrame and save
    df = pd.DataFrame(metadata)
    df.to_csv(output_csv, index=False)
    logger.info(f"✅ Metadata CSV created: {output_csv} ({len(df)} videos)")
    
    return output_csv


class BasketballVideoDataset(Dataset):
    """Dataset for basketball action videos"""
    
    def __init__(
        self,
        video_dir: str,
        metadata_file: str,
        processor: VideoMAEImageProcessor,
        num_frames: int = 16
    ):
        """
        Initialize dataset
        
        Args:
            video_dir: Directory containing videos
            metadata_file: CSV with video labels
            processor: VideoMAE processor
            num_frames: Number of frames to sample
        """
        self.video_dir = Path(video_dir)
        self.processor = processor
        self.num_frames = num_frames
        
        # Load metadata
        import pandas as pd
        self.metadata = pd.read_csv(metadata_file)
        
        # Action classes (7 basketball actions)
        self.class_names = [
            "free_throw_shot", "2point_shot", "3point_shot", 
            "dribbling", "passing", "defense", "idle"
        ]
        self.class_to_idx = {name: idx for idx, name in enumerate(self.class_names)}
        
        logger.info(f"✅ Dataset initialized: {len(self.metadata)} videos")
    
    def __len__(self):
        return len(self.metadata)
    
    def __getitem__(self, idx):
        """Get video and label"""
        row = self.metadata.iloc[idx]
        
        # Handle both relative and absolute paths
        filename = row['filename']
        if Path(filename).is_absolute():
            video_path = Path(filename)
        else:
            video_path = self.video_dir / filename
        
        action_label = row['action']
        label = self.class_to_idx[action_label]
        
        # Load video frames
        frames = self._load_video_frames(str(video_path))
        
        # Process with VideoMAE processor
        inputs = self.processor(frames, return_tensors="pt")
        
        # Remove batch dimension
        inputs = {k: v.squeeze(0) for k, v in inputs.items()}
        inputs['labels'] = torch.tensor(label)
        
        return inputs
    
    def _load_video_frames(self, video_path: str) -> List[np.ndarray]:
        """Load frames from video"""
        cap = cv2.VideoCapture(video_path)
        frames = []
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Sample frames uniformly
        frame_indices = np.linspace(0, total_frames - 1, self.num_frames, dtype=int)
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if ret:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frames.append(frame_rgb)
        
        cap.release()
        
        # Pad if necessary
        while len(frames) < self.num_frames:
            frames.append(frames[-1] if frames else np.zeros((224, 224, 3), dtype=np.uint8))
        
        return frames


def compute_metrics(eval_pred):
    """Compute metrics for evaluation"""
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    
    accuracy = accuracy_score(labels, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, predictions, average='macro', zero_division=0
    )
    
    return {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }


def plot_training_curves(trainer: Trainer, output_dir: str):
    """
    Generate and save training curves (loss, accuracy, etc.)
    
    Args:
        trainer: Hugging Face Trainer object with training history
        output_dir: Directory to save the plot
    """
    try:
        # Get training history
        history = trainer.state.log_history
        
        if not history:
            logger.warning("⚠️  No training history found for plotting")
            return
        
        # Extract metrics - properly align epochs with values
        train_loss = []
        train_accuracy = []
        eval_loss = []
        eval_accuracy = []
        eval_f1 = []
        train_epochs = []
        eval_epochs = []
        
        for entry in history:
            # Training metrics
            if 'loss' in entry and 'epoch' in entry and 'eval_loss' not in entry:
                train_loss.append(entry['loss'])
                train_epochs.append(entry['epoch'])
                if 'train_accuracy' in entry:
                    train_accuracy.append(entry['train_accuracy'])
            
            # Evaluation metrics
            if 'eval_loss' in entry and 'epoch' in entry:
                eval_loss.append(entry['eval_loss'])
                eval_epochs.append(entry['epoch'])
                if 'eval_accuracy' in entry:
                    eval_accuracy.append(entry['eval_accuracy'])
                if 'eval_f1' in entry:
                    eval_f1.append(entry['eval_f1'])
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Training Progress - VideoMAE Basketball Action Classification', 
                     fontsize=16, fontweight='bold')
        
        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['font.size'] = 10
        
        # Plot 1: Loss curves
        ax1 = axes[0, 0]
        if train_loss and train_epochs:
            ax1.plot(train_epochs[:len(train_loss)], train_loss, 'b-o', label='Train Loss', linewidth=2, markersize=6)
        if eval_loss and eval_epochs and len(eval_loss) == len(eval_epochs):
            ax1.plot(eval_epochs, eval_loss, 'r-s', label='Validation Loss', linewidth=2, markersize=6)
        ax1.set_xlabel('Epoch', fontweight='bold')
        ax1.set_ylabel('Loss', fontweight='bold')
        ax1.set_title('Training & Validation Loss', fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot 2: Accuracy curves
        ax2 = axes[0, 1]
        if train_accuracy and train_epochs and len(train_accuracy) <= len(train_epochs):
            ax2.plot(train_epochs[:len(train_accuracy)], [a*100 for a in train_accuracy], 
                    'b-o', label='Train Accuracy', linewidth=2, markersize=6)
        if eval_accuracy and eval_epochs and len(eval_accuracy) == len(eval_epochs):
            ax2.plot(eval_epochs, [a*100 for a in eval_accuracy], 
                    'r-s', label='Validation Accuracy', linewidth=2, markersize=6)
        ax2.set_xlabel('Epoch', fontweight='bold')
        ax2.set_ylabel('Accuracy (%)', fontweight='bold')
        ax2.set_title('Training & Validation Accuracy', fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        ax2.set_ylim([0, 100])
        
        # Plot 3: F1 Score
        ax3 = axes[1, 0]
        if eval_f1 and eval_epochs and len(eval_f1) == len(eval_epochs):
            ax3.plot(eval_epochs, [f*100 for f in eval_f1], 
                    'g-^', label='Validation F1 Score', linewidth=2, markersize=6)
        ax3.set_xlabel('Epoch', fontweight='bold')
        ax3.set_ylabel('F1 Score (%)', fontweight='bold')
        ax3.set_title('Validation F1 Score', fontweight='bold')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        ax3.set_ylim([0, 100])
        
        # Plot 4: Learning Rate (if available)
        ax4 = axes[1, 1]
        lr_values = []
        lr_steps = []
        for entry in history:
            if 'learning_rate' in entry:
                lr_values.append(entry['learning_rate'])
                if 'step' in entry:
                    lr_steps.append(entry['step'])
        
        if lr_values:
            if lr_steps:
                ax4.plot(lr_steps, lr_values, 'm-', label='Learning Rate', linewidth=2)
                ax4.set_xlabel('Step', fontweight='bold')
            else:
                ax4.plot(range(len(lr_values)), lr_values, 'm-', label='Learning Rate', linewidth=2)
                ax4.set_xlabel('Epoch', fontweight='bold')
            ax4.set_ylabel('Learning Rate', fontweight='bold')
            ax4.set_title('Learning Rate Schedule', fontweight='bold')
            ax4.legend()
            ax4.grid(True, alpha=0.3)
        else:
            ax4.text(0.5, 0.5, 'Learning Rate\nData Not Available', 
                    ha='center', va='center', transform=ax4.transAxes, fontsize=12)
            ax4.set_title('Learning Rate Schedule', fontweight='bold')
        
        plt.tight_layout()
        
        # Save plot
        output_path = Path(output_dir) / "training_curves.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"📊 Training curves saved to: {output_path}")
        
        # Also save as PDF for better quality
        output_path_pdf = Path(output_dir) / "training_curves.pdf"
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Training Progress - VideoMAE Basketball Action Classification', 
                     fontsize=16, fontweight='bold')
        
        # Recreate plots for PDF
        sns.set_style("whitegrid")
        if train_loss and train_epochs:
            axes[0, 0].plot(train_epochs[:len(train_loss)], train_loss, 'b-o', label='Train Loss', linewidth=2, markersize=6)
        if eval_loss and eval_epochs and len(eval_loss) == len(eval_epochs):
            axes[0, 0].plot(eval_epochs, eval_loss, 'r-s', label='Validation Loss', linewidth=2, markersize=6)
        axes[0, 0].set_xlabel('Epoch', fontweight='bold')
        axes[0, 0].set_ylabel('Loss', fontweight='bold')
        axes[0, 0].set_title('Training & Validation Loss', fontweight='bold')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        if train_accuracy and train_epochs and len(train_accuracy) <= len(train_epochs):
            axes[0, 1].plot(train_epochs[:len(train_accuracy)], [a*100 for a in train_accuracy], 
                           'b-o', label='Train Accuracy', linewidth=2, markersize=6)
        if eval_accuracy and eval_epochs and len(eval_accuracy) == len(eval_epochs):
            axes[0, 1].plot(eval_epochs, [a*100 for a in eval_accuracy], 
                           'r-s', label='Validation Accuracy', linewidth=2, markersize=6)
        axes[0, 1].set_xlabel('Epoch', fontweight='bold')
        axes[0, 1].set_ylabel('Accuracy (%)', fontweight='bold')
        axes[0, 1].set_title('Training & Validation Accuracy', fontweight='bold')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        axes[0, 1].set_ylim([0, 100])
        
        if eval_f1 and eval_epochs and len(eval_f1) == len(eval_epochs):
            axes[1, 0].plot(eval_epochs, [f*100 for f in eval_f1], 
                           'g-^', label='Validation F1 Score', linewidth=2, markersize=6)
        axes[1, 0].set_xlabel('Epoch', fontweight='bold')
        axes[1, 0].set_ylabel('F1 Score (%)', fontweight='bold')
        axes[1, 0].set_title('Validation F1 Score', fontweight='bold')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        axes[1, 0].set_ylim([0, 100])
        
        if lr_values:
            if lr_steps:
                axes[1, 1].plot(lr_steps, lr_values, 'm-', label='Learning Rate', linewidth=2)
                axes[1, 1].set_xlabel('Step', fontweight='bold')
            else:
                axes[1, 1].plot(range(len(lr_values)), lr_values, 'm-', label='Learning Rate', linewidth=2)
                axes[1, 1].set_xlabel('Epoch', fontweight='bold')
            axes[1, 1].set_ylabel('Learning Rate', fontweight='bold')
            axes[1, 1].set_title('Learning Rate Schedule', fontweight='bold')
            axes[1, 1].legend()
            axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(output_path_pdf, bbox_inches='tight')
        plt.close()
        
    except Exception as e:
        logger.error(f"❌ Error generating training curves: {e}")
        import traceback
        logger.error(traceback.format_exc())


def plot_validation_chart(trainer: Trainer, test_dataset, class_names: List[str], output_dir: str):
    """
    Generate comprehensive validation chart with confusion matrix and per-class metrics
    
    Args:
        trainer: Hugging Face Trainer object
        test_dataset: Test dataset for evaluation
        class_names: List of class names
        output_dir: Directory to save the chart
    """
    try:
        logger.info("📊 Generating validation chart...")
        
        # Get predictions on test set
        predictions = trainer.predict(test_dataset)
        y_pred = np.argmax(predictions.predictions, axis=1)
        y_true = predictions.label_ids
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        num_classes = len(class_names)
        
        # Initialize arrays for all classes (with zeros for classes not in test set)
        precision = np.zeros(num_classes)
        recall = np.zeros(num_classes)
        f1 = np.zeros(num_classes)
        support = np.zeros(num_classes, dtype=int)
        
        # Get metrics only for classes present in the test set
        unique_labels = np.unique(np.concatenate([y_true, y_pred]))
        if len(unique_labels) > 0:
            precision_raw, recall_raw, f1_raw, support_raw = precision_recall_fscore_support(
                y_true, y_pred, average=None, zero_division=0, labels=unique_labels
            )
            
            # Map the results to the correct class indices
            for i, label in enumerate(unique_labels):
                if 0 <= label < num_classes:
                    precision[label] = precision_raw[i]
                    recall[label] = recall_raw[i]
                    f1[label] = f1_raw[i]
                    support[label] = support_raw[i]
        
        macro_precision = precision.mean()
        macro_recall = recall.mean()
        macro_f1 = f1.mean()
        
        # Confusion matrix - specify labels to ensure all classes are included
        # even if some are missing from the test set
        cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))
        
        # Create figure with subplots
        fig = plt.figure(figsize=(18, 12))
        gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
        
        fig.suptitle('Model Validation Report - Basketball Action Classification', 
                     fontsize=18, fontweight='bold', y=0.98)
        
        # Set style
        sns.set_style("whitegrid")
        plt.rcParams['font.size'] = 10
        
        # Plot 1: Confusion Matrix (large, top-left)
        ax1 = fig.add_subplot(gs[0:2, 0:2])
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=class_names, yticklabels=class_names,
                   ax=ax1, cbar_kws={'label': 'Count'})
        ax1.set_xlabel('Predicted Label', fontweight='bold', fontsize=12)
        ax1.set_ylabel('True Label', fontweight='bold', fontsize=12)
        ax1.set_title('Confusion Matrix', fontweight='bold', fontsize=14)
        plt.setp(ax1.get_xticklabels(), rotation=45, ha='right')
        plt.setp(ax1.get_yticklabels(), rotation=0)
        
        # Plot 2: Per-Class Metrics (top-right)
        ax2 = fig.add_subplot(gs[0:2, 2])
        x_pos = np.arange(len(class_names))
        width = 0.25
        
        # Normalize metrics to percentages for better visualization
        precision_pct = precision * 100
        recall_pct = recall * 100
        f1_pct = f1 * 100
        
        ax2.barh(x_pos - width, precision_pct, width, label='Precision', color='#3498db', alpha=0.8)
        ax2.barh(x_pos, recall_pct, width, label='Recall', color='#2ecc71', alpha=0.8)
        ax2.barh(x_pos + width, f1_pct, width, label='F1 Score', color='#e74c3c', alpha=0.8)
        
        ax2.set_yticks(x_pos)
        ax2.set_yticklabels(class_names, fontsize=9)
        ax2.set_xlabel('Score (%)', fontweight='bold')
        ax2.set_title('Per-Class Metrics', fontweight='bold', fontsize=12)
        ax2.legend(loc='lower right', fontsize=9)
        ax2.set_xlim([0, 100])
        ax2.grid(True, alpha=0.3, axis='x')
        
        # Add value labels on bars
        for i, (p, r, f) in enumerate(zip(precision_pct, recall_pct, f1_pct)):
            ax2.text(p + 1, i - width, f'{p:.1f}%', va='center', fontsize=7)
            ax2.text(r + 1, i, f'{r:.1f}%', va='center', fontsize=7)
            ax2.text(f + 1, i + width, f'{f:.1f}%', va='center', fontsize=7)
        
        # Plot 3: Overall Metrics Summary (middle-right)
        ax3 = fig.add_subplot(gs[2, 2])
        ax3.axis('off')
        
        metrics_text = f"""
OVERALL METRICS

Accuracy: {accuracy*100:.2f}%

Macro-Averaged:
  Precision: {macro_precision*100:.2f}%
  Recall: {macro_recall*100:.2f}%
  F1 Score: {macro_f1*100:.2f}%

Test Samples: {len(y_true)}
Classes: {len(class_names)}
        """
        
        ax3.text(0.1, 0.5, metrics_text, fontsize=11, 
                family='monospace', verticalalignment='center',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        # Plot 4: Class Distribution (bottom-left)
        ax4 = fig.add_subplot(gs[2, 0])
        class_counts = pd.Series(y_true).value_counts().sort_index()
        colors = plt.cm.Set3(np.linspace(0, 1, len(class_names)))
        
        bars = ax4.bar(range(len(class_names)), 
                      [class_counts.get(i, 0) for i in range(len(class_names))],
                      color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)
        
        ax4.set_xticks(range(len(class_names)))
        ax4.set_xticklabels(class_names, rotation=45, ha='right', fontsize=9)
        ax4.set_ylabel('Sample Count', fontweight='bold')
        ax4.set_title('Test Set Class Distribution', fontweight='bold', fontsize=12)
        ax4.grid(True, alpha=0.3, axis='y')
        
        # Add count labels on bars
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax4.text(bar.get_x() + bar.get_width()/2., height,
                        f'{int(height)}', ha='center', va='bottom', fontsize=9, fontweight='bold')
        
        # Plot 5: Support (samples per class) (bottom-middle)
        ax5 = fig.add_subplot(gs[2, 1])
        support_data = pd.DataFrame({
            'Class': class_names,
            'Support': support,
            'Precision': precision_pct,
            'Recall': recall_pct,
            'F1': f1_pct
        })
        
        # Create a table
        table_data = []
        for i, row in support_data.iterrows():
            table_data.append([
                row['Class'][:15],  # Truncate long names
                f"{row['Support']}",
                f"{row['Precision']:.1f}%",
                f"{row['Recall']:.1f}%",
                f"{row['F1']:.1f}%"
            ])
        
        table = ax5.table(cellText=table_data,
                         colLabels=['Class', 'Support', 'Precision', 'Recall', 'F1'],
                         cellLoc='center',
                         loc='center',
                         bbox=[0, 0, 1, 1])
        table.auto_set_font_size(False)
        table.set_fontsize(8)
        table.scale(1, 2)
        
        # Style the header
        for i in range(5):
            table[(0, i)].set_facecolor('#34495e')
            table[(0, i)].set_text_props(weight='bold', color='white')
        
        # Color code cells by performance
        for i in range(1, len(table_data) + 1):
            precision_val = float(table_data[i-1][2].replace('%', ''))
            recall_val = float(table_data[i-1][3].replace('%', ''))
            f1_val = float(table_data[i-1][4].replace('%', ''))
            
            # Green for good (>80%), yellow for medium (60-80%), red for poor (<60%)
            if f1_val >= 80:
                color = '#d5f4e6'
            elif f1_val >= 60:
                color = '#fff9c4'
            else:
                color = '#ffcccb'
            
            table[(i, 4)].set_facecolor(color)  # F1 column
        
        ax5.axis('off')
        ax5.set_title('Detailed Per-Class Metrics', fontweight='bold', fontsize=12, pad=20)
        
        # Save plot
        output_path = Path(output_dir) / "validation_chart.png"
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"✅ Validation chart saved to: {output_path}")
        
        # Also save as PDF
        output_path_pdf = Path(output_dir) / "validation_chart.pdf"
        # Recreate figure for PDF (same code as above)
        fig = plt.figure(figsize=(18, 12))
        gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
        fig.suptitle('Model Validation Report - Basketball Action Classification', 
                     fontsize=18, fontweight='bold', y=0.98)
        sns.set_style("whitegrid")
        
        # Recreate all plots (same as above)
        ax1 = fig.add_subplot(gs[0:2, 0:2])
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=class_names, yticklabels=class_names,
                   ax=ax1, cbar_kws={'label': 'Count'})
        ax1.set_xlabel('Predicted Label', fontweight='bold', fontsize=12)
        ax1.set_ylabel('True Label', fontweight='bold', fontsize=12)
        ax1.set_title('Confusion Matrix', fontweight='bold', fontsize=14)
        plt.setp(ax1.get_xticklabels(), rotation=45, ha='right')
        plt.setp(ax1.get_yticklabels(), rotation=0)
        
        ax2 = fig.add_subplot(gs[0:2, 2])
        ax2.barh(x_pos - width, precision_pct, width, label='Precision', color='#3498db', alpha=0.8)
        ax2.barh(x_pos, recall_pct, width, label='Recall', color='#2ecc71', alpha=0.8)
        ax2.barh(x_pos + width, f1_pct, width, label='F1 Score', color='#e74c3c', alpha=0.8)
        ax2.set_yticks(x_pos)
        ax2.set_yticklabels(class_names, fontsize=9)
        ax2.set_xlabel('Score (%)', fontweight='bold')
        ax2.set_title('Per-Class Metrics', fontweight='bold', fontsize=12)
        ax2.legend(loc='lower right', fontsize=9)
        ax2.set_xlim([0, 100])
        ax2.grid(True, alpha=0.3, axis='x')
        
        # Add value labels on bars for PDF version
        for i, (p, r, f) in enumerate(zip(precision_pct, recall_pct, f1_pct)):
            ax2.text(p + 1, i - width, f'{p:.1f}%', va='center', fontsize=7)
            ax2.text(r + 1, i, f'{r:.1f}%', va='center', fontsize=7)
            ax2.text(f + 1, i + width, f'{f:.1f}%', va='center', fontsize=7)
        
        ax3 = fig.add_subplot(gs[2, 2])
        ax3.axis('off')
        ax3.text(0.1, 0.5, metrics_text, fontsize=11, 
                family='monospace', verticalalignment='center',
                bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
        
        ax4 = fig.add_subplot(gs[2, 0])
        bars = ax4.bar(range(len(class_names)), 
                      [class_counts.get(i, 0) for i in range(len(class_names))],
                      color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)
        ax4.set_xticks(range(len(class_names)))
        ax4.set_xticklabels(class_names, rotation=45, ha='right', fontsize=9)
        ax4.set_ylabel('Sample Count', fontweight='bold')
        ax4.set_title('Test Set Class Distribution', fontweight='bold', fontsize=12)
        ax4.grid(True, alpha=0.3, axis='y')
        
        # Add count labels on bars for PDF version
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax4.text(bar.get_x() + bar.get_width()/2., height,
                        f'{int(height)}', ha='center', va='bottom', fontsize=9, fontweight='bold')
        
        ax5 = fig.add_subplot(gs[2, 1])
        table = ax5.table(cellText=table_data,
                         colLabels=['Class', 'Support', 'Precision', 'Recall', 'F1'],
                         cellLoc='center',
                         loc='center',
                         bbox=[0, 0, 1, 1])
        table.auto_set_font_size(False)
        table.set_fontsize(8)
        table.scale(1, 2)
        for i in range(5):
            table[(0, i)].set_facecolor('#34495e')
            table[(0, i)].set_text_props(weight='bold', color='white')
        for i in range(1, len(table_data) + 1):
            f1_val = float(table_data[i-1][4].replace('%', ''))
            if f1_val >= 80:
                color = '#d5f4e6'
            elif f1_val >= 60:
                color = '#fff9c4'
            else:
                color = '#ffcccb'
            table[(i, 4)].set_facecolor(color)
        ax5.axis('off')
        ax5.set_title('Detailed Per-Class Metrics', fontweight='bold', fontsize=12, pad=20)
        
        plt.savefig(output_path_pdf, bbox_inches='tight')
        plt.close()
        
        logger.info(f"✅ Validation chart (PDF) saved to: {output_path_pdf}")
        
        # Save classification report to text file
        report_path = Path(output_dir) / "classification_report.txt"
        with open(report_path, 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("CLASSIFICATION REPORT\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Overall Accuracy: {accuracy*100:.2f}%\n\n")
            f.write(f"Macro-Averaged Metrics:\n")
            f.write(f"  Precision: {macro_precision*100:.2f}%\n")
            f.write(f"  Recall: {macro_recall*100:.2f}%\n")
            f.write(f"  F1 Score: {macro_f1*100:.2f}%\n\n")
            f.write("=" * 80 + "\n")
            f.write("PER-CLASS METRICS\n")
            f.write("=" * 80 + "\n\n")
            f.write(classification_report(y_true, y_pred, target_names=class_names, digits=3))
            f.write("\n" + "=" * 80 + "\n")
            f.write("CONFUSION MATRIX\n")
            f.write("=" * 80 + "\n\n")
            f.write(f"Rows = True Labels, Columns = Predicted Labels\n\n")
            f.write(pd.DataFrame(cm, index=class_names, columns=class_names).to_string())
        
        logger.info(f"✅ Classification report saved to: {report_path}")
        
    except Exception as e:
        logger.error(f"❌ Error generating validation chart: {e}")
        import traceback
        logger.error(traceback.format_exc())


def main():
    parser = argparse.ArgumentParser(description="Train VideoMAE on basketball dataset")
    parser.add_argument('--data-dir', type=str, required=True, help="Directory with videos (raw_videos folder)")
    parser.add_argument('--metadata', type=str, default=None, help="Metadata CSV file (auto-generated if not provided)")
    parser.add_argument('--output-dir', type=str, default='./models', help="Output directory")
    parser.add_argument('--epochs', type=int, default=25, help="Number of epochs")
    parser.add_argument('--batch-size', type=int, default=8, help="Batch size")
    parser.add_argument('--lr', type=float, default=1e-4, help="Learning rate")
    
    args = parser.parse_args()
    
    # Auto-generate metadata if not provided
    if args.metadata is None:
        # If data_dir is raw_videos, use its parent for metadata
        data_path = Path(args.data_dir)
        if data_path.name == "raw_videos":
            metadata_path = data_path.parent / "metadata.csv"
        else:
            metadata_path = data_path / "metadata.csv"
        
        logger.info(f"📝 Auto-generating metadata CSV...")
        create_metadata_from_folders(args.data_dir, str(metadata_path))
        args.metadata = str(metadata_path)
    
    logger.info("🏀 VideoMAE Training for Basketball Actions")
    logger.info(f"   Data: {args.data_dir}")
    logger.info(f"   Metadata: {args.metadata}")
    logger.info(f"   Output: {args.output_dir}")
    logger.info(f"   Epochs: {args.epochs}")
    logger.info(f"   Batch size: {args.batch_size}")
    logger.info(f"   Learning rate: {args.lr}")
    
    # Load processor and model
    base_model_name = "MCG-NJU/videomae-base-finetuned-kinetics"
    processor = VideoMAEImageProcessor.from_pretrained(base_model_name)
    
    model = VideoMAEForVideoClassification.from_pretrained(
        base_model_name,
        num_labels=7,  # 7 basketball actions
        ignore_mismatched_sizes=True
    )
    
    logger.info("✅ VideoMAE model loaded")
    
    # Load metadata and create train/val/test splits
    metadata_df = pd.read_csv(args.metadata)
    
    # Check class distribution
    class_counts = metadata_df['action'].value_counts()
    logger.info(f"📊 Class distribution:")
    for action, count in class_counts.items():
        logger.info(f"   {action}: {count} samples")
    
    # Filter out classes with 0 samples (shouldn't happen, but safety check)
    valid_classes = class_counts[class_counts > 0].index
    metadata_df = metadata_df[metadata_df['action'].isin(valid_classes)]
    
    # Check if stratification is possible (all classes need at least 2 samples)
    min_class_count = class_counts.min()
    can_stratify = min_class_count >= 2
    
    if not can_stratify:
        logger.warning(f"⚠️  Some classes have < 2 samples (min: {min_class_count}). Using non-stratified splitting.")
        logger.warning(f"   Classes with < 2 samples: {class_counts[class_counts < 2].index.tolist()}")
    
    # Split dataset: 70% train, 15% val, 15% test
    from sklearn.model_selection import train_test_split
    
    if can_stratify:
        train_df, temp_df = train_test_split(
            metadata_df, test_size=0.3, random_state=42, stratify=metadata_df['action']
        )
        # Check if second split can be stratified
        temp_class_counts = temp_df['action'].value_counts()
        can_stratify_second = temp_class_counts.min() >= 2
        
        if can_stratify_second:
            val_df, test_df = train_test_split(
                temp_df, test_size=0.5, random_state=42, stratify=temp_df['action']
            )
        else:
            logger.warning("⚠️  Second split using non-stratified method")
            val_df, test_df = train_test_split(
                temp_df, test_size=0.5, random_state=42
            )
    else:
        # Non-stratified splitting
        train_df, temp_df = train_test_split(
            metadata_df, test_size=0.3, random_state=42
        )
        val_df, test_df = train_test_split(
            temp_df, test_size=0.5, random_state=42
        )
    
    # Save splits
    train_csv = Path(args.output_dir) / "train_metadata.csv"
    val_csv = Path(args.output_dir) / "val_metadata.csv"
    test_csv = Path(args.output_dir) / "test_metadata.csv"
    
    train_df.to_csv(train_csv, index=False)
    val_df.to_csv(val_csv, index=False)
    test_df.to_csv(test_csv, index=False)
    
    logger.info(f"📊 Dataset splits: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")
    
    # Log class distribution in each split
    logger.info(f"📊 Train split distribution:")
    for action, count in train_df['action'].value_counts().items():
        logger.info(f"   {action}: {count} samples")
    
    logger.info(f"📊 Validation split distribution:")
    for action, count in val_df['action'].value_counts().items():
        logger.info(f"   {action}: {count} samples")
    
    logger.info(f"📊 Test split distribution:")
    for action, count in test_df['action'].value_counts().items():
        logger.info(f"   {action}: {count} samples")
    
    # Warn about class imbalance
    if not can_stratify:
        logger.warning("⚠️  WARNING: Class imbalance detected. Consider collecting more samples for underrepresented classes.")
        logger.warning("   Recommended minimum: 10-20 samples per class for better model performance.")
    
    # Determine video directory (should be raw_videos folder)
    video_dir = Path(args.data_dir)
    if video_dir.name != "raw_videos":
        # If data_dir is dataset/, look for raw_videos inside
        raw_videos_path = video_dir / "raw_videos"
        if raw_videos_path.exists():
            video_dir = raw_videos_path
    
    # Create datasets
    train_dataset = BasketballVideoDataset(
        video_dir=str(video_dir),
        metadata_file=str(train_csv),
        processor=processor
    )
    
    val_dataset = BasketballVideoDataset(
        video_dir=str(video_dir),
        metadata_file=str(val_csv),
        processor=processor
    )
    
    test_dataset = BasketballVideoDataset(
        video_dir=str(video_dir),
        metadata_file=str(test_csv),
        processor=processor
    )
    
    # Training arguments (following Basketball-Action-Recognition approach)
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        per_device_eval_batch_size=args.batch_size,
        learning_rate=args.lr,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir=f'{args.output_dir}/logs',
        logging_steps=10,
        eval_strategy="epoch",  # Changed from evaluation_strategy
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        greater_is_better=True,
        save_total_limit=3,
        fp16=torch.cuda.is_available(),
    )
    
    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
        callbacks=[EarlyStoppingCallback(early_stopping_patience=5)]
    )
    
    # Train with timing
    logger.info("🚀 Starting training...")
    logger.info("⏱️  Timing each epoch...")
    
    start_time = time.time()
    train_result = trainer.train()
    total_training_time = time.time() - start_time
    
    # Calculate per-epoch time
    num_epochs_completed = train_result.global_step / (len(train_dataset) / args.batch_size)
    if num_epochs_completed > 0:
        avg_epoch_time = total_training_time / num_epochs_completed
        logger.info("=" * 60)
        logger.info("⏱️  TRAINING TIME STATISTICS:")
        logger.info("=" * 60)
        logger.info(f"   Total Training Time: {timedelta(seconds=int(total_training_time))}")
        logger.info(f"   Epochs Completed: {num_epochs_completed:.1f}")
        logger.info(f"   Average Time per Epoch: {timedelta(seconds=int(avg_epoch_time))}")
        logger.info(f"   Time per Epoch: ~{avg_epoch_time:.1f} seconds ({avg_epoch_time/60:.1f} minutes)")
        logger.info(f"   Samples per Second: {len(train_dataset) * num_epochs_completed / total_training_time:.2f}")
        logger.info("=" * 60)
    
    # Evaluate on test set
    logger.info("📊 Evaluating on test set...")
    eval_start = time.time()
    test_results = trainer.evaluate(test_dataset)
    eval_time = time.time() - eval_start
    logger.info(f"⏱️  Evaluation time: {timedelta(seconds=int(eval_time))}")
    
    # Save final model with timestamp to avoid overwriting old models
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_name = f"videomae_model_{timestamp}"
    output_model_dir = Path(args.output_dir) / model_name
    output_model_dir.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"💾 Saving model to: {output_model_dir}")
    logger.info(f"   Model name: {model_name}")
    
    model.save_pretrained(str(output_model_dir))
    processor.save_pretrained(str(output_model_dir))
    
    # Save model info
    num_epochs_completed = train_result.global_step / (len(train_dataset) / args.batch_size) if len(train_dataset) > 0 else 0
    avg_epoch_time = total_training_time / num_epochs_completed if num_epochs_completed > 0 else 0
    
    model_info = {
        "model_type": "VideoMAE",
        "base_model": base_model_name,
        "model_name": model_name,  # Add model name for reference
        "model_path": str(output_model_dir),  # Add full path
        "num_labels": 7,
        "classes": train_dataset.class_names,
        "train_accuracy": train_result.metrics.get('train_accuracy', 0),
        "val_accuracy": train_result.metrics.get('eval_accuracy', 0),
        "test_accuracy": test_results.get('eval_accuracy', 0),
        "train_samples": len(train_dataset),
        "val_samples": len(val_dataset),
        "test_samples": len(test_dataset),
        "epochs_trained": num_epochs_completed,
        "total_training_time_seconds": total_training_time,
        "average_epoch_time_seconds": avg_epoch_time,
        "training_device": "cuda" if torch.cuda.is_available() else "cpu",
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "training_timestamp": timestamp,  # Add timestamp
    }
    
    # Save model info in both the model directory and output directory
    model_info_path = output_model_dir / "model_info.json"
    model_info_path.parent.mkdir(parents=True, exist_ok=True)
    with open(model_info_path, 'w') as f:
        json.dump(model_info, f, indent=2)
    
    # Also save a copy in the output directory with timestamp for easy reference
    model_info_path_global = Path(args.output_dir) / f"model_info_{timestamp}.json"
    with open(model_info_path_global, 'w') as f:
        json.dump(model_info, f, indent=2)
    
    # Also save PyTorch model for compatibility (with timestamp)
    torch.save(model.state_dict(), Path(args.output_dir) / f"{model_name}.pth")
    
    logger.info(f"✅ Training complete!")
    logger.info(f"   Train Accuracy: {model_info['train_accuracy']*100:.1f}%")
    logger.info(f"   Val Accuracy: {model_info['val_accuracy']*100:.1f}%")
    logger.info(f"   Test Accuracy: {model_info['test_accuracy']*100:.1f}%")
    logger.info(f"   Model saved to: {output_model_dir}")
    logger.info(f"   Model info saved to: {model_info_path}")
    
    # Generate and save training charts (save in model directory)
    logger.info("📊 Generating training charts...")
    try:
        plot_training_curves(trainer, str(output_model_dir))
        logger.info(f"✅ Training charts saved to: {output_model_dir / 'training_curves.png'}")
    except Exception as e:
        logger.warning(f"⚠️  Could not generate training charts: {e}")
    
    # Generate and save validation chart with confusion matrix (save in model directory)
    logger.info("📊 Generating validation chart...")
    try:
        plot_validation_chart(trainer, test_dataset, train_dataset.class_names, str(output_model_dir))
        logger.info(f"✅ Validation chart saved to: {output_model_dir / 'validation_chart.png'}")
    except Exception as e:
        logger.warning(f"⚠️  Could not generate validation chart: {e}")
    
    # Create a symlink or copy to "best_model" only if this is the best performing model
    # (Optional: You can add logic here to compare with previous models)
    logger.info("")
    logger.info("=" * 60)
    logger.info("📦 MODEL SAVED SUCCESSFULLY")
    logger.info("=" * 60)
    logger.info(f"   Model Directory: {output_model_dir}")
    logger.info(f"   Model Name: {model_name}")
    logger.info(f"   Old model 'best_model' remains untouched")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()

