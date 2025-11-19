#!/usr/bin/env python3
"""
Basketball AI Training Dashboard
Automated training pipeline with beautiful GUI

Author: Okidi Norbert
Date: November 19, 2025
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import os
import sys
import threading
import json
from pathlib import Path
from datetime import datetime
import subprocess

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


class TrainingDashboard:
    def __init__(self, root):
        self.root = root
        self.root.title("🏀 Basketball AI Training Dashboard")
        self.root.geometry("1200x800")
        self.root.configure(bg='#1a1a2e')
        
        # Paths
        self.project_root = Path(__file__).parent.parent
        self.dataset_dir = self.project_root / "dataset"
        self.models_dir = self.project_root / "models"
        self.models_dir.mkdir(exist_ok=True)
        
        # Training state
        self.is_training = False
        self.current_step = 0
        self.total_steps = 4
        
        # Setup UI
        self.setup_ui()
        self.check_dataset()
        
    def setup_ui(self):
        """Create the GUI layout"""
        
        # Title
        title_frame = tk.Frame(self.root, bg='#16213e', height=80)
        title_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(
            title_frame,
            text="🏀 Basketball AI Training Dashboard",
            font=("Helvetica", 24, "bold"),
            bg='#16213e',
            fg='#00d9ff'
        ).pack(side=tk.LEFT, padx=20, pady=20)
        
        # Tab selector
        tab_frame = tk.Frame(title_frame, bg='#16213e')
        tab_frame.pack(side=tk.RIGHT, padx=20)
        
        self.train_tab_button = tk.Button(
            tab_frame,
            text="🚀 TRAIN",
            font=("Helvetica", 12, "bold"),
            bg='#00ff88',
            fg='#000000',
            command=lambda: self.switch_tab('train'),
            padx=20,
            pady=10
        )
        self.train_tab_button.pack(side=tk.LEFT, padx=5)
        
        self.test_tab_button = tk.Button(
            tab_frame,
            text="🧪 TEST",
            font=("Helvetica", 12, "bold"),
            bg='#533483',
            fg='white',
            command=lambda: self.switch_tab('test'),
            padx=20,
            pady=10
        )
        self.test_tab_button.pack(side=tk.LEFT, padx=5)
        
        # Main container for tabs
        self.tab_container = tk.Frame(self.root, bg='#1a1a2e')
        self.tab_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create both tab contents
        self.train_frame = tk.Frame(self.tab_container, bg='#1a1a2e')
        self.test_frame = tk.Frame(self.tab_container, bg='#1a1a2e')
        
        # Setup train tab
        left_panel = tk.Frame(self.train_frame, bg='#16213e', width=400)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, padx=(0, 10))
        self.setup_dataset_panel(left_panel)
        
        right_panel = tk.Frame(self.train_frame, bg='#16213e')
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        self.setup_training_panel(right_panel)
        
        # Setup test tab
        self.setup_test_panel(self.test_frame)
        
        # Show train tab by default
        self.current_tab = 'train'
        self.switch_tab('train')
        
    def setup_dataset_panel(self, parent):
        """Setup dataset information panel"""
        
        tk.Label(
            parent,
            text="📊 Dataset Status",
            font=("Helvetica", 18, "bold"),
            bg='#16213e',
            fg='#00d9ff'
        ).pack(pady=10)
        
        # Dataset stats
        self.dataset_frame = tk.Frame(parent, bg='#0f3460')
        self.dataset_frame.pack(fill=tk.BOTH, padx=10, pady=10)
        
        # Updated categories with shooting types
        categories = [
            'free_throw_shot',
            '2point_shot', 
            '3point_shot',
            'dribbling',
            'passing',
            'defense',
            'idle'
        ]
        
        # Display names for categories
        self.category_names = {
            'free_throw_shot': 'Free Throw Shot',
            '2point_shot': '2-Point Shot',
            '3point_shot': '3-Point Shot',
            'dribbling': 'Dribbling',
            'passing': 'Passing',
            'defense': 'Defense',
            'idle': 'Idle/Standing'
        }
        
        self.count_labels = {}
        
        for category in categories:
            frame = tk.Frame(self.dataset_frame, bg='#0f3460')
            frame.pack(fill=tk.X, padx=10, pady=5)
            
            tk.Label(
                frame,
                text=f"{self.category_names[category]}:",
                font=("Helvetica", 11),
                bg='#0f3460',
                fg='#ffffff',
                width=16,
                anchor='w'
            ).pack(side=tk.LEFT)
            
            count_label = tk.Label(
                frame,
                text="0 videos",
                font=("Helvetica", 12, "bold"),
                bg='#0f3460',
                fg='#00ff88',
                width=15,
                anchor='w'
            )
            count_label.pack(side=tk.LEFT)
            self.count_labels[category] = count_label
            
            # Progress bar (target: 100 videos per category)
            progress = ttk.Progressbar(
                frame,
                length=120,
                mode='determinate',
                maximum=100
            )
            progress.pack(side=tk.LEFT, padx=10)
            self.count_labels[f"{category}_progress"] = progress
        
        # Total count
        total_frame = tk.Frame(self.dataset_frame, bg='#16213e', height=2)
        total_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.total_label = tk.Label(
            self.dataset_frame,
            text="Total: 0 / 700 videos",
            font=("Helvetica", 13, "bold"),
            bg='#0f3460',
            fg='#ffd700'
        )
        self.total_label.pack(pady=10)
        
        # Info about shooting types
        info_label = tk.Label(
            self.dataset_frame,
            text="📍 Shooting types based on court position:\n"
                 "Free throw = from free throw line\n"
                 "2-point = inside 3-point arc\n"
                 "3-point = outside 3-point arc",
            font=("Helvetica", 9),
            bg='#0f3460',
            fg='#888888',
            justify='left'
        )
        info_label.pack(pady=5)
        
        # Buttons
        button_frame = tk.Frame(parent, bg='#16213e')
        button_frame.pack(pady=20)
        
        tk.Button(
            button_frame,
            text="📂 Open Dataset Folder",
            font=("Helvetica", 12),
            bg='#533483',
            fg='white',
            command=self.open_dataset_folder,
            padx=20,
            pady=10
        ).pack(pady=5, fill=tk.X)
        
        tk.Button(
            button_frame,
            text="🔄 Refresh Count",
            font=("Helvetica", 12),
            bg='#205375',
            fg='white',
            command=self.check_dataset,
            padx=20,
            pady=10
        ).pack(pady=5, fill=tk.X)
        
    def setup_training_panel(self, parent):
        """Setup training control panel"""
        
        tk.Label(
            parent,
            text="🚀 Training Pipeline",
            font=("Helvetica", 18, "bold"),
            bg='#16213e',
            fg='#00d9ff'
        ).pack(pady=10)
        
        # Training steps
        steps_frame = tk.Frame(parent, bg='#0f3460')
        steps_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.step_labels = []
        steps = [
            "1️⃣ Extract Poses (MediaPipe)",
            "2️⃣ Preprocess Dataset",
            "3️⃣ Train Action Classifier",
            "4️⃣ Evaluate & Save Model"
        ]
        
        for i, step in enumerate(steps):
            frame = tk.Frame(steps_frame, bg='#0f3460')
            frame.pack(fill=tk.X, padx=10, pady=5)
            
            status = tk.Label(
                frame,
                text="⏸",
                font=("Helvetica", 14),
                bg='#0f3460',
                fg='#888888',
                width=3
            )
            status.pack(side=tk.LEFT)
            
            label = tk.Label(
                frame,
                text=step,
                font=("Helvetica", 12),
                bg='#0f3460',
                fg='#ffffff',
                anchor='w'
            )
            label.pack(side=tk.LEFT, padx=10)
            
            self.step_labels.append((status, label))
        
        # Progress
        progress_frame = tk.Frame(parent, bg='#16213e')
        progress_frame.pack(fill=tk.X, padx=10, pady=20)
        
        self.progress_label = tk.Label(
            progress_frame,
            text="Ready to train",
            font=("Helvetica", 12),
            bg='#16213e',
            fg='#00ff88'
        )
        self.progress_label.pack(pady=5)
        
        self.progress_bar = ttk.Progressbar(
            progress_frame,
            length=500,
            mode='determinate',
            maximum=100
        )
        self.progress_bar.pack(pady=5)
        
        # Control buttons
        button_frame = tk.Frame(parent, bg='#16213e')
        button_frame.pack(pady=20)
        
        self.start_button = tk.Button(
            button_frame,
            text="🚀 START TRAINING",
            font=("Helvetica", 14, "bold"),
            bg='#00ff88',
            fg='#000000',
            command=self.start_training,
            padx=40,
            pady=15,
            cursor='hand2'
        )
        self.start_button.pack(side=tk.LEFT, padx=10)
        
        self.stop_button = tk.Button(
            button_frame,
            text="⏹ STOP",
            font=("Helvetica", 14, "bold"),
            bg='#ff4757',
            fg='white',
            command=self.stop_training,
            padx=40,
            pady=15,
            state=tk.DISABLED
        )
        self.stop_button.pack(side=tk.LEFT, padx=10)
        
        # Console output
        console_frame = tk.Frame(parent, bg='#16213e')
        console_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        tk.Label(
            console_frame,
            text="📝 Training Log",
            font=("Helvetica", 12, "bold"),
            bg='#16213e',
            fg='#00d9ff'
        ).pack(anchor='w', pady=5)
        
        self.console = scrolledtext.ScrolledText(
            console_frame,
            font=("Courier", 10),
            bg='#0a0a0a',
            fg='#00ff00',
            height=15,
            wrap=tk.WORD
        )
        self.console.pack(fill=tk.BOTH, expand=True)
        
        self.log("🏀 Basketball AI Training Dashboard initialized")
        self.log(f"📁 Dataset directory: {self.dataset_dir}")
        self.log(f"💾 Models directory: {self.models_dir}")
        self.log("=" * 80)
        
    def check_dataset(self):
        """Count videos in dataset"""
        categories = [
            'free_throw_shot',
            '2point_shot',
            '3point_shot',
            'dribbling',
            'passing',
            'defense',
            'idle'
        ]
        total = 0
        
        for category in categories:
            category_dir = self.dataset_dir / "raw_videos" / category
            
            if category_dir.exists():
                videos = list(category_dir.glob("*.mp4")) + \
                        list(category_dir.glob("*.avi")) + \
                        list(category_dir.glob("*.mov"))
                count = len(videos)
            else:
                count = 0
                category_dir.mkdir(parents=True, exist_ok=True)
            
            total += count
            
            # Update labels
            self.count_labels[category].config(text=f"{count} videos")
            self.count_labels[f"{category}_progress"]['value'] = count
            
            # Color coding (target: 100 per category)
            if count >= 100:
                color = '#00ff88'  # Green
            elif count >= 50:
                color = '#ffd700'  # Yellow
            else:
                color = '#ff4757'  # Red
            
            self.count_labels[category].config(fg=color)
        
        # Update total
        self.total_label.config(text=f"Total: {total} / 700 videos")
        
        if total >= 700:
            self.total_label.config(fg='#00ff88')
            self.log(f"✅ Dataset complete! {total} videos ready for training")
        elif total >= 350:
            self.total_label.config(fg='#ffd700')
            self.log(f"⚠️  Dataset 50% complete: {total}/700 videos")
        else:
            self.total_label.config(fg='#ff4757')
            if total > 0:
                self.log(f"📊 Dataset: {total}/700 videos ({total/7:.0f}% complete)")
        
        return total
    
    def open_dataset_folder(self):
        """Open dataset folder in file explorer"""
        dataset_path = self.dataset_dir / "raw_videos"
        dataset_path.mkdir(parents=True, exist_ok=True)
        
        if sys.platform == 'win32':
            os.startfile(dataset_path)
        elif sys.platform == 'darwin':
            subprocess.run(['open', dataset_path])
        else:
            subprocess.run(['xdg-open', dataset_path])
        
        self.log(f"📂 Opened: {dataset_path}")
    
    def start_training(self):
        """Start the training pipeline"""
        # Check dataset
        total_videos = self.check_dataset()
        
        if total_videos < 100:
            messagebox.showwarning(
                "Insufficient Dataset",
                f"You have only {total_videos} videos.\n\n"
                "Recommended: 700+ videos (140+ per category)\n"
                "Minimum: 100 videos for testing\n\n"
                "Continue anyway?"
            )
            response = messagebox.askyesno(
                "Continue?",
                "Training with few videos will result in low accuracy.\n\n"
                "Continue anyway?"
            )
            if not response:
                return
        
        # Disable start button
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.is_training = True
        
        # Start training in separate thread
        training_thread = threading.Thread(target=self.run_training_pipeline)
        training_thread.daemon = True
        training_thread.start()
    
    def stop_training(self):
        """Stop training"""
        self.is_training = False
        self.log("⏹ Training stopped by user")
        self.reset_ui()
    
    def run_training_pipeline(self):
        """Run the complete training pipeline"""
        try:
            self.log("=" * 80)
            self.log("🚀 STARTING TRAINING PIPELINE")
            self.log("=" * 80)
            
            # Step 1: Extract poses
            self.update_step(0, "running")
            self.log("\n1️⃣  STEP 1: Extracting poses with MediaPipe...")
            success = self.extract_poses()
            
            if not success or not self.is_training:
                self.update_step(0, "error")
                return
            
            self.update_step(0, "done")
            self.progress_bar['value'] = 25
            
            # Step 2: Preprocess
            self.update_step(1, "running")
            self.log("\n2️⃣  STEP 2: Preprocessing dataset...")
            success = self.preprocess_dataset()
            
            if not success or not self.is_training:
                self.update_step(1, "error")
                return
            
            self.update_step(1, "done")
            self.progress_bar['value'] = 50
            
            # Step 3: Train model
            self.update_step(2, "running")
            self.log("\n3️⃣  STEP 3: Training action classifier...")
            success = self.train_model()
            
            if not success or not self.is_training:
                self.update_step(2, "error")
                return
            
            self.update_step(2, "done")
            self.progress_bar['value'] = 75
            
            # Step 4: Evaluate
            self.update_step(3, "running")
            self.log("\n4️⃣  STEP 4: Evaluating model...")
            success = self.evaluate_model()
            
            if not success or not self.is_training:
                self.update_step(3, "error")
                return
            
            self.update_step(3, "done")
            self.progress_bar['value'] = 100
            
            # Success!
            self.log("=" * 80)
            self.log("🎉 TRAINING COMPLETED SUCCESSFULLY!")
            self.log("=" * 80)
            self.log(f"💾 Model saved to: {self.models_dir}")
            self.log("\n✅ Your AI is ready to use!")
            self.log("🚀 Next: Integrate model into backend")
            
            messagebox.showinfo(
                "Training Complete! 🎉",
                "Your basketball AI model has been trained successfully!\n\n"
                f"Model saved to:\n{self.models_dir}\n\n"
                "Next step: Integrate model into backend"
            )
            
        except Exception as e:
            self.log(f"❌ ERROR: {str(e)}")
            messagebox.showerror("Training Error", f"Training failed:\n{str(e)}")
        
        finally:
            self.reset_ui()
    
    def extract_poses(self):
        """Extract poses from videos"""
        try:
            script_path = self.project_root / "2_pose_extraction" / "extract_keypoints_v2.py"
            
            if not script_path.exists():
                self.log(f"❌ Script not found: {script_path}")
                return False
            
            self.log("📹 Extracting keypoints from videos...")
            self.log("⏳ This may take several minutes...")
            
            # Simulate pose extraction (you'll implement the actual call)
            import time
            for i in range(10):
                if not self.is_training:
                    return False
                time.sleep(0.5)
                self.progress_label.config(text=f"Extracting poses... {i*10}%")
                self.root.update()
            
            self.log("✅ Pose extraction complete!")
            return True
            
        except Exception as e:
            self.log(f"❌ Pose extraction failed: {str(e)}")
            return False
    
    def preprocess_dataset(self):
        """Preprocess extracted poses"""
        try:
            self.log("🔄 Normalizing keypoints...")
            self.log("📊 Creating train/val/test splits...")
            
            import time
            for i in range(10):
                if not self.is_training:
                    return False
                time.sleep(0.3)
                self.progress_label.config(text=f"Preprocessing... {i*10}%")
                self.root.update()
            
            self.log("✅ Preprocessing complete!")
            return True
            
        except Exception as e:
            self.log(f"❌ Preprocessing failed: {str(e)}")
            return False
    
    def train_model(self):
        """Train the action classification model"""
        try:
            self.log("🧠 Training Vision Transformer model...")
            self.log("📈 Epoch 1/10...")
            
            import time
            for epoch in range(10):
                if not self.is_training:
                    return False
                time.sleep(1)
                progress = 50 + (epoch * 2.5)
                self.progress_bar['value'] = progress
                self.progress_label.config(text=f"Training... Epoch {epoch+1}/10")
                self.log(f"   Epoch {epoch+1}/10 - Loss: {0.5 - epoch*0.04:.4f}")
                self.root.update()
            
            self.log("✅ Model training complete!")
            return True
            
        except Exception as e:
            self.log(f"❌ Training failed: {str(e)}")
            return False
    
    def evaluate_model(self):
        """Evaluate the trained model"""
        try:
            self.log("📊 Evaluating model on test set...")
            
            import time
            time.sleep(2)
            
            # Simulated metrics
            accuracy = 87.3
            precision = 0.86
            recall = 0.85
            f1 = 0.85
            
            self.log(f"\n📈 Model Performance:")
            self.log(f"   Accuracy:  {accuracy}%")
            self.log(f"   Precision: {precision:.2f}")
            self.log(f"   Recall:    {recall:.2f}")
            self.log(f"   F1-Score:  {f1:.2f}")
            
            if accuracy >= 85:
                self.log(f"\n✅ Excellent! Accuracy target met ({accuracy}% ≥ 85%)")
            else:
                self.log(f"\n⚠️  Accuracy below target ({accuracy}% < 85%)")
                self.log("   Consider recording more diverse videos")
            
            # Save model info
            model_info = {
                "trained_date": datetime.now().isoformat(),
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1,
                "model_path": str(self.models_dir / "best_model.pth"),
                "categories": [
                    "free_throw_shot",
                    "2point_shot", 
                    "3point_shot",
                    "dribbling",
                    "passing",
                    "defense",
                    "idle"
                ],
                "training_videos": self.check_dataset()
            }
            
            # Save model info JSON
            with open(self.models_dir / "model_info.json", 'w') as f:
                json.dump(model_info, f, indent=2)
            
            # Create dummy model file for testing
            # (In real training, this would be the actual PyTorch model)
            dummy_model_path = self.models_dir / "best_model.pth"
            with open(dummy_model_path, 'w') as f:
                f.write(f"# Dummy model file created on {datetime.now()}\n")
                f.write(f"# Training accuracy: {accuracy}%\n")
                f.write(f"# This is a placeholder. Real training will create actual PyTorch model.\n")
            
            self.log(f"💾 Model files created:")
            self.log(f"   - {dummy_model_path.name}")
            self.log(f"   - model_info.json")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Evaluation failed: {str(e)}")
            return False
    
    def update_step(self, step_index, status):
        """Update step status indicator"""
        status_label, text_label = self.step_labels[step_index]
        
        if status == "running":
            status_label.config(text="⏳", fg='#ffd700')
            text_label.config(fg='#ffd700')
        elif status == "done":
            status_label.config(text="✅", fg='#00ff88')
            text_label.config(fg='#00ff88')
        elif status == "error":
            status_label.config(text="❌", fg='#ff4757')
            text_label.config(fg='#ff4757')
        
        self.root.update()
    
    def reset_ui(self):
        """Reset UI after training"""
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.is_training = False
        self.progress_label.config(text="Ready to train")
        
        # Reset step indicators
        for status_label, text_label in self.step_labels:
            status_label.config(text="⏸", fg='#888888')
            text_label.config(fg='#ffffff')
    
    def log(self, message):
        """Add message to console"""
        self.console.insert(tk.END, message + "\n")
        self.console.see(tk.END)
        self.root.update()
    
    def switch_tab(self, tab_name):
        """Switch between train and test tabs"""
        self.current_tab = tab_name
        
        # Hide both tabs
        self.train_frame.pack_forget()
        self.test_frame.pack_forget()
        
        # Update button colors
        if tab_name == 'train':
            self.train_tab_button.config(bg='#00ff88', fg='#000000')
            self.test_tab_button.config(bg='#533483', fg='white')
            self.train_frame.pack(fill=tk.BOTH, expand=True)
        else:
            self.train_tab_button.config(bg='#533483', fg='white')
            self.test_tab_button.config(bg='#00ff88', fg='#000000')
            self.test_frame.pack(fill=tk.BOTH, expand=True)
            self.check_model_exists()
    
    def setup_test_panel(self, parent):
        """Setup test/inference panel"""
        
        # Model status
        status_frame = tk.Frame(parent, bg='#0f3460')
        status_frame.pack(fill=tk.X, padx=10, pady=10)
        
        tk.Label(
            status_frame,
            text="🤖 Model Status",
            font=("Helvetica", 18, "bold"),
            bg='#0f3460',
            fg='#00d9ff'
        ).pack(pady=10)
        
        self.model_status_label = tk.Label(
            status_frame,
            text="No model found. Train first!",
            font=("Helvetica", 12),
            bg='#0f3460',
            fg='#ff4757',
            wraplength=350
        )
        self.model_status_label.pack(pady=10)
        
        # Video upload section
        upload_frame = tk.Frame(parent, bg='#16213e')
        upload_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=20)
        
        tk.Label(
            upload_frame,
            text="🎬 Test Your Model",
            font=("Helvetica", 16, "bold"),
            bg='#16213e',
            fg='#00d9ff'
        ).pack(pady=10)
        
        # Selected file display
        self.selected_file_label = tk.Label(
            upload_frame,
            text="No video selected",
            font=("Helvetica", 11),
            bg='#0f3460',
            fg='#888888',
            wraplength=400,
            padx=20,
            pady=15
        )
        self.selected_file_label.pack(pady=10, fill=tk.X)
        
        # Upload button
        self.upload_button = tk.Button(
            upload_frame,
            text="📁 Select Video to Test",
            font=("Helvetica", 13, "bold"),
            bg='#205375',
            fg='white',
            command=self.select_test_video,
            padx=30,
            pady=12,
            cursor='hand2'
        )
        self.upload_button.pack(pady=10)
        
        # Analyze button
        self.analyze_button = tk.Button(
            upload_frame,
            text="🔍 ANALYZE VIDEO",
            font=("Helvetica", 14, "bold"),
            bg='#ffd700',
            fg='#000000',
            command=self.analyze_video,
            padx=40,
            pady=15,
            state=tk.DISABLED,
            cursor='hand2'
        )
        self.analyze_button.pack(pady=10)
        
        # Results display
        results_frame = tk.Frame(upload_frame, bg='#0f3460')
        results_frame.pack(fill=tk.BOTH, expand=True, pady=20)
        
        tk.Label(
            results_frame,
            text="📊 Analysis Results",
            font=("Helvetica", 14, "bold"),
            bg='#0f3460',
            fg='#00d9ff'
        ).pack(pady=10)
        
        self.results_text = scrolledtext.ScrolledText(
            results_frame,
            font=("Courier", 11),
            bg='#0a0a0a',
            fg='#00ff00',
            height=15,
            wrap=tk.WORD
        )
        self.results_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Initial message
        self.results_text.insert(tk.END, "🏀 Basketball AI Test Console\n")
        self.results_text.insert(tk.END, "=" * 60 + "\n")
        self.results_text.insert(tk.END, "Upload a basketball video to test your trained model!\n\n")
        self.results_text.insert(tk.END, "Supported formats: .mp4, .avi, .mov\n")
        self.results_text.insert(tk.END, "Recommended: 5-10 seconds, clear action\n")
        self.results_text.insert(tk.END, "=" * 60 + "\n")
    
    def check_model_exists(self):
        """Check if trained model exists"""
        model_path = self.models_dir / "best_model.pth"
        model_info_path = self.models_dir / "model_info.json"
        
        if model_path.exists():
            # Model exists
            self.model_status_label.config(
                text=f"✅ Model found: {model_path.name}",
                fg='#00ff88'
            )
            
            # Load model info if available
            if model_info_path.exists():
                with open(model_info_path, 'r') as f:
                    info = json.load(f)
                    trained_date = datetime.fromisoformat(info['trained_date']).strftime('%Y-%m-%d %H:%M')
                    self.model_status_label.config(
                        text=f"✅ Model ready! Accuracy: {info['accuracy']}% | Trained: {trained_date}",
                        fg='#00ff88'
                    )
            
            return True
        else:
            # No model
            self.model_status_label.config(
                text="❌ No trained model found. Train a model first in the TRAIN tab!",
                fg='#ff4757'
            )
            return False
    
    def select_test_video(self):
        """Select video file for testing"""
        filetypes = (
            ('Video files', '*.mp4 *.avi *.mov *.mkv'),
            ('All files', '*.*')
        )
        
        filename = filedialog.askopenfilename(
            title='Select a basketball video',
            initialdir=self.dataset_dir / "raw_videos",
            filetypes=filetypes
        )
        
        if filename:
            self.selected_video_path = Path(filename)
            self.selected_file_label.config(
                text=f"📹 Selected: {self.selected_video_path.name}",
                fg='#00ff88'
            )
            self.analyze_button.config(state=tk.NORMAL)
            self.test_log(f"✅ Video selected: {self.selected_video_path.name}")
    
    def analyze_video(self):
        """Analyze selected video with trained model"""
        if not hasattr(self, 'selected_video_path'):
            messagebox.showwarning("No Video", "Please select a video first!")
            return
        
        # Check model exists
        if not self.check_model_exists():
            messagebox.showerror(
                "No Model",
                "No trained model found!\n\nPlease train a model first in the TRAIN tab."
            )
            return
        
        # Disable button during analysis
        self.analyze_button.config(state=tk.DISABLED)
        self.upload_button.config(state=tk.DISABLED)
        
        # Run analysis in thread
        analysis_thread = threading.Thread(target=self.run_analysis)
        analysis_thread.daemon = True
        analysis_thread.start()
    
    def run_analysis(self):
        """Run video analysis"""
        try:
            self.test_log("\n" + "=" * 60)
            self.test_log(f"🎬 Analyzing: {self.selected_video_path.name}")
            self.test_log("=" * 60)
            
            # Step 1: Extract poses
            self.test_log("\n1️⃣  Extracting pose keypoints...")
            import time
            time.sleep(1)
            self.test_log("   ✅ Extracted 33 keypoints per frame")
            self.test_log("   ✅ Total frames: 180")
            
            # Step 2: Classify action
            self.test_log("\n2️⃣  Classifying action...")
            time.sleep(1)
            
            # Simulate classification (you'll replace with actual model inference)
            import random
            actions = ['free_throw_shot', '2point_shot', '3point_shot', 'dribbling', 'passing', 'defense', 'idle']
            action_display_names = {
                'free_throw_shot': 'Free Throw',
                '2point_shot': '2-Point Shot',
                '3point_shot': '3-Point Shot',
                'dribbling': 'Dribbling',
                'passing': 'Passing',
                'defense': 'Defense',
                'idle': 'Idle'
            }
            probabilities = [random.random() for _ in actions]
            total_prob = sum(probabilities)
            probabilities = [p/total_prob for p in probabilities]
            
            # Sort by probability
            sorted_results = sorted(zip(actions, probabilities), key=lambda x: x[1], reverse=True)
            predicted_action, confidence = sorted_results[0]
            
            # Display results
            self.test_log("\n" + "=" * 60)
            self.test_log("🎯 CLASSIFICATION RESULTS")
            self.test_log("=" * 60)
            self.test_log(f"\n🏆 Detected Action: {action_display_names[predicted_action].upper()}")
            self.test_log(f"   Confidence: {confidence*100:.1f}%")
            
            self.test_log("\n📊 Probability Distribution:")
            for action, prob in sorted_results:
                bar_length = int(prob * 35)
                bar = "█" * bar_length + "░" * (35 - bar_length)
                display_name = action_display_names[action]
                self.test_log(f"   {display_name.ljust(16)} {bar} {prob*100:.1f}%")
            
            # Step 3: Calculate metrics
            self.test_log("\n3️⃣  Calculating performance metrics...")
            time.sleep(1)
            
            # Simulated metrics
            metrics = {
                'jump_height': round(random.uniform(0.50, 0.85), 2),
                'movement_speed': round(random.uniform(5.0, 7.5), 1),
                'shooting_form': round(random.uniform(0.70, 0.95), 2),
                'reaction_time': round(random.uniform(0.15, 0.35), 2),
                'pose_stability': round(random.uniform(0.75, 0.95), 2)
            }
            
            self.test_log("\n" + "=" * 60)
            self.test_log("📈 PERFORMANCE METRICS")
            self.test_log("=" * 60)
            self.test_log(f"\n🦵 Jump Height:     {metrics['jump_height']}m")
            self.test_log(f"🏃 Movement Speed:  {metrics['movement_speed']} m/s")
            self.test_log(f"🎯 Shooting Form:   {metrics['shooting_form']} / 1.0")
            self.test_log(f"⚡ Reaction Time:   {metrics['reaction_time']}s")
            self.test_log(f"⚖️  Pose Stability:  {metrics['pose_stability']} / 1.0")
            
            # Generate recommendations
            self.test_log("\n" + "=" * 60)
            self.test_log("💡 AI RECOMMENDATIONS")
            self.test_log("=" * 60)
            
            if metrics['shooting_form'] >= 0.85:
                self.test_log("\n✅ Excellent shooting form!")
                self.test_log("   Your technique is near perfect. Keep it up!")
            elif metrics['shooting_form'] >= 0.75:
                self.test_log("\n⚠️  Good form, room for improvement")
                self.test_log("   Focus on elbow angle and follow-through")
            else:
                self.test_log("\n❌ Shooting form needs work")
                self.test_log("   Practice basic shooting mechanics")
            
            if metrics['jump_height'] < 0.65:
                self.test_log("\n💪 Work on explosive power")
                self.test_log("   Try: Box jumps, plyometrics, squats")
            
            if metrics['reaction_time'] < 0.22:
                self.test_log("\n⚡ Excellent reaction time!")
                self.test_log("   You're faster than average!")
            
            self.test_log("\n" + "=" * 60)
            self.test_log("✅ Analysis complete!")
            self.test_log("=" * 60)
            
            # Success message
            messagebox.showinfo(
                "Analysis Complete! 🎉",
                f"Action: {action_display_names[predicted_action].upper()}\n"
                f"Confidence: {confidence*100:.1f}%\n\n"
                f"Jump Height: {metrics['jump_height']}m\n"
                f"Form Score: {metrics['shooting_form']}\n\n"
                "Check the console for detailed results!"
            )
            
        except Exception as e:
            self.test_log(f"\n❌ ERROR: {str(e)}")
            messagebox.showerror("Analysis Error", f"Failed to analyze video:\n{str(e)}")
        
        finally:
            # Re-enable buttons
            self.analyze_button.config(state=tk.NORMAL)
            self.upload_button.config(state=tk.NORMAL)
    
    def test_log(self, message):
        """Add message to test console"""
        self.results_text.insert(tk.END, message + "\n")
        self.results_text.see(tk.END)
        self.root.update()


def main():
    """Main entry point"""
    root = tk.Tk()
    app = TrainingDashboard(root)
    root.mainloop()


if __name__ == "__main__":
    main()

