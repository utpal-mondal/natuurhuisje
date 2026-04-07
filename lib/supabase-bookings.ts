import { createClient } from '@/utils/supabase/client';
import type { Booking, BookingFormData, CreateBookingData, BookingWithHouse, PaginatedBookingsResponse } from '@/types/booking';

export async function createBooking(bookingData: CreateBookingData) {
  const supabase = createClient();
  
  try {
    // First check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const bookingRecord: any = {
      house_id: bookingData.houseId,
      user_id: user.id,
      check_in: bookingData.checkIn,
      check_out: bookingData.checkOut,
      guests: parseInt(bookingData.guests),
      total_price: bookingData.totalPrice,
      first_name: bookingData.firstName,
      last_name: bookingData.lastName,
      email: bookingData.email,
      phone: bookingData.phone || null,
      special_requests: bookingData.specialRequests || null,
      status: 'pending'
    };

    // Add pricing details if provided
    if (bookingData.nights) bookingRecord.nights = bookingData.nights;
    if (bookingData.subtotal) bookingRecord.subtotal = bookingData.subtotal;
    if (bookingData.regularNights !== undefined) bookingRecord.regular_nights = bookingData.regularNights;
    if (bookingData.regularNightsTotal) bookingRecord.regular_nights_total = bookingData.regularNightsTotal;
    if (bookingData.specialNights !== undefined) bookingRecord.special_nights = bookingData.specialNights;
    if (bookingData.specialNightsTotal) bookingRecord.special_nights_total = bookingData.specialNightsTotal;
    if (bookingData.cleaningFee) bookingRecord.cleaning_fee = bookingData.cleaningFee;
    if (bookingData.serviceFee) bookingRecord.service_fee = bookingData.serviceFee;
    if (bookingData.priceBreakdown) bookingRecord.price_breakdown = bookingData.priceBreakdown;

    console.log('Creating booking with data:', bookingRecord);
    
    // Check for potential duplicate booking (same user, house, dates within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .eq('house_id', parseInt(bookingData.houseId.toString()))
      .eq('check_in', bookingData.checkIn)
      .eq('check_out', bookingData.checkOut)
      .gte('created_at', fiveMinutesAgo);
    
    if (existingBookings && existingBookings.length > 0) {
      console.log('Potential duplicate booking detected:', existingBookings);
      throw new Error('A booking for these dates already exists. Please check your bookings page.');
    }

    const { data, error } = await (supabase as any)
      .from('bookings')
      .insert(bookingRecord)
      .select()
      .single();

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from booking creation');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
    console.error('Error message:', errorMessage);
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

export async function testBookingsTable() {
  const supabase = createClient();
  
  try {
    // First try to query the bookings table directly
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Bookings table test error:', error);
      
      // Check for specific error patterns that indicate table doesn't exist
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      
      // Common Supabase/PostgreSQL error codes for missing relation/table
      if (errorMessage.includes('relation "bookings" does not exist') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('Could not find the table') ||
          errorMessage.includes('in the schema cache') ||
          errorCode === 'PGRST116' || // PostgreSQL relation does not exist
          errorCode === '42P01' || // PostgreSQL undefined_table
          errorMessage.includes('"bookings"') && errorMessage.includes('doesn\'t exist')) {
        
        const specificError = 'The bookings table does not exist in the database. Please run the database migration to create it.';
        console.error('Table does not exist error detected:', specificError);
        return { 
          success: false, 
          error: specificError, 
          tableExists: false,
          needsMigration: true
        };
      }
      
      // If error is empty or generic, it's likely the table doesn't exist
      if (!errorMessage || errorMessage === '{}' || Object.keys(error).length === 0) {
        console.log('Generic error detected - table likely doesn\'t exist');
        return {
          success: false,
          error: 'The bookings table does not exist in the database. Please run the database migration to create it.\n\nTo fix this:\n1. Go to your Supabase dashboard\n2. Navigate to SQL Editor\n3. Run the migration from DATABASE-MIGRATION.md\n4. Try booking again',
          tableExists: false,
          needsMigration: true
        };
      }
      
      // For other errors, return the original error message
      const fallbackError = error.message || 'Unknown database error';
      console.error('Other database error:', fallbackError);
      return { 
        success: false, 
        error: fallbackError, 
        tableExists: false,
        needsMigration: false
      };
    }
    
    console.log('Bookings table test successful:', data);
    return { success: true, tableExists: true, data };
  } catch (error) {
    console.error('Error testing bookings table:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test bookings table',
      tableExists: false,
      needsMigration: false
    };
  }
}


