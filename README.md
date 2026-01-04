# Financial Leak Detector

## Problem Statement

**Challenge:** People lose thousands of dollars annually to forgotten subscriptions, unconscious spending habits, and recurring charges they're not aware of.

**Solution:** An AI-powered financial leak detector that analyzes bank transaction data to identify:
- **Unused Subscriptions** - Recurring payments for services no longer used
- **Excessive Habits** - Frequent small purchases that accumulate significantly
- **Impulse Spending** - Large irregular purchases suggesting discretionary overspending
- **Price Creep** - Subscriptions that increase in price over time

**Impact:** Help users reclaim lost money through automated detection and actionable recommendations.

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  - Login/Signup                                                 │
│  - CSV Upload                                                   │
│  - Dashboard (Patterns, Leaks)                                  │
│  - Leak Details & Recommendations                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────────┐
│                   FASTAPI BACKEND                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes                                               │   │
│  │ - /api/auth (signup, login, email verification)         │   │
│  │ - /api/transactions (upload, retrieve)                  │   │
│  │ - /api/leaks (analyze patterns for leaks)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │ Business Logic Layer                                     │   │
│  │ - TransactionUploadProcessor (orchestrate pipeline)     │   │
│  │ - DataNormalizer (clean & parse data)                   │   │
│  │ - TransactionEnricher (add deterministic tags)          │   │
│  │ - PatternAggregator (group & aggregate)                 │   │
│  │ - LeakAnalyzer (AI reasoning via Gemini)                │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼──────────────────────────────────┐   │
│  │ Data Access Layer (SQLAlchemy ORM)                       │   │
│  │ - User Management                                        │   │
│  │ - Transaction Storage                                    │   │
│  │ - Pattern Statistics                                     │   │
│  │ - Leak Insights                                          │   │
│  └──────────────────────┬──────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQL
┌────────────────────────▼────────────────────────────────────────┐
│            SQLite Database                                      │
│  - user (accounts)                                              │
│  - transaction (enriched transaction records)                   │
│  - spending_pattern_stats (aggregated evidence)                 │
│  - leak_insight (AI analysis results)                           │
└─────────────────────────────────────────────────────────────────┘

External:
┌─────────────────────────────────────────────────────────────────┐
│            Google Gemini API (AI Reasoning)                     │
│  - Analyzes spending patterns for potential leaks               │
│  - Generates human-readable explanations                        │
│  - Estimates savings potential                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Pipeline Flow

```
1. CSV Upload
   ↓
2. File Parsing & Validation
   ↓
3. Data Cleaning (normalize amounts, dates, remove invalid rows)
   ↓
4. Transaction Enrichment (add categories, merchant hints)
   ↓
5. Store Enriched Transactions (SOURCE OF TRUTH)
   ↓
6. Pattern Aggregation (group by merchant, compute statistics)
   ↓
7. Store Pattern Statistics (aggregated evidence)
   ↓
8. AI Analysis (Gemini reasons over evidence)
   ↓
9. Store Leak Insights (actionable recommendations)
   ↓
10. Display to User (dashboard)
```

---

## Backend Setup

### Prerequisites

- Python 3.8+
- SQLite (included with Python)
- pip package manager

### Installation

1. **Clone Repository**
```bash
cd backend
```

2. **Create Virtual Environment**
```bash
python -m venv hackenv
hackenv\Scripts\activate
```

3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment Variables**
Create `.env` file in backend directory:

```env
# Database
DATABASE_URL=sqlite:///./financial_leak_detector.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_ENVIRONMENT=development

# JWT Authentication
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Email Service
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@leakdetector.com

# Google Gemini API (for AI leak analysis)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.0-flash

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Environment Variables Explanation

#### Database
- `DATABASE_URL`: Connection string for SQLite database

#### API
- `API_HOST`: Server host (0.0.0.0 = accessible from any IP)
- `API_PORT`: Server port
- `API_ENVIRONMENT`: development or production

#### Authentication
- `SECRET_KEY`: Secret key for JWT signing (keep secure in production!)
- `ALGORITHM`: JWT algorithm (HS256 recommended)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (1440 = 24 hours)

#### Email Service
- `SMTP_SERVER`: Gmail SMTP server
- `SMTP_PORT`: Gmail SMTP port
- `SMTP_USERNAME`: Gmail account
- `SMTP_PASSWORD`: Gmail app-specific password (NOT regular password!)
  - Generate at: https://myaccount.google.com/apppasswords
- `FROM_EMAIL`: Sender email address

#### AI/ML
- `GEMINI_API_KEY`: Google Gemini API key
  - Get from: https://makersuite.google.com/app/apikey
- `GEMINI_MODEL`: Model version (gemini-2.0-flash, gemini-2.5-flash, etc.)

#### CORS
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins

### Running the Backend

```bash
# Development (with hot reload)
python main.py

