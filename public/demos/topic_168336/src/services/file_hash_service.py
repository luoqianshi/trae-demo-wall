import hashlib
import os

class FileHashService:
    def __init__(self):
        self.chunk_size = 8192
        
    def calculate_file_hashes(self, file_path):
        md5_hash = hashlib.md5()
        sha256_hash = hashlib.sha256()
        
        with open(file_path, 'rb') as f:
            while chunk := f.read(self.chunk_size):
                md5_hash.update(chunk)
                sha256_hash.update(chunk)
                
        return {
            'md5': md5_hash.hexdigest(),
            'sha256': sha256_hash.hexdigest()
        } 