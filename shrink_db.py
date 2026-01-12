# Configuration: Enter your file name here
INPUT_FILE = 'database.sql'  # <-- CHANGE THIS to your actual .sql file name
OUTPUT_FILE = 'amelia_clients_only.sql'

# Tables we want to extract
TARGET_TABLES = [
    'amelia_users', 
    'amelia_appointments', 
    'amelia_customer_bookings'
]

def extract_amelia_data():
    print(f"Reading {INPUT_FILE}...")
    inside_target_block = False
    
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8', errors='ignore') as infile, \
             open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
            
            for line in infile:
                # Check if this line starts a new SQL statement
                stripped = line.strip()
                if stripped.startswith(('CREATE TABLE', 'INSERT INTO', 'DROP TABLE', 'ALTER TABLE')):
                    # Check if this statement is for one of our target tables
                    if any(table in line for table in TARGET_TABLES):
                        inside_target_block = True
                    else:
                        inside_target_block = False
                
                # If we are inside a target block, write the line
                if inside_target_block:
                    outfile.write(line)
                    
                    # If the line ends with a semicolon, the statement is finished
                    if stripped.endswith(';'):
                        inside_target_block = False

        print(f"Success! Created {OUTPUT_FILE}")
        print("Please upload the 'amelia_clients_only.sql' file to the chat.")
        
    except FileNotFoundError:
        print(f"Error: Could not find '{INPUT_FILE}'. Make sure the file name is correct.")

if __name__ == '__main__':
    extract_amelia_data()