from encryption import generate_key, encrypt_file, decrypt_file


# Original file content
original_data = b"Hello TrustShare! This is a secret file."


# Generate AES-256 key
key = generate_key()

print("Key generated successfully.")
print("Key size:", len(key) * 8, "bits")


# Encrypt
nonce, encrypted_data = encrypt_file(original_data, key)

print("File encrypted successfully.")
print("Encrypted size:", len(encrypted_data), "bytes")


# Decrypt
decrypted_data = decrypt_file(
    encrypted_data,
    key,
    nonce
)

print("File decrypted successfully.")


# Verify
if decrypted_data == original_data:
    print("SUCCESS: Original and decrypted data match!")
else:
    print("ERROR: Data does not match!")