import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Get encryption secret - prefer environment variable, fall back to development key
const SECRET_KEY = process.env.CRYPTO_SECRET || 'dev-key-32-chars-not-for-production-please-set-crypto-secret-env';

// Warn if using development key
if (!process.env.CRYPTO_SECRET) {
  console.warn('⚠️  WARNING: Using development encryption key. Set CRYPTO_SECRET environment variable for production!');
}

// Ensure we have a 32-byte key
const key = crypto.createHash('sha256').update(SECRET_KEY).digest();

export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return '';
  
  try {
    const iv = crypto.randomBytes(12); // 12-byte IV for GCM mode
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    // Store as versioned format: v1:iv:ciphertext:tag (all base64 encoded)
    const result = `v1:${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
    return result;
  } catch (error) {
    console.error('Failed to encrypt API key');
    throw new Error('Encryption failed');
  }
}

export function decryptApiKey(encryptedApiKey: string): string {
  if (!encryptedApiKey) return '';
  
  try {
    const parts = encryptedApiKey.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') {
      console.error('Invalid encrypted data format');
      return '';
    }
    
    const [version, ivBase64, encryptedBase64, authTagBase64] = parts;
    
    const iv = Buffer.from(ivBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt API key');
    return '';
  }
}

export function isApiKeyEncrypted(value: string): boolean {
  if (!value) return false;
  // Check for versioned format: v1:base64:base64:base64
  const parts = value.split(':');
  return parts.length === 4 && parts[0] === 'v1' && parts.slice(1).every(part => {
    try {
      Buffer.from(part, 'base64');
      return true;
    } catch {
      return false;
    }
  });
}