# Booking System Documentation

## Overview
This document describes the booking system implementation for the natuurhuisje application.

## Database Schema

### Bookings Table
```sql
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Booking Status
- `pending`: Booking created, waiting for host confirmation
- `confirmed`: Booking confirmed by host
- `cancelled`: Booking cancelled (by guest or host)
- `completed`: Booking finished successfully

## File Structure

### Database Migration
- `supabase/migrations/20240324000001_create_bookings_table.sql` - Database schema and RLS policies

### TypeScript Types
- `types/booking.ts` - TypeScript interfaces for booking data

### Supabase Functions
- `lib/supabase-bookings.ts` - Functions for booking operations:
  - `createBooking()` - Create new booking
  - `updateBookingStatus()` - Update booking status
  - `getUserBookings()` - Get bookings for a user
  - `getHostBookings()` - Get bookings for a host
  - `checkBookingAvailability()` - Check if dates are available

### Pages
- `app/[lang]/booking/[id]/page.tsx` - Booking form page
- `app/[lang]/booking/confirm/page.tsx` - Booking confirmation page
- `app/[lang]/account/bookings/page.tsx` - User booking history
- `app/[lang]/account/host-bookings/page.tsx` - Host booking management

## Booking Flow

### 1. Property Viewing
- User views property on `/[lang]/stay/[slug]` page
- Selects check-in/check-out dates and number of guests
- Pricing is calculated dynamically based on selected dates

### 2. Booking Form
- User clicks "Reserve" button
- Redirected to `/[lang]/booking/[id]` page
- Fills in guest information and special requests
- Sees complete pricing breakdown

### 3. Booking Confirmation
- User submits booking form
- Redirected to `/[lang]/booking/confirm` page
- Booking is automatically created in database with "pending" status
- User sees confirmation or error message

### 4. Booking Management
- **Guests**: View bookings in `/[lang]/account/bookings`
- **Hosts**: Manage bookings in `/[lang]/account/host-bookings`
- Hosts can confirm or cancel pending bookings

## Security & Permissions

### Row Level Security (RLS)
- Users can only view their own bookings
- Hosts can view bookings for their properties
- Hosts can update booking status for their properties

### Booking Validation
- Check-in must be before check-out
- No overlapping bookings for confirmed/pending status
- User must be authenticated to create bookings

## Features

### Dynamic Pricing
- Calculates nights based on check-in/check-out dates
- Includes cleaning fee (€25) and service fee (€35)
- Updates in real-time as dates change

### Availability Checking
- Prevents double bookings
- Checks for overlapping dates
- Excludes cancelled bookings from availability checks

### Status Management
- Automatic status updates
- Email notifications (to be implemented)
- Booking history tracking

### Multi-language Support
- All booking pages support multiple languages
- Translation keys for booking-specific text
- Localized date formatting

## Future Enhancements

### Payment Integration
- Stripe payment processing
- Refund management
- Payment status tracking

### Email Notifications
- Booking confirmation emails
- Status change notifications
- Reminder emails

### Calendar Integration
- iCal export for hosts
- Google Calendar sync
- Availability calendar

### Review System
- Guest reviews after stay
- Host responses
- Rating calculations

## API Endpoints

### Create Booking
```typescript
await createBooking({
  houseId: 'uuid',
  checkIn: '2024-01-01',
  checkOut: '2024-01-03',
  guests: '2',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  specialRequests: 'Late check-in requested',
  totalPrice: 250.00
});
```

### Update Booking Status
```typescript
await updateBookingStatus('booking-uuid', 'confirmed');
```

### Get User Bookings
```typescript
const result = await getUserBookings('user-uuid');
```

### Get Host Bookings
```typescript
const result = await getHostBookings('host-uuid');
```

## Testing

### Manual Testing Steps
1. Navigate to a property page
2. Select dates and guests
3. Click "Reserve" button
4. Fill in booking form
5. Submit booking
6. Check confirmation page
7. Verify booking appears in user account
8. Login as host and manage booking

### Test Cases
- Valid date ranges
- Invalid date ranges (check-out before check-in)
- Overlapping bookings
- Unauthenticated users
- Permission boundaries
- Status updates
- Price calculations

## Error Handling

### Common Errors
- Authentication required
- Invalid dates
- Property not available
- Permission denied
- Database connection issues

### Error Messages
- User-friendly error messages
- Clear next steps
- Logging for debugging

## Performance Considerations

### Database Indexes
- `idx_bookings_house_id` - Filter by property
- `idx_bookings_user_id` - Filter by user
- `idx_bookings_status` - Filter by status
- `idx_bookings_dates` - Date range queries

### Caching
- Property data caching
- Booking status caching
- User session management

## Deployment

### Migration Steps
1. Run database migration
2. Update environment variables
3. Test booking flow
4. Monitor error logs
5. Set up monitoring alerts

### Monitoring
- Booking creation success rate
- Error rates by type
- Performance metrics
- User feedback collection
