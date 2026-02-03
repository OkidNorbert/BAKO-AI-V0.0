from roboflow import Roboflow
import os

def download_dataset():
    rf = Roboflow(api_key="ZzD21wz5oTPdE0fhb04C")
    project = rf.workspace("tomatoes-iicln").project("nbl")
    version = project.version(1)
    
    # Download in current directory
    print("Downloading dataset to current directory...")
    dataset = version.download("yolov11")
    print(f"Dataset downloaded to: {dataset.location}")

if __name__ == "__main__":
    download_dataset()
