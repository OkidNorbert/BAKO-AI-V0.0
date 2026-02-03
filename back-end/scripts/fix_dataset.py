import os
import yaml

def fix_dataset(dataset_dir):
    label_dirs = ['train/labels', 'valid/labels', 'test/labels']
    
    # Mapping old class IDs to new class IDs
    # Old: 0: basketbal, 1: basketball, 2: court, 3: hoop, 4: player, 5: referee, 6: shot-clock
    # New: 0: basketball, 1: court, 2: hoop, 3: player, 4: referee, 5: shot-clock
    mapping = {
        '0': '0', # basketbal -> basketball
        '1': '0', # basketball -> basketball
        '2': '1', # court -> court
        '3': '2', # hoop -> hoop
        '4': '3', # player -> player
        '5': '4', # referee -> referee
        '6': '5'  # shot-clock -> shot-clock
    }
    
    for ld in label_dirs:
        full_path = os.path.join(dataset_dir, ld)
        if not os.path.exists(full_path):
            continue
            
        print(f"Processing labels in {full_path}...")
        for filename in os.listdir(full_path):
            if filename.endswith('.txt'):
                file_path = os.path.join(full_path, filename)
                with open(file_path, 'r') as f:
                    lines = f.readlines()
                
                new_lines = []
                for line in lines:
                    parts = line.split()
                    if parts:
                        old_cls = parts[0]
                        if old_cls in mapping:
                            parts[0] = mapping[old_cls]
                            new_lines.append(" ".join(parts) + "\n")
                        else:
                            new_lines.append(line)
                
                with open(file_path, 'w') as f:
                    f.writelines(new_lines)

    # Fix data.yaml
    yaml_path = os.path.join(dataset_dir, 'data.yaml')
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    data['nc'] = 6
    data['names'] = ['basketball', 'court', 'hoop', 'player', 'referee', 'shot-clock']
    
    # Adjust paths to be absolute or correct relative to where we run training
    # Current: train: ../train/images
    # We want them to be relative to the data.yaml location or absolute
    data['train'] = os.path.join(dataset_dir, 'train/images')
    data['val'] = os.path.join(dataset_dir, 'valid/images')
    if 'test' in data:
        data['test'] = os.path.join(dataset_dir, 'test/images')

    with open(yaml_path, 'w') as f:
        yaml.dump(data, f)
    
    print("Dataset fix complete!")

if __name__ == "__main__":
    fix_dataset("datasets/nbl_dataset")
