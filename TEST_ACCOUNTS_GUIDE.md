# 🧪 Test Accounts Setup Guide

## Quick Setup Instructions

### Option 1: Using Admin Interface (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access Admin Panel:**
   - Go to: `http://localhost:3000/admin`
   - Navigate to "Stylists" section

3. **Create Test Stylist:**
   - Click "Add Stylist"
   - Fill in details:
     - First Name: `Test`
     - Last Name: `Stylist`
     - Email: `teststylist@kelatic.com`
     - Phone: `+15551234568`
     - Bio: `Test stylist for development`
     - Specialties: Select `locs`, `braids`, `natural`
     - Commission Rate: `60`
   - Click "Save"
   - Click "Send Invite" to create auth account
   - Use "Set Temp Password" for immediate testing

4. **Test Client Account:**
   - Clients are created automatically during the booking process
   - Go to `/book` and complete a booking to create a test client

### Option 2: Manual Database Insert (Advanced)

If you have direct database access, you can run this SQL:

```sql
-- Create test stylist profile
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role,
  bio,
  specialties,
  commission_rate,
  is_active
) VALUES (
  gen_random_uuid(),
  'teststylist@kelatic.com',
  'Test',
  'Stylist',
  '+15551234568',
  'stylist',
  'Test stylist for development',
  ARRAY['locs', 'braids', 'natural'],
  60.00,
  true
);

-- Create test client profile
INSERT INTO profiles (
  id,
  email,
  first_name,
  last_name,
  phone,
  role
) VALUES (
  gen_random_uuid(),
  'testclient@kelatic.com',
  'Test',
  'Client',
  '+15551234567',
  'client'
);
```

### Option 3: Production Testing

Since the app is deployed to production, you can also:

1. **Create Stylist Account:**
   - Go to: `https://kelatic.com/admin/stylists`
   - Add a new stylist with test email
   - Set temporary password for testing

2. **Create Client Account:**
   - Go to: `https://kelatic.com/book`
   - Complete a booking with test details
   - The client account will be created automatically

## Test Credentials

Once created, you can use these test accounts:

### Stylist Account
- **Email:** `teststylist@kelatic.com`
- **Password:** Use temp password from admin or reset
- **Login URL:** `/login?type=stylist`
- **Dashboard:** `/stylist`

### Client Account
- **Email:** `testclient@kelatic.com`
- **Password:** Set during booking or use reset
- **Login URL:** `/login?type=client`
- **Dashboard:** `/account`

## Testing Scenarios

### Stylist Testing:
1. Login as stylist
2. View appointments
3. Update availability
4. Manage services
5. View earnings

### Client Testing:
1. Book an appointment
2. View booking history
3. Manage profile
4. Reschedule appointments
5. Cancel bookings

### Admin Testing:
1. Manage stylists
2. View all appointments
3. Process payments
4. Send notifications
5. Manage services

## Notes

- **Development:** Use `localhost:3000` for local testing
- **Production:** Use `kelatic.com` for live testing
- **Passwords:** Always use strong passwords for production
- **Cleanup:** Remove test accounts when done testing

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify database connection
3. Ensure all environment variables are set
4. Check Supabase auth configuration