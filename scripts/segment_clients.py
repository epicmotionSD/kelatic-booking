import pandas as pd
import re
import datetime

# --- CONFIGURATION ---
# Set the "Current Date" for the simulation
CURRENT_DATE = datetime.datetime(2026, 1, 15)

# 1. MOCK DATA LOADING (Replace this with actual SQL parsing in production)
# In a real scenario, you would read the SQL file or connect to the DB.
# Here, I am reconstructing the logic based on your file structure.

data = {
    'client_id': [7, 2020, 1605, 10, 11],
    'first_name': ['Steven', 'Deonte', 'Zenon', 'LaKenya', 'Jerome'],
    'phone_raw': ['+13032463175', '+1 (678) 770-4123', '+12813801882', '+17135823052', '+12817095700'],
    'last_appt_date': ['2021-03-09', '2024-03-21', '2025-10-09', '2021-03-09', '2021-03-12']
}

df = pd.DataFrame(data)
df['last_appt_date'] = pd.to_datetime(df['last_appt_date'])

# 2. CALCULATE INACTIVITY
df['days_inactive'] = (CURRENT_DATE - df['last_appt_date']).dt.days

# 3. SEGMENTATION LOGIC
def classify_client(days):
    if days < 180: # Less than 6 months
        return 'CORE'
    elif 180 <= days <= 365: # 6 to 12 months
        return 'DRIFTER'
    else: # More than 12 months
        return 'GRAVEYARD'

df['segment'] = df['days_inactive'].apply(classify_client)

# 4. PHONE SANITIZATION (The "10DLC" Wash)
def clean_phone(phone):
    # Remove all non-numeric characters
    clean = re.sub(r'\D', '', phone)
    # If it starts with '1' and is 11 digits, strip the '1' (optional, depends on your SMS tool)
    # Most tools prefer E.164 (+1...) but some want just the 10 digits.
    # Let's standardize to E.164: +1XXXXXXXXXX
    if len(clean) == 10:
        return f"+1{clean}"
    elif len(clean) == 11 and clean.startswith('1'):
        return f"+{clean}"
    else:
        return "INVALID" # Flag for manual review

df['clean_phone'] = df['phone_raw'].apply(clean_phone)

# 5. FILTER FOR THE PILOT
graveyard_list = df[
    (df['segment'] == 'GRAVEYARD') & 
    (df['clean_phone'] != 'INVALID')
].copy()

# 6. OUTPUT
print(f"Total Database Size: {len(df)}")
print(f"Graveyard Leads Identified: {len(graveyard_list)}")
print("\nSample Ready for Export:")
print(graveyard_list[['first_name', 'clean_phone', 'days_inactive', 'segment']])

# To save: graveyard_list.to_csv('launch_list_graveyard.csv', index=False)