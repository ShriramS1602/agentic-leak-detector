# Financial Leak Detector - Database Schema Documentation

Complete database schema and usage guide for the Financial Leak Detector application.

## Database Type
SQLite (SQLAlchemy ORM)

## Tables Overview

| Table | Purpose | Primary Key |
|-------|---------|-------------|
| `user` | User accounts and authentication | `id` |
| `transaction` | Enriched transaction records | `id` |
| `spending_pattern_stats` | Aggregated spending evidence | `id` |
| `leak_insight` | AI-generated leak analysis | `id` |

---

## 1. User Table

**Purpose:** Store user account information and authentication data

**Schema:**
```sql
CREATE TABLE user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255),
  name VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Columns:**

| Column | Type | Constraints | Usage |
|--------|------|-------------|-------|
| `id` | Integer | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| `email` | String(255) | NOT NULL, UNIQUE | User's email (login credential) |
| `username` | String(255) | - | Optional username |
| `name` | String(255) | - | User's full name |
| `password_hash` | String(255) | NOT NULL | Bcrypt hashed password |
| `is_active` | Boolean | DEFAULT TRUE | Account status |
| `is_email_verified` | Boolean | DEFAULT FALSE | Email verification status |
| `created_at` | DateTime | AUTO | Account creation timestamp |
| `updated_at` | DateTime | AUTO | Last update timestamp |

**Relationships:**
- One-to-Many with `transaction` (User has many Transactions)
- One-to-Many with `spending_pattern_stats` (User has many Patterns)
- One-to-Many with `leak_insight` (User has many LeakInsights)

**Indexes:**
- `email` (UNIQUE) - For fast email lookups during login

---

## 2. Transaction Table

**Purpose:** Store individual enriched transaction records from uploaded files

**Schema:**
```sql
CREATE TABLE transaction (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  file_upload_id VARCHAR(255) NOT NULL,
  txn_date DATE NOT NULL,
  narration TEXT NOT NULL,
  withdrawal_amount DECIMAL(12,2),
  deposit_amount DECIMAL(12,2),
  money_flow VARCHAR(50) NOT NULL,
  level_1_tag VARCHAR(100),
  level_2_tag VARCHAR(100),
  level_3_tag VARCHAR(100),
  merchant_hint VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
)
```

**Columns:**

| Column | Type | Constraints | Usage |
|--------|------|-------------|-------|
| `id` | Integer | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| `user_id` | Integer | NOT NULL, FK | Owner of transaction |
| `file_upload_id` | String(255) | NOT NULL | Batch ID for tracking uploads |
| `txn_date` | Date | NOT NULL | Transaction date (YYYY-MM-DD) |
| `narration` | Text | NOT NULL | Original transaction description |
| `withdrawal_amount` | Decimal(12,2) | - | Amount debited (NULL if income) |
| `deposit_amount` | Decimal(12,2) | - | Amount credited (NULL if expense) |
| `money_flow` | String(50) | NOT NULL | INCOME, EXPENSE, or TRANSFER |
| `level_1_tag` | String(100) | - | High-level category (e.g., FOOD_AND_DINING) |
| `level_2_tag` | String(100) | - | Mid-level category (e.g., COFFEE) |
| `level_3_tag` | String(100) | - | Specific category (e.g., COFFEE_SHOP) |
| `merchant_hint` | String(255) | - | Extracted merchant name |
| `created_at` | DateTime | AUTO | Record creation timestamp |

**Relationships:**
- Many-to-One with `user` (Transaction belongs to User)

**Indexes:**
- `(user_id, txn_date)` - For fast user transaction queries
- `merchant_hint` - For pattern aggregation
- `money_flow` - For expense filtering

**Data Flow:**
1. CSV file uploaded by user
2. Rows cleaned and normalized (dates, amounts)
3. Enriched with tags (via TransactionEnricher)
4. Converted to records with file_upload_id
5. Stored in Transaction table (SOURCE OF TRUTH)

**Example Data:**
```
id | user_id | file_upload_id | txn_date | narration | withdrawal_amount | deposit_amount | money_flow | level_1_tag | level_2_tag | level_3_tag | merchant_hint
1  | 1       | 550e8400... | 2026-01-01 | STARBUCKS COFFEE | 50.00 | NULL | EXPENSE | FOOD_AND_DINING | COFFEE | COFFEE_SHOP | starbucks
```

---

## 3. SpendingPatternStats Table

**Purpose:** Store aggregated spending evidence for pattern analysis

**Schema:**
```sql
CREATE TABLE spending_pattern_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  merchant_hint VARCHAR(255) NOT NULL,
  level_1_tag VARCHAR(100),
  level_2_tag VARCHAR(100),
  level_3_tag VARCHAR(100),
  dominant_level_3_tag VARCHAR(100),
  level_3_confidence DECIMAL(3,2),
  
  -- Transaction count evidence
  txn_count INTEGER NOT NULL,
  
  -- Amount evidence
  total_amount DECIMAL(15,2),
  avg_amount DECIMAL(12,2),
  amount_std DECIMAL(12,2),
  amount_min DECIMAL(12,2),
  amount_max DECIMAL(12,2),
  
  -- Temporal evidence
  active_duration_days INTEGER,
  avg_gap_days DECIMAL(8,2),
  gap_std_days DECIMAL(8,2),
  gap_min_days INTEGER,
  gap_max_days INTEGER,
  last_txn_days_ago INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  UNIQUE (user_id, merchant_hint)
)
```

**Columns:**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer | Unique pattern identifier |
| `user_id` | Integer | Owner of pattern |
| `merchant_hint` | String(255) | Merchant name (grouping key) |
| `level_1_tag` | String(100) | High-level category |
| `level_2_tag` | String(100) | Mid-level category |
| `level_3_tag` | String(100) | Specific category |
| `dominant_level_3_tag` | String(100) | Most common specific category |
| `level_3_confidence` | Decimal(3,2) | Confidence in categorization (0.0-1.0) |
| `txn_count` | Integer | Number of transactions for this merchant |
| `total_amount` | Decimal(15,2) | Total spent at this merchant |
| `avg_amount` | Decimal(12,2) | Average transaction amount |
| `amount_std` | Decimal(12,2) | Standard deviation of amounts |
| `amount_min` | Decimal(12,2) | Minimum transaction amount |
| `amount_max` | Decimal(12,2) | Maximum transaction amount |
| `active_duration_days` | Integer | Days from first to last transaction |
| `avg_gap_days` | Decimal(8,2) | Average days between transactions |
| `gap_std_days` | Decimal(8,2) | Standard deviation of gaps |
| `gap_min_days` | Integer | Minimum days between transactions |
| `gap_max_days` | Integer | Maximum days between transactions |
| `last_txn_days_ago` | Integer | Days since last transaction |
| `created_at` | DateTime | Pattern creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

**Relationships:**
- Many-to-One with `user` (Pattern belongs to User)
- One-to-Many with `leak_insight` (Pattern has many Insights)

**Unique Constraint:**
- `(user_id, merchant_hint)` - One pattern per merchant per user (upsertable)

**Indexes:**
- `(user_id, merchant_hint)` - For upsert operations
- `txn_count` - For filtering patterns with >= 2 transactions

**Data Flow:**
1. Transactions stored in Transaction table
2. TransactionPersistence.persist_enriched_transactions() stores them
3. PatternAggregator.aggregate_patterns() filters EXPENSE transactions
4. Groups by merchant_hint
5. Computes all aggregated statistics
6. TransactionPersistence.persist_pattern_stats() upserts into this table

**Upsert Logic:**
- If `(user_id, merchant_hint)` exists: UPDATE all fields
- If `(user_id, merchant_hint)` is new: INSERT row
- Allows re-uploading same file without duplication

**Example Data:**
```
id | user_id | merchant_hint | txn_count | total_amount | avg_amount | avg_gap_days | last_txn_days_ago
1  | 1       | starbucks     | 54        | 810.00       | 15.00      | 6.8          | 1
2  | 1       | netflix       | 12        | 1788.00      | 149.00     | 30.0         | 3
```

**Filtering Criteria:**
- Only EXPENSE transactions included
- Only merchants with `txn_count >= 2` included
- Re-runs update existing records rather than creating duplicates

---

## 4. LeakInsight Table

**Purpose:** Store AI-generated leak analysis and recommendations

**Schema:**
```sql
CREATE TABLE leak_insight (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  pattern_id INTEGER NOT NULL,
  leak_category VARCHAR(100) NOT NULL,
  leak_probability DECIMAL(3,2) NOT NULL,
  reasoning TEXT NOT NULL,
  actionable_step TEXT NOT NULL,
  estimated_annual_saving DECIMAL(15,2) NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (pattern_id) REFERENCES spending_pattern_stats(id) ON DELETE CASCADE
)
```

**Columns:**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer | Unique insight identifier |
| `user_id` | Integer | Owner of insight |
| `pattern_id` | Integer | Linked spending pattern (FK) |
| `leak_category` | String(100) | Type: unused_subscription, excessive_habit, impulse_spending, etc. |
| `leak_probability` | Decimal(3,2) | AI confidence (0.0-1.0) |
| `reasoning` | Text | AI explanation of why this is a leak |
| `actionable_step` | Text | Specific action user can take |
| `estimated_annual_saving` | Decimal(15,2) | Conservative estimated savings |
| `is_resolved` | Boolean | User action status |
| `resolved_at` | DateTime | When user resolved/addressed leak |
| `created_at` | DateTime | Insight generation timestamp |

**Relationships:**
- Many-to-One with `user` (Insight belongs to User)
- Many-to-One with `spending_pattern_stats` (Insight analyzes Pattern)

**Foreign Keys:**
- `user_id` → `user(id)` (CASCADE DELETE)
- `pattern_id` → `spending_pattern_stats(id)` (CASCADE DELETE)

**Indexes:**
- `(user_id, is_resolved)` - For user's unresolved leaks
- `pattern_id` - For tracing insights to patterns

**Leak Categories:**
- `unused_subscription` - Recurring charge for unused service
- `excessive_habit` - Frequent discretionary spending
- `impulse_spending` - Large irregular purchases
- `discretionary_spending` - Optional purchases
- `essential_spending` - Necessary expenses (usually not a leak)
- `investment` - Investment-related activity
- `inactive_spending` - No longer active
- `infrequent_spending` - Not recurring
- `intentional_discretionary_spending` - Intentional (e.g., charity)

**Data Flow:**
1. LeakAnalyzer.analyze_patterns() reads SpendingPatternStats
2. Sends to Gemini AI for reasoning
3. AI generates leak insights with:
   - leak_category (what type of leak)
   - leak_probability (confidence 0.0-1.0)
   - reasoning (why it's a leak)
   - actionable_step (what to do)
   - estimated_annual_saving (potential savings)
4. Stored in LeakInsight table with pattern_id FK

**Example Data:**
```
id | user_id | pattern_id | leak_category | leak_probability | reasoning | actionable_step | estimated_annual_saving | is_resolved
1  | 1       | 21         | unused_subscription | 0.95 | Perfectly consistent monthly autopay pattern strongly suggests unused subscription | Review and cancel if not using | 2388.00 | false
2  | 1       | 1          | excessive_habit | 0.85 | 54 frequent coffee shop visits (every 6.8 days) suggest discretionary habit | Reduce frequency or bring beverages from home | 200.00 | false
```

---

## Query Examples

### Find all transactions for a user
```sql
SELECT * FROM transaction 
WHERE user_id = 1 
ORDER BY txn_date DESC
```

### Find user's most frequent merchants
```sql
SELECT merchant_hint, txn_count, avg_amount, total_amount 
FROM spending_pattern_stats 
WHERE user_id = 1 
ORDER BY txn_count DESC
```

### Find potential leaks by savings potential
```sql
SELECT li.*, sps.merchant_hint, sps.txn_count
FROM leak_insight li
JOIN spending_pattern_stats sps ON li.pattern_id = sps.id
WHERE li.user_id = 1 AND li.is_resolved = FALSE
ORDER BY li.estimated_annual_saving DESC
```

### Calculate total annual savings potential
```sql
SELECT SUM(estimated_annual_saving) as total_potential_savings
FROM leak_insight
WHERE user_id = 1 AND is_resolved = FALSE
```

### Track transaction upload batches
```sql
SELECT file_upload_id, COUNT(*) as txn_count, 
       MIN(txn_date) as first_date, MAX(txn_date) as last_date,
       SUM(CASE WHEN withdrawal_amount IS NOT NULL THEN withdrawal_amount ELSE 0 END) as total_expenses
