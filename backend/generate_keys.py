# """Generate RSA keys for .env file"""
# from cryptography.hazmat.primitives.asymmetric import rsa
# from cryptography.hazmat.primitives import serialization
# import secrets

# # Generate RSA key pair
# private_key = rsa.generate_private_key(
#     public_exponent=65537,
#     key_size=2048
# )
# public_key = private_key.public_key()

# # Serialize to PEM format
# private_pem = private_key.private_bytes(
#     encoding=serialization.Encoding.PEM,
#     format=serialization.PrivateFormat.PKCS8,
#     encryption_algorithm=serialization.NoEncryption()
# ).decode('utf-8')

# public_pem = public_key.public_bytes(
#     encoding=serialization.Encoding.PEM,
#     format=serialization.PublicFormat.SubjectPublicKeyInfo
# ).decode('utf-8')

# # Generate secret key
# secret_key = secrets.token_urlsafe(64)

# # Create .env content
# env_content = f"""# Backend Environment Variables

# # ===========================================
# # Database
# # ===========================================
# DATABASE_URL=sqlite:///./finance_tracker.db

# # ===========================================
# # Security
# # ===========================================
# SECRET_KEY={secret_key}
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30

# # ===========================================
# # RSA Keys for Password Encryption
# # ===========================================
# RSA_PRIVATE_KEY="{private_pem.replace(chr(10), '\\n')}"
# RSA_PUBLIC_KEY="{public_pem.replace(chr(10), '\\n')}"

# # ===========================================
# # Environment Settings
# # ===========================================
# ENVIRONMENT=development
# DEBUG=true

# # ===========================================
# # Gmail OAuth (Optional - for email sync feature)
# # ===========================================
# GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback

# # ===========================================
# # LLM API Keys (Optional - for AI features)
# # ===========================================
# LLM_API_KEY=your-gemini-api-key

# # ===========================================
# # Frontend CORS
# # ===========================================
# FRONTEND_URL=http://localhost:5173
# """

# # Write to .env file
# with open('.env', 'w') as f:
#     f.write(env_content)

# print("✅ .env file created successfully!")
# print(f"✅ Generated SECRET_KEY: {secret_key[:20]}...")
# print("✅ Generated RSA key pair")
# print("\n🚀 You can now start the server with:")
# print("   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000")
