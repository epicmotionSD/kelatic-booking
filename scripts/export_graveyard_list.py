import pandas as pd
import re
import datetime

# --- CONFIGURATION ---
CURRENT_DATE = datetime.datetime(2026, 1, 15)

data = {
    'client_id': [7, 2020, 1605, 10, 11],
    'first_name': ['Steven', 'Deonte', 'Zenon', 'LaKenya', 'Jerome'],
    'phone_raw': ['+13032463175', '+1 (678) 770-4123', '+12813801882', '+17135823052', '+12817095700'],
    'last_appt_date': ['2021-03-09', '2024-03-21', '2025-10-09', '2021-03-09', '2021-03-12']
}

df = pd.DataFrame(data)
df['last_appt_date'] = pd.to_datetime(df['last_appt_date'])
df['days_inactive'] = (CURRENT_DATE - df['last_appt_date']).dt.days

def classify_client(days):
    if days < 180:
        return 'CORE'
    elif 180 <= days <= 365:
        return 'DRIFTER'
    else:
        return 'GRAVEYARD'

df['segment'] = df['days_inactive'].apply(classify_client)

def clean_phone(phone):
    clean = re.sub(r'\D', '', phone)
    if len(clean) == 10:
        return f"+1{clean}"
    elif len(clean) == 11 and clean.startswith('1'):
        return f"+{clean}"
    else:
        return "INVALID"

df['clean_phone'] = df['phone_raw'].apply(clean_phone)

graveyard_list = df[
    (df['segment'] == 'GRAVEYARD') & 
    (df['clean_phone'] != 'INVALID')
].copy()

graveyard_list[['first_name', 'clean_phone', 'days_inactive', 'segment']].to_csv('launch_list_graveyard.csv', index=False)
print('Exported graveyard leads to launch_list_graveyard.csv')
