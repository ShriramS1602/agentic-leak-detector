# import pandas as pd
# import re

# LEVEL_3_KEYWORDS = {
#     "OTT": ["netflix", "hotstar", "zee5", "sony liv", "spotify", "apple music", "prime video"],
#     "FOOD": ["swiggy", "zomato", "uber eats", "dominos", "pizza hut", "kfc", "mcdonald", "restaurant", "cafe", "burger king", "food delivery"],
#     "FUEL": ["petrol", "diesel", "fuel", "hpcl", "bpcl", "indian oil", "shell"],
#     "TRANSPORT": ["uber", "ola", "rapido", "metro", "irctc"],
#     "RETAIL": ["amazon", "flipkart", "myntra", "ajio", "meesho",'big basket'],
#     "HEALTH_FITNESS": ["gym", "cult", "fitness", "physio"],
#     "UTILITIES": ["electricity", "water bill", "gas bill", "broadband", "wifi"],
# }


# NOISE_PATTERNS = [
#     "upi", "imps", "neft", "rtgs","hdfc", "sbi", "icici", "axis", "yesb",
#     "bank", "sbipmopad", "yesb0yblupi", "paytm", "phonepe", "gpay", "googlepay", "vyapar", "merchant", "collect",
# ]



# def normalize_amount_columns(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
#     df = df.copy()
#     for col in cols:
#         df[col] = (
#             df[col]
#             .astype(str)
#             .str.replace(",", "", regex=False)
#             .str.strip()
#             .replace("", pd.NA)
#         )
#         df[col] = pd.to_numeric(df[col], errors="coerce")
#     return df

# def get_money_flow(withdrawal_amount, deposit_amount):
#     """
#     Determines money flow direction based on amount columns.

#     Returns:
#         'OUTFLOW', 'INFLOW', or 'UNKNOWN'
#     """
#     try:
#         if withdrawal_amount is not None and withdrawal_amount > 0:
#             return "OUTFLOW"
#         if deposit_amount is not None and deposit_amount > 0:
#             return "INFLOW"
#         return "UNKNOWN"
#     except TypeError:
#         # Handles non-numeric values safely
#         return "UNKNOWN"


# def add_level_1_tag(df: pd.DataFrame, narration_col: str = "Narration") -> pd.DataFrame:
#     """
#     Adds a Level-1 transaction tag based on payment rail / channel.
#     Deterministic, rule-based, India-focused.

#     Parameters:
#         df (pd.DataFrame): Input transactions dataframe
#         narration_col (str): Column containing transaction narration

#     Returns:
#         pd.DataFrame: DataFrame with new column 'level_1_tag'
#     """

#     def normalize(text: str) -> str:
#         if pd.isna(text):
#             return ""
#         return str(text).lower().strip()

#     def tag_narration(narration: str) -> str:
#         n = normalize(narration)

#         # 1. Salary (override everything)
#         if re.search(r"\b(salary|payroll|wages|ctc|employer)\b", n):
#             return "SALARY"

#         # 2. Interest / Dividend
#         if re.search(r"\b(interest|dividend|fd int|rd int|tds)\b", n):
#             return "INTEREST_DIVIDEND"

#         # 3. Refund / Reversal
#         if re.search(r"\b(refund|reversal|reversed|chargeback|failed|return)\b", n):
#             return "REVERSAL_REFUND"

#         # 4. Internal / Self transfer
#         if re.search(r"\b(self|own|internal|to self)\b", n):
#             return "INTERNAL_TRANSFER"

#         # 5. UPI
#         if re.search(r"\b(upi|@ybl|@ok|@axis|@hdfc|@sbi|@icici|paytm|phonepe|gpay|googlepay|amazonpay|bhim)\b", n):
#             return "UPI"

#         # 6. ACH / NACH / ECS
#         if re.search(r"\b(ach|nach|ecs|mandate|auto debit|si)\b", n):
#             return "ACH"

#         # 7. IMPS
#         if re.search(r"\b(imps|mmt|mobile transfer)\b", n):
#             return "IMPS"

#         # 8. NEFT
#         if re.search(r"\b(neft|n-e-f-t|neft cr|neft dr)\b", n):
#             return "NEFT"

#         # 9. RTGS
#         if re.search(r"\b(rtgs|r-t-g-s)\b", n):
#             return "RTGS"

#         # 10. Card
#         if re.search(r"\b(pos|card|debit card|credit card|visa|mastercard|rupay|amex|ecom|online)\b", n):
#             return "CARD"

#         # 11. Cash / ATM
#         if re.search(r"\b(cash|atm|atm wdl|cash wdl|cash dep|withdrawal)\b", n):
#             return "CASH"

#         # 12. Fallback
#         return "UNKNOWN"

#     df = df.copy()
#     df["level_1_tag"] = df[narration_col].apply(tag_narration)
#     return df

# def add_level_2_tag(
#     df: pd.DataFrame,
#     level_1_col: str = "level_1_tag",
#     withdrawal_col: str = "Withdrawal Amt.",
#     deposit_col: str = "Deposit Amt.",
# ) -> pd.DataFrame:
#     """
#     Adds Level-2 transaction classification:
#     INCOME / EXPENSE / TRANSFER / ADJUSTMENT / UNKNOWN
#     """

