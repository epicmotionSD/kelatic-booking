# Kelatic Google Ads Campaign Strategy

## Quick Setup Checklist
1. Create Google Ads account at ads.google.com
2. Get your Google Ads ID (format: AW-XXXXXXXXXX)
3. Create conversion actions for "Booking Complete" and "Lead Form"
4. Add these to your `.env`:
   ```
   NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXXX
   NEXT_PUBLIC_GOOGLE_ADS_BOOKING_CONVERSION=XXXXXXXXXXX
   NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION=XXXXXXXXXXX
   ```
5. Redeploy to Vercel

---

## Campaign 1: Loc Services (High Intent)

### Search Ads - Responsive Search Ads

**Headlines (max 30 chars each):**
1. Houston Loc Specialists
2. Expert Loc Maintenance
3. Locs Done Right - Book Now
4. Professional Loc Services
5. Starter Locs Houston TX
6. Loc Retwists Near You
7. Book Your Loc Appointment
8. Trusted Loc Stylists
9. Premium Loc Care Houston
10. Same Week Appointments
11. 5-Star Loc Services
12. Loc Shop by Kelatic
13. Transform Your Locs Today
14. Licensed Loc Experts

**Descriptions (max 90 chars each):**
1. Professional loc services in Houston. Starter locs, retwists, repairs & more. Book online!
2. Expert loc stylists ready to serve you. Easy online booking. Same week availability.
3. From starter locs to maintenance - we've got you covered. Book your appointment today!
4. Transform your hair journey with Houston's trusted loc specialists. See our services.
5. Quality loc care at 9430 Richmond Ave. Professional stylists, beautiful results guaranteed.

**Keywords:**
- loc retwist houston
- starter locs near me
- loc maintenance houston tx
- loc specialists houston
- loc salon houston
- loc repair houston
- interlocking locs houston
- sisterlocks houston
- loc stylist near me
- dreadlock salon houston

**Negative Keywords:**
- free
- cheap
- DIY
- tutorial
- how to

---

## Campaign 2: Hair Salon (Broader Reach)

### Search Ads

**Headlines:**
1. KeLatic Hair Lounge
2. Houston Hair Specialists
3. Book Your Hair Appt Now
4. Premium Hair Services
5. Natural Hair Experts
6. Walk-Ins Welcome
7. Affordable Hair Care
8. Top Houston Stylists
9. Hair Transformation
10. Book Online - Easy!

**Descriptions:**
1. Full-service hair salon in Houston. Locs, braids, natural hair care & more. Book online!
2. Your hair deserves the best. Professional stylists, convenient online booking. Visit us!
3. From consultation to styling - complete hair care at KeLatic. Schedule your visit today.

**Keywords:**
- hair salon houston
- black hair salon near me
- natural hair salon houston
- braiding salon houston
- hair stylist houston tx

---

## Campaign 3: Loc Academy (Training/Education)

### Search Ads

**Headlines:**
1. Learn Loc Techniques
2. Loc Certification Course
3. Become a Loc Specialist
4. Loc Training Houston
5. Hands-On Loc Classes
6. Start Your Loc Career
7. Professional Loc Training
8. Loc Academy by Kelatic

**Descriptions:**
1. Master loc techniques with hands-on training from certified instructors. Enroll today!
2. Turn your passion into profit. Professional loc training program in Houston. Learn more.
3. Comprehensive loc education - from basics to advanced. Get certified. Start earning.

**Keywords:**
- loc training course
- learn to do locs
- loc certification
- loctician training houston
- how to become a loctician

---

## Campaign 4: Local Service Ads (Google Guaranteed)

### Business Profile Optimization
- **Business Name:** KeLatic Hair Lounge
- **Address:** 9430 Richmond Ave, Houston, TX 77063
- **Phone:** (713) 485-4000
- **Hours:** Update in Google Business Profile
- **Services:** Loc Maintenance, Starter Locs, Retwists, Repairs, Natural Hair Care
- **Photos:** Upload high-quality before/after photos

---

## Budget Recommendations

| Campaign | Daily Budget | Monthly Est. | Goal |
|----------|-------------|--------------|------|
| Loc Services | $30-50 | $900-1,500 | Bookings |
| Hair Salon | $20-30 | $600-900 | Awareness |
| Loc Academy | $15-25 | $450-750 | Enrollments |
| Local Ads | $10-20 | $300-600 | Calls/Directions |

**Start with:** $50/day total ($1,500/month) focused on Loc Services campaign

---

## Conversion Tracking Setup

### In Google Ads Dashboard:
1. Go to Tools & Settings > Conversions
2. Click "+ New conversion action"
3. Select "Website"
4. Enter kelatic.com
5. Create these conversions:

**Conversion 1: Booking Complete**
- Name: `Booking Complete`
- Category: `Purchase`
- Value: Use different values for each conversion (dynamic)
- Count: One conversion per click

**Conversion 2: Lead Form**
- Name: `Contact Form Submission`
- Category: `Lead`
- Value: $50 (estimated lead value)
- Count: One conversion per click

### Get Your Conversion IDs:
After creating, click on each conversion > "Use Google Tag Manager" or "Install tag manually" to find:
- Conversion ID (format: AW-XXXXXXXXXX)
- Conversion Label (format: XXXXXXXXXXX)

---

## Ad Extensions to Add

### Sitelink Extensions
1. **Book Now** - Direct link to /book
2. **Our Services** - Link to services page
3. **Meet Our Stylists** - Link to team page
4. **Contact Us** - Link to contact page

### Call Extension
- (713) 485-4000

### Location Extension
- Link Google Business Profile

### Callout Extensions
- Online Booking Available
- Same Week Appointments
- Licensed Professionals
- 5-Star Reviews

### Structured Snippets
- **Services:** Starter Locs, Retwists, Repairs, Interlocking, Natural Hair

---

## Quick Launch Checklist

- [ ] Create Google Ads account
- [ ] Set up billing
- [ ] Create "Loc Services" campaign first
- [ ] Add responsive search ads with headlines/descriptions above
- [ ] Add keywords (start with exact match, expand to phrase)
- [ ] Set up conversion tracking
- [ ] Add env variables to Vercel
- [ ] Enable location targeting (Houston + 25 mile radius)
- [ ] Set ad schedule (business hours + evenings)
- [ ] Link Google Analytics
- [ ] Review and publish

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Click-Through Rate | 3-5% |
| Cost Per Click | $2-5 |
| Conversion Rate | 5-10% |
| Cost Per Booking | $20-50 |

Monitor weekly and adjust bids/keywords based on performance.
