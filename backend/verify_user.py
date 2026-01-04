import sys
from app.database import SessionLocal
from app.models import User

if len(sys.argv) < 2:
    print("Usage: python verify_user.py <email>")
    sys.exit(1)

email = sys.argv[1]
db = SessionLocal()
user = db.query(User).filter(User.email == email).first()
if user:
    user.is_email_verified = True
    user.email_verification_token = None
    db.commit()
    print(f"✓ User {user.email} verified successfully!")
else:
    print(f"✗ User {email} not found")
db.close()
