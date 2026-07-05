import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
from typing import Optional

class CryptoService:
    def __init__(self):
        self.backend = default_backend()
        self.salt = b'AI-Edu-Data-Cleaner-Salt-2024'
        self.iterations = 100000
        
    def _derive_key(self, password: str) -> bytes:
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=self.iterations,
            backend=self.backend
        )
        return kdf.derive(password.encode('utf-8'))
    
    def encrypt(self, plaintext: str, password: str) -> str:
        key = self._derive_key(password)
        iv = algorithms.AES.new(key).block_size // 8
        nonce = os.urandom(12)
        
        cipher = Cipher(algorithms.AES(key), modes.GCM(nonce), backend=self.backend)
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()
        
        iv_b64 = base64.b64encode(nonce).decode('utf-8')
        tag_b64 = base64.b64encode(encryptor.tag).decode('utf-8')
        ciphertext_b64 = base64.b64encode(ciphertext).decode('utf-8')
        
        return f"{iv_b64}:{tag_b64}:{ciphertext_b64}"
    
    def decrypt(self, encrypted_data: str, password: str) -> Optional[str]:
        try:
            parts = encrypted_data.split(':')
            if len(parts) != 3:
                return None
            
            iv = base64.b64decode(parts[0])
            tag = base64.b64decode(parts[1])
            ciphertext = base64.b64decode(parts[2])
            
            key = self._derive_key(password)
            
            cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=self.backend)
            decryptor = cipher.decryptor()
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            
            return plaintext.decode('utf-8')
        except Exception:
            return None
    
    def hash_password(self, password: str) -> str:
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        import bcrypt
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def generate_token(self) -> str:
        import uuid
        return str(uuid.uuid4())

import os

crypto_service = CryptoService()