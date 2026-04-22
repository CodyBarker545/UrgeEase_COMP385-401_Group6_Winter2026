


// Applies simple local text obfuscation.
function simpleEncrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result) 
}

// Reverses simple local text obfuscation.
function simpleDecrypt(encrypted: string, key: string): string {
  try {
    const text = atob(encrypted) 
    let result = ''
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  } catch (error) {
    throw new Error('Decryption failed')
  }
}


// Gets the local storage encryption key.
function getEncryptionKey(): string {
  if (typeof window === 'undefined') {
    return 'default-key-change-in-production'
  }
  let key = sessionStorage.getItem('urgease_encryption_key')
  if (!key) {
    const userAgent = navigator.userAgent || 'default'
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60)) 
    key = btoa(userAgent + timestamp.toString()).substring(0, 32)
    sessionStorage.setItem('urgease_encryption_key', key)
  }
  return key
}


// Encrypts sensitive text for storage.
export function encryptSensitiveData(data: string): string {
  try {
    const key = getEncryptionKey()
    return simpleEncrypt(data, key)
  } catch (error) {
    console.error('Encryption failed:', error)
    console.warn('Falling back to unencrypted storage')
    return data
  }
}


// Decrypts sensitive text from storage.
export function decryptSensitiveData(encrypted: string): string {
  try {
    const key = getEncryptionKey()
    return simpleDecrypt(encrypted, key)
  } catch (error) {
    console.error('Decryption failed:', error)
    try {
      return encrypted
    } catch {
      throw new Error('Failed to decrypt data')
    }
  }
}


// Checks whether text has the encrypted marker.
function isEncrypted(data: string): boolean {
  try {
    if (data.startsWith('{') || data.startsWith('[')) {
      return false
    }
    atob(data) 
    return true
  } catch {
    return false
  }
}


// Reads encrypted data from local storage.
export function readEncryptedStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      return null
    }
    if (isEncrypted(stored)) {
      return decryptSensitiveData(stored)
    }
    return stored
  } catch (error) {
    console.error(`Failed to read encrypted storage for key ${key}:`, error)
    return null
  }
}


// Writes encrypted data to local storage.
export function writeEncryptedStorage(key: string, data: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  try {
    const encrypted = encryptSensitiveData(data)
    localStorage.setItem(key, encrypted)
    return true
  } catch (error) {
    console.error(`Failed to write encrypted storage for key ${key}:`, error)
    return false
  }
}