FROM transaction
WHERE user_id = 1
GROUP BY file_upload_id
ORDER BY created_at DESC
```

---

## Data Integrity Rules

### Cascade Rules
- When `user` deleted: All transactions, patterns, and insights deleted
- When `spending_pattern_stats` deleted: All linked insights deleted

### Unique Constraints
- `user.email` - No duplicate emails
- `spending_pattern_stats(user_id, merchant_hint)` - One pattern per merchant per user

### Not Null Constraints
- `transaction.user_id`, `txn_date`, `narration`, `money_flow`, `file_upload_id`
- `spending_pattern_stats.user_id`, `merchant_hint`, `txn_count`
- `leak_insight.user_id`, `pattern_id`, `leak_category`, `leak_probability`, `reasoning`, `actionable_step`, `estimated_annual_saving`

---

## Data Size Estimates

For a typical user uploading monthly bank statements:

| Table | Rows | Size |
|-------|------|------|
| `user` | 1 | < 1 KB |
| `transaction` | ~1000-5000 per upload | ~100-500 KB |
| `spending_pattern_stats` | 20-100 | ~10-50 KB |
| `leak_insight` | 20-100 | ~10-50 KB |

**Annual Usage (12 uploads per year):**
- Transactions: ~12,000-60,000 rows
- Database size: ~5-10 MB

---

## Backup Strategy

Recommended backups:
1. Daily automated backups of SQLite database file
2. Monthly export of spending_pattern_stats and leak_insight (for analysis)
3. Keep transaction history for 3+ years for trend analysis

---

## Performance Optimization

Existing indexes provide good performance for:
- User authentication queries
- Pattern aggregation queries
- Leak analysis queries

For large datasets (100K+ transactions), consider:
- Partitioning by user_id
- Archiving old transactions
- Denormalizing commonly-accessed aggregations

---

## Migration from Old Schema

If migrating from old `RawTransaction` and `SpendingPattern` tables:

1. Migrate transactions with enrichment fields to `transaction` table
2. Compute aggregations and migrate to `spending_pattern_stats`
3. Map old pattern detections to leak_insight category
4. Update user references
5. Drop old tables after verification
