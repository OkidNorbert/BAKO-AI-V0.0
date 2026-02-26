
import os
import subprocess
import glob

def fix_videos():
    annotated_dir = "output_videos/annotated"
    if not os.path.exists(annotated_dir):
        print("No annotated videos directory found.")
        return

    videos = glob.glob(os.path.join(annotated_dir, "*.mp4"))
    print(f"Found {len(videos)} annotated videos. Checking codecs...")

    for video_path in videos:
        try:
            # Check codec with ffprobe
            cmd_check = [
                'ffprobe', '-v', 'error', '-select_streams', 'v:0',
                '-show_entries', 'stream=codec_name', '-of',
                'default=noprint_wrappers=1:nokey=1', video_path
            ]
            codec = subprocess.check_output(cmd_check).decode().strip()
            
            if codec == 'mpeg4':
                print(f"Fixing {video_path} (codec: {codec})...")
                temp_path = video_path + ".fix.mp4"
                cmd_fix = [
                    'ffmpeg', '-y', '-i', video_path,
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                    '-preset', 'ultrafast', '-crf', '23',
                    temp_path
                ]
                subprocess.run(cmd_fix, capture_output=True, check=True)
                os.replace(temp_path, video_path)
                print(f"✅ Fixed {video_path}")
            else:
                print(f"Skipping {video_path} (codec: {codec})")
        except Exception as e:
            print(f"❌ Failed to process {video_path}: {e}")

if __name__ == "__main__":
    fix_videos()
