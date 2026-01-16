import pandas as pd

# Load segmented users
users = pd.read_csv('gzf_amelia_users_segmented.csv')

# Count by segment
segment_counts = users['segment'].value_counts()
print('Segment Summary:')
print(segment_counts)
