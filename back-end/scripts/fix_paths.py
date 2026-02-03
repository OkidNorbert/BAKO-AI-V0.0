import os
import yaml

def fix_yaml_paths(yaml_path):
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    dataset_dir = os.path.dirname(os.path.abspath(yaml_path))
    
    # Use absolute path as root
    data['path'] = dataset_dir
    
    # Since only 'train' exists, use it for validation too so training doesn't fail
    data['train'] = "train/images"
    data['val'] = "train/images" 
    
    # Remove test if it doesn't exist to avoid warnings
    if 'test' in data:
        del data['test']

    with open(yaml_path, 'w') as f:
        yaml.dump(data, f)
    
    print(f"Fixed paths in {yaml_path}")
    print("Using 'train' for both training and validation.")

if __name__ == "__main__":
    fix_yaml_paths("datasets/nbl_dataset/data.yaml")