# Or with uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server will be available at `http://localhost:8000`

### API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## Frontend Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Navigate to Frontend**
```bash
cd frontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create `.env.local` file:

```env
VITE_API_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

### Running Frontend

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Frontend will be available at `http://localhost:5173`

### Frontend Features

- **Authentication Pages**
  - Signup with email verification
  - Login with JWT token
  - Forgot password / Reset password
  
- **Transaction Management**
  - Upload CSV/Excel bank statements
  - View enriched transaction records
  - Filter and search transactions
  
- **Pattern Analysis**
  - View spending patterns by merchant
  - See aggregated statistics (frequency, amounts, trends)
  - Category tags for each pattern
  
- **Leak Detection**
  - AI-powered leak identification
  - Confidence scores and risk levels
  - Actionable recommendations
  - Potential annual savings calculation
  
- **Dashboard**
  - Summary of potential savings
  - Recent transactions
  - Active leaks and recommendations
  - Leak resolution tracking

---

## Project Structure

```
agentic-leak-detector/
├── backend/
│   ├── main.py                          # API entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── .env                             # Environment variables
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py                    # SQLAlchemy ORM models
│   │   ├── database.py                  # Database configuration
│   │   ├── schema.py                    # Pydantic schemas
│   │   ├── email_service.py             # Email functionality
│   │   ├── crypto.py                    # Password hashing
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py                  # Authentication endpoints
│   │   │   ├── email.py                 # Email endpoints
│   │   │   ├── transactions_new.py      # Transaction endpoints
│   │   │   └── leaks.py                 # (deprecated)
│   │   │
│   │   └── core/
│   │       ├── transaction_processor.py # Main processing pipeline
│   │       ├── leak_analyzer.py         # AI leak analysis
│   │       └── detector.py              # (deprecated)
│   │
│   └── sample_transactions.csv          # Test data
│
├── frontend/
│   ├── package.json                     # Node dependencies
│   ├── vite.config.ts                   # Vite configuration
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── tsconfig.json                    # TypeScript config
│   ├── .env.local                       # Environment variables
│   │
│   ├── src/
│   │   ├── main.tsx                     # React entry point
│   │   ├── App.tsx                      # Main App component
│   │   ├── index.css                    # Global styles
│   │   │
│   │   ├── components/                  # Reusable components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── pages/                       # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── LeakDashboard.tsx
│   │   │   └── ...
│   │   │
│   │   ├── services/                    # API services
│   │   │   └── api.ts                   # Axios instance
│   │   │
│   │   ├── hooks/                       # Custom React hooks
│   │   │   └── useTransactions.ts
│   │   │
│   │   ├── types/                       # TypeScript types
│   │   │   └── index.ts
│   │   │
│   │   └── utils/                       # Utility functions
│   │       └── crypto.ts
│   │
│   └── public/                          # Static assets
│
└── documentation/
    ├── README.md                        # This file
    ├── API_Docs.md                      # API reference
    ├── Database_Tables.md               # Database schema
    ├── FLOW_VALIDATION.md               # End-to-end flow
    └── LOOPHOLE_FIXES.md                # Architecture changes
```

---

## Key Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database
- **Pydantic** - Data validation
- **JWT** - Token-based authentication
- **Gemini API** - AI/ML reasoning
- **Pandas** - Data processing

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client

---

## Key Features

### Automated Financial Leak Detection
✅ Identifies recurring charges for unused services
✅ Detects excessive spending habits
✅ Flags irregular large purchases
✅ Tracks price increases over time

### Transaction Management
✅ Upload CSV/Excel bank statements
✅ Automatic categorization of transactions
✅ Enriched transaction data with merchant hints
✅ Transaction history and filtering

### Pattern Analysis
✅ Groups transactions by merchant
✅ Computes aggregated statistics
✅ Identifies spending patterns
✅ Temporal analysis (frequency, gaps, trends)

### AI-Powered Insights
✅ Uses Google Gemini for intelligent analysis
✅ Generates confidence scores
✅ Provides actionable recommendations
✅ Estimates annual savings potential

### User Management
✅ Secure signup and login
✅ Email verification
✅ Password reset functionality
✅ JWT-based authentication

---

## Data Privacy & Security

### Security Measures
- **Password Hashing**: Bcrypt for secure password storage
- **JWT Tokens**: Time-limited tokens with expiration
- **Email Verification**: Confirmed user identity
- **CORS Protection**: Restricted cross-origin requests
- **SQL Injection Prevention**: Parameterized queries via ORM
- **Input Validation**: Pydantic schemas validate all inputs