#     def get_direction(row):
#         withdrawal = row.get(withdrawal_col)
#         deposit = row.get(deposit_col)

#         if pd.notna(withdrawal) and withdrawal > 0 and pd.isna(deposit):
#             return "DEBIT"
#         if pd.notna(deposit) and deposit > 0 and pd.isna(withdrawal):
#             return "CREDIT"
#         return "UNKNOWN"

#     def classify(row):
#         level_1 = row[level_1_col]
#         direction = get_direction(row)

#         # 1. Adjustments
#         if level_1 == "REVERSAL_REFUND":
#             return "ADJUSTMENT"

#         # 2. Transfers
#         if level_1 == "INTERNAL_TRANSFER":
#             return "TRANSFER"

#         # 3. Income
#         if direction == "CREDIT" and level_1 in {
#             "SALARY",
#             "INTEREST_DIVIDEND",
#             "NEFT",
#             "RTGS",
#             "ACH",
#         }:
#             return "INCOME"

#         # 4. Expense
#         if direction == "DEBIT" and level_1 in {
#             "UPI",
#             "CARD",
#             "CASH",
#             "IMPS",
#             "NEFT",
#             "RTGS",
#             "ACH",
#         }:
#             return "EXPENSE"

#         # 5. Fallback
#         return "UNKNOWN"

#     df = df.copy()
#     df["level_2_tag"] = df.apply(classify, axis=1)
#     return df

# def add_level_3_tag(
#     df: pd.DataFrame,
#     narration_col: str = "Narration",
#     level_2_col: str = "level_2_tag",
# ) -> pd.DataFrame:
#     """
#     Adds Level-3 coarse category tagging.
#     Applies ONLY to EXPENSE rows.
#     Conservative, keyword-based, rule-driven.
#     """

#     def normalize(text: str) -> str:
#         if pd.isna(text):
#             return ""
#         return str(text).lower()

#     def classify_level_3(row) -> str:
#         # Level-3 applies only to expenses
#         if row[level_2_col] != "EXPENSE":
#             return "UNKNOWN"

#         narration = normalize(row[narration_col])

#         # Priority order matters
#         for category, keywords in LEVEL_3_KEYWORDS.items():
#             for kw in keywords:
#                 if kw in narration:
#                     return category

#         return "UNKNOWN"

#     df = df.copy()
#     df["level_3_tag"] = df.apply(classify_level_3, axis=1)
#     return df

# def normalize_text(text: str) -> str:
#     if pd.isna(text):
#         return ""
#     return re.sub(r"\s+", " ", text.lower()).strip()


# def is_noise_token(token: str) -> bool:
#     if len(token) < 3:
#         return True
#     if any(pat in token for pat in NOISE_PATTERNS):
#         return True
#     if re.search(r"\d{4,}", token):  # long numeric sequences
#         return True
#     if "@" in token:  # UPI handles
#         return True
#     return False


# def extract_merchant_hint(narration: str) -> str:
#     text = normalize_text(narration)
#     if not text:
#         return "UNKNOWN"

#     # Split by hyphen (candidate generator)
#     tokens = [t.strip() for t in text.split("-") if t.strip()]

#     candidates = []
#     for token in tokens:
#         if not is_noise_token(token):
#             candidates.append(token)

#     if not candidates:
#         return "UNKNOWN"

#     # Prefer:
#     # 1. tokens with spaces (human names / shop names)
#     # 2. longer alphabetic tokens
#     candidates.sort(
#         key=lambda t: (
#             " " in t,                # human-readable
#             len(re.findall(r"[a-z]", t)),  # alphabetic density
#             len(t)
#         ),
#         reverse=True
#     )

#     return candidates[0]

# def add_merchant_hint(
#     df: pd.DataFrame,
#     narration_col: str = "Narration"
# ) -> pd.DataFrame:
#     df = df.copy()
#     df["merchant_hint"] = df[narration_col].apply(extract_merchant_hint)
#     return df


# test_df = pd.read_csv(r"c:\Users\SHRIRAM\Downloads\Acct_Statement_XXXXXXXX9888_01012026 - Copy.csv")

# test_df = normalize_amount_columns(
#     test_df,
#     cols=["Withdrawal Amt.", "Deposit Amt."]
# )

# test_df["money_flow"] = test_df.apply(
#     lambda r: get_money_flow(r["Withdrawal Amt."], r["Deposit Amt."]),
#     axis=1
# )

# res = add_level_1_tag(test_df, narration_col="Narration")
# print(res['level_1_tag'].value_counts(dropna=False))

# res = add_level_2_tag(res)
# print(res['level_2_tag'].value_counts(dropna=False))

# res = add_level_3_tag(res)
# print(res['level_3_tag'].value_counts(dropna=False))

# res = add_merchant_hint(res, narration_col="Narration")
# print(res['merchant_hint'].value_counts(dropna=False))

# print(res[['Narration', 'level_1_tag', 'level_2_tag','level_3_tag','merchant_hint','money_flow', 'Withdrawal Amt.', 'Deposit Amt.']].head(20))