import pandas as pd
import re
import datetime

# --- CONFIGURATION ---
CURRENT_DATE = datetime.datetime(2026, 1, 15)

# 1. LOAD DATA
users = pd.read_csv('gzf_amelia_users.csv')
users['last_appt_date'] = pd.to_datetime(users['last_appt_date'], errors='coerce')

# 2. CALCULATE INACTIVITY
def days_inactive(row):
    if pd.isnull(row['last_appt_date']):
        return None
    return (CURRENT_DATE - row['last_appt_date']).days

users['days_inactive'] = users.apply(days_inactive, axis=1)

# 3. SEGMENTATION LOGIC
def classify_client(days):
    if days is None:
        return 'NO_APPT'
    if days < 180:
        return 'CORE'
    elif 180 <= days <= 365:
        return 'DRIFTER'
    else:
        return 'GRAVEYARD'

users['segment'] = users['days_inactive'].apply(classify_client)

# 4. PHONE SANITIZATION
def clean_phone(phone):
    if pd.isnull(phone):
        return 'INVALID'
    clean = re.sub(r'\D', '', str(phone))
    if len(clean) == 10:
        return f"+1{clean}"
    elif len(clean) == 11 and clean.startswith('1'):
        return f"+{clean}"
    else:
        return 'INVALID'

users['clean_phone'] = users['phone'].apply(clean_phone)

# 5. EXPORT SEGMENTED DATA
users.to_csv('gzf_amelia_users_segmented.csv', index=False)

# 6. EXPORT GRAVEYARD LEADS
graveyard = users[(users['segment'] == 'GRAVEYARD') & (users['clean_phone'] != 'INVALID')]
graveyard[['firstName','lastName','email','clean_phone','days_inactive','segment']].to_csv('launch_list_graveyard.csv', index=False)

print('Exported segmented users to gzf_amelia_users_segmented.csv')
print('Exported graveyard leads to launch_list_graveyard.csv')