### Data Privacy
- User data stored in local SQLite database
- No data sold or shared with third parties
- Bank statements processed locally
- Gemini API only receives aggregated patterns, not raw transactions
- Users control their own data

### GDPR Compliance
- Data export functionality (recommended)
- Account deletion cascades to all related data
- Transparent data usage
- Optional AI processing

---

## API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /signup` - Create account
- `POST /login` - Get JWT token
- `POST /refresh` - Refresh expired token
- `POST /verify-email` - Verify email with OTP
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset with token

### Email (`/api/email`)
- `POST /send-verification` - Send verification email

### Transactions (`/api/transactions`)
- `POST /upload` - Upload CSV/Excel file
- `GET /patterns` - Get spending patterns
- `GET /raw-transactions` - Get transaction records

### Leak Analysis (`/api/leaks`)
- `POST /analyze` - Run AI analysis for leaks

See [API_Docs.md](API_Docs.md) for detailed endpoint documentation.

---

## Database Schema

See [Database_Tables.md](Database_Tables.md) for complete database documentation:
- User table
- Transaction table
- SpendingPatternStats table
- LeakInsight table

---

## Troubleshooting

### Backend Won't Start
```bash
# Check Python version
python --version  # Should be 3.8+

# Verify virtual environment is activated
# Windows: hackenv\Scripts\activate
# Mac/Linux: source hackenv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check if port 8000 is available
netstat -ano | findstr :8000  # Windows
```

### Gemini API Errors
```bash
# Verify API key
echo $GEMINI_API_KEY  # Should show key (masked)

# Check API key is in .env file
# Get new key from: https://makersuite.google.com/app/apikey

# Verify model name is valid
# Check GEMINI_MODEL in .env
```

### Database Errors
```bash
# Reset database (WARNING: deletes all data!)
rm financial_leak_detector.db

# Restart backend to recreate tables
python main.py
```

### Frontend Can't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check VITE_API_URL in .env.local
# Should be: http://localhost:8000

# Check CORS configuration
# Backend should have http://localhost:5173 in CORS origins
```

---

## Development Workflow

### Adding a New Feature

1. **Backend**
   - Update models.py if database schema changes needed
   - Add endpoint in appropriate router (auth.py, transactions_new.py, etc.)
   - Implement business logic in core/ module
   - Add Pydantic schema in schema.py

2. **Frontend**
   - Create component in src/components/ or page in src/pages/
   - Add API call in src/services/api.ts
   - Add types in src/types/index.ts
   - Update App.tsx routing if needed

3. **Testing**
   - Test API endpoint with curl or Postman
   - Test frontend UI locally
   - Verify database changes

### Common Development Tasks

**Testing a single file:**
```bash
python -c "from app.core.transaction_processor import DataNormalizer; print('Import successful')"
```

**Running API tests:**
```bash
# Using pytest (if installed)
pytest -v

# Or run specific test file
python -m pytest tests/test_auth.py -v
```

**Checking database:**
```bash
# Using sqlite3 CLI
sqlite3 financial_leak_detector.db

# View tables
.tables

# Query users
SELECT id, email, is_email_verified FROM user;
```

---

## Performance Optimization Tips

### Backend
- Add database indexes for frequently queried columns
- Use pagination for large result sets
- Cache aggregated pattern statistics
- Consider async processing for large file uploads

### Frontend
- Implement pagination for transaction lists
- Lazy load leak analysis results
- Cache API responses
- Use React.memo for expensive components

### Database
- Regular backups of SQLite file
- Archive old transactions (older than 2 years)
- Optimize queries using EXPLAIN PLAN

---

## Future Enhancements

1. **Mobile App** - React Native or Flutter app
2. **Real-time Notifications** - Alert for new recurring charges
3. **Budget Planning** - ML-based budget recommendations
4. **Multi-account Support** - Link multiple bank accounts
5. **Integration APIs** - Direct bank feeds (Plaid, etc.)
6. **Advanced Analytics** - Spending trends, forecasts
7. **Multi-language Support** - i18n implementation
8. **Dark Mode** - UI theme switcher
9. **Export Reports** - PDF/Excel reports of leaks
10. **Community Insights** - Comparison with anonymized peers

---

## Contributing

Guidelines for contributing to the project:

1. Create feature branch: `git checkout -b feature/description`
2. Make changes with clear commit messages
3. Test thoroughly (backend and frontend)
4. Submit pull request with description
5. Address review feedback

---

## License

[Add your license here]

---

## Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Email: support@leakdetector.com
- Documentation: See API_Docs.md and Database_Tables.md

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Transaction upload and analysis
- Pattern aggregation
- AI-powered leak detection
- User authentication
- Email verification

---

## Authors

Financial Leak Detector Team

---

Last Updated: January 5, 2026