export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const supabase = createClient();
  
  try {
    const { data, error } = await (supabase as any)
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update booking status' 
    };
  }
}

export async function getUserBookings(userId?: string) {
  const supabase = createClient();
  
  try {
    let query = (supabase as any)
      .from('bookings')
      .select(`
        *,
        house:house_id (
          id,
          title:accommodation_name,
          location,
          house_images (
            image_url,
            sort_order
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Transform the data to match our interface
    const transformedData: BookingWithHouse[] = data?.map((booking: any) => {
      const house = booking.house || {};
      const houseImages = Array.isArray(house.house_images) ? house.house_images : [];

      return {
        ...booking,
        house: {
          ...house,
          id: house.id || booking.house_id,
          title: house.title || 'Unknown Property',
          location: house.location || 'Unknown location',
          images: houseImages
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((img: any) => img.image_url)
        }
      };
    }) || [];

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch bookings' 
    };
  }
}

export async function getHostBookings(hostId?: string, page: number = 1, itemsPerPage: number = 10): Promise<PaginatedBookingsResponse> {
  const supabase = createClient();
  
  try {
    const offset = (page - 1) * itemsPerPage;

    let countQuery = (supabase as any)
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    let dataQuery = (supabase as any)
      .from('bookings')
      .select(`
        *,
        house:house_id (
          id,
          title:accommodation_name,
          location,
          house_images (
            image_url,
            sort_order
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (hostId) {
      // First get all house IDs for this host
      const { data: hostHouses, error: housesError } = await supabase
        .from('houses')
        .select('id')
        .eq('host_id', hostId);

      if (housesError) throw housesError;

      if (!hostHouses || hostHouses.length === 0) {
        return { success: true, data: [], total: 0 };
      }

      const houseIds = hostHouses.map((h: any) => h.id);
      countQuery = countQuery.in('house_id', houseIds);
      dataQuery = dataQuery.in('house_id', houseIds);
    }

    // Get total count first
    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await dataQuery;

    if (error) throw error;
    
    // Transform the data to match our interface
    const transformedData: BookingWithHouse[] = data?.map((booking: any) => {
      const house = booking.house || {};
      const houseImages = Array.isArray(house.house_images) ? house.house_images : [];

      return {
        ...booking,
        house: {
          ...house,
          id: house.id || booking.house_id,
          title: house.title || 'Unknown Property',
          location: house.location || 'Unknown location',
          images: houseImages
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((img: any) => img.image_url)
        }
      };
    }) || [];

    return { success: true, data: transformedData, total: count || 0 };
  } catch (error) {
    console.error('Error fetching host bookings:', error);
    return { 
      success: false, 
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch host bookings' 
    };
  }
}

export async function checkBookingAvailability(
  houseId: string, 
  checkIn: string, 
  checkOut: string, 
  excludeBookingId?: string
) {
  const supabase = createClient();
  
  try {
    let query = (supabase as any)
      .from('bookings')
      .select('id, check_in, check_out, status')
      .eq('house_id', houseId)
      .in('status', ['pending', 'confirmed']);

    // Exclude current booking when editing
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Check for overlapping dates
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    const hasConflict = data?.some((booking: any) => {
      const existingCheckIn = new Date(booking.check_in);
      const existingCheckOut = new Date(booking.check_out);

      return (
        (newCheckIn >= existingCheckIn && newCheckIn < existingCheckOut) ||
        (newCheckOut > existingCheckIn && newCheckOut <= existingCheckOut) ||
        (newCheckIn <= existingCheckIn && newCheckOut >= existingCheckOut)
      );
    });

    return { success: true, available: !hasConflict };
  } catch (error) {
    console.error('Error checking booking availability:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check availability' 
    };
  }
}
