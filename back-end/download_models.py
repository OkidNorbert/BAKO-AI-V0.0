import os
import requests
from tqdm import tqdm

def download_file(url, dest):
    if os.path.exists(dest):
        print(f"✅ {dest} already exists.")
        return
    
    print(f"Downloading {os.path.basename(dest)}...")
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    
    with open(dest, 'wb') as file, tqdm(
        desc=dest,
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for data in response.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)

if __name__ == "__main__":
    MODELS = {
        "models/sam2.1_hiera_tiny.pt": "https://github.com/ultralytics/assets/releases/download/v8.3.0/sam2.1_hiera_tiny.pt",
        # Add other missing models here if needed
    }
    
    for path, url in MODELS.items():
        try:
            download_file(url, path)
        except Exception as e:
            print(f"❌ Failed to download {path}: {e}")
