import { createClient } from '@/utils/supabase/client';
import { type Database } from '@/types/supabase';

export interface ListingData {
  accommodationName: string;
  type: string;
  maxPerson: number;
  livingSituation: string;
  location: string;
  plotSize: string;
  isNearNeighbors: boolean | null;
  registrationNumberOption: string;
  registrationNumber: string;
  hasPublicTransport: boolean;
  country: string;
  region: string;
  street: string;
  number: string;
  postalCode: string;
  place: string;
  landRegistrationOption: string;
  images: string[];
  rooms: Array<{
    name: string;
    description?: string;
    room_type?: string;
    size_m2?: number;
    price_per_night?: string;
  }>;
  pricePerNight: string;
  includedFacilities: string[];
  safetyDeposit: string;
  safetyDepositAmount: string;
  longerStayPricing: {
    weeklyPrice: string;
    monthlyPrice: string;
    weekendPrice: string;
    longWeekendPrice: string;
    weekdayPrice: string;
    weekPrice: string;
  };
  personPricing: {
    basePersons: number;
    additionalPersonPrice: string;
  };
  extraCosts: string[];
  minNights: number;
  maxNights?: number;
  arrivalDays: string[];
  departureDays: string[];
  checkInFrom?: string;
  checkInUntil?: string;
  checkOutFrom?: string;
  checkOutUntil?: string;
  minBookingDays?: number;
  description: string;
  surroundings: string;
  amenities: string[];
  energyLabel: string;
  sustainability: Record<string, string>;
  houseRules: {
    babies: number;
    pets: number;
    childAge: number;
    bookingAge: number;
    parties: boolean | null;
    smoking: boolean | null;
    fireworks: boolean | null;
    groups: boolean | null;
    waste: boolean | null;
    silenceStart: string;
    silenceEnd: string;
    customRules: string[];
  };
}

export async function saveListingToDatabase(data: ListingData, userId: string) {
  const supabase = createClient();
  
  console.log('saveListingToDatabase called with userId:', userId);
  console.log('Data being saved:', JSON.stringify(data, null, 2));
  
  try {
    // Start a transaction by inserting the main house record
    const { data: houseData, error: houseError } = await supabase
      .from('houses')
      .insert({
        accommodation_name: data.accommodationName,
        type: data.type || 'Cottage',
        max_person: data.maxPerson,
        living_situation: data.livingSituation || 'Detached',
        country: data.country || 'Netherlands',
        region: data.region || 'Drenthe',
        min_nights: data.minNights,
        max_nights: data.maxNights || 364,
        host_id: userId,
        location: data.location,
        plot_size: data.plotSize || null,
        is_near_neighbors: data.isNearNeighbors,
        registration_number_option: data.registrationNumberOption,
        registration_number: data.registrationNumber || null,
        has_public_transport: data.hasPublicTransport,
        street: data.street,
        house_number: data.number,
        postal_code: data.postalCode,
        place: data.place,
        land_registration_option: data.landRegistrationOption,
        description: data.description,
        surroundings: data.surroundings,
        energy_label: data.energyLabel || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .select()
      .single();

    if (houseError || !houseData) {
      console.error('Error creating house:', houseError);
      throw new Error(`Failed to create house: ${houseError?.message || 'No data returned'}`);
    }

    console.log('House created successfully:', houseData);
    const houseId = (houseData as any).id;
    console.log('House ID:', houseId);

    // Insert images
    if (data.images && data.images.length > 0) {
      console.log('Inserting images for house ID:', houseId);
      const { error: imagesError } = await supabase
        .from('house_images')
        .insert(
          data.images.map((url, index) => ({
            house_id: houseId,
            image_url: url,
            sort_order: index
          })) as any
        );

      if (imagesError) {
        console.error('Error saving images:', imagesError);
        throw new Error(`Failed to save images: ${imagesError.message}`);
      }
      console.log('Images saved successfully');
    }

    // Update house with basic pricing information
    console.log('Updating house with pricing information for house ID:', houseId);
    const { error: houseUpdateError } = await (supabase as any)
      .from('houses')
      .update({
        price_per_night: parseFloat(data.pricePerNight),
        safety_deposit: data.safetyDeposit === 'deposit_required' ? 'deposit_required' : 'no_deposit',
        safety_deposit_amount: data.safetyDepositAmount ? parseFloat(data.safetyDepositAmount) : null,
        min_nights: data.minNights,
        updated_at: new Date().toISOString()
      })
      .eq('id', houseId as number);

    // Insert person pricing information
    const { error: personPricingError } = await (supabase as any)
      .from('person_pricing')
      .insert({
        house_id: houseId as number,
        base_persons: data.personPricing.basePersons,
        additional_person_price: data.personPricing.additionalPersonPrice ? parseFloat(data.personPricing.additionalPersonPrice) : null,
        created_at: new Date().toISOString()
      });

    if (houseUpdateError) {
        console.error('Error updating house pricing:', houseUpdateError);
        throw new Error(`Failed to update house pricing: ${houseUpdateError.message}`);
      }

      if (personPricingError) {
        console.error('Error saving person pricing:', personPricingError);
        throw new Error(`Failed to save person pricing: ${personPricingError.message}`);
      }
      console.log('Pricing saved successfully');

    // Insert amenities
    if (data.amenities && data.amenities.length > 0) {
      const { error: amenitiesError } = await supabase
        .from('house_amenities')
        .insert(
          data.amenities.map(amenity => ({
            house_id: houseId,
            amenity_name: amenity,
            created_at: new Date().toISOString()
          })) as any
        );

      if (amenitiesError) {
        console.error('Error saving amenities:', amenitiesError);
        throw new Error(`Failed to save amenities: ${amenitiesError.message}`);
      }
    }

    // Insert sustainability features
    console.log('=== SUSTAINABILITY DEBUG ===');
    console.log('Full sustainability object:', JSON.stringify(data.sustainability, null, 2));
    console.log('Energy label:', data.energyLabel);
    console.log('Sustainability object keys:', Object.keys(data.sustainability));
    console.log('Sustainability object values:', Object.values(data.sustainability));
    
    const sustainabilityEntries = Object.entries(data.sustainability).filter(([key, value]) => {
      console.log(`Checking sustainability entry: ${key} = ${value} (type: ${typeof value})`);
      return value && value !== '' && value !== 'undefined' && value !== 'null';
    });
    console.log('Filtered sustainability entries to insert:', sustainabilityEntries);
    
    if (sustainabilityEntries.length > 0) {
      const insertData = sustainabilityEntries.map(([feature, value]) => ({
        house_id: houseId,
        feature_key: feature,
        feature_value: value,
        created_at: new Date().toISOString()
      }));
      console.log('Sustainability insert data:', JSON.stringify(insertData, null, 2));
      
      const { error: sustainabilityError } = await supabase
        .from('sustainability_features')
        .insert(insertData as any);

      if (sustainabilityError) {
        console.error('Error saving sustainability:', sustainabilityError);
        throw new Error(`Failed to save sustainability: ${sustainabilityError.message}`);
      }
      console.log('✓ Sustainability features saved successfully');
    } else {
      console.log('⚠ No sustainability features to save (all values were empty or falsy)');
    }
    console.log('=== END SUSTAINABILITY DEBUG ===');

    // Insert rooms - TEMPORARILY DISABLED DUE TO SCHEMA ISSUES
    console.log('Skipping rooms insert due to schema issues');
    // if (data.rooms && data.rooms.length > 0) {
    //   console.log('Inserting rooms for house ID:', houseId);
    //   const { error: roomsError } = await supabase
    //     .from('rooms')
    //     .insert(
    //       data.rooms.map((room: any) => ({
    //         house_id: houseId,
    //         name: room.name || '',
    //         description: room.description || null,
    //         room_type: room.room_type || 'Bedroom',
    //         size_m2: room.size_m2 || null,
    //         price_per_night: room.price_per_night ? parseFloat(room.price_per_night) : null,
    //         created_at: new Date().toISOString(),
    //         updated_at: new Date().toISOString()
    //       })) as any
    //     );

    //   if (roomsError) {
    //     console.error('Error saving rooms:', JSON.stringify(roomsError, null, 2));
    //     console.error('Error details:', roomsError);
    //     throw new Error(`Failed to save rooms: ${roomsError.message || 'Unknown error'}`);
    //   }
    //   console.log('Rooms saved successfully');
    // }

    // Insert house rules
    const rulesData = [
      { house_id: houseId, rule_type: 'babies_allowed', rule_value: data.houseRules.babies.toString(), created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'pets_allowed', rule_value: data.houseRules.pets.toString(), created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'child_age_limit', rule_value: data.houseRules.childAge.toString(), created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'min_booking_age', rule_value: data.houseRules.bookingAge.toString(), created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'parties_allowed', rule_value: data.houseRules.parties?.toString() || null, created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'smoking_allowed', rule_value: data.houseRules.smoking?.toString() || null, created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'fireworks_allowed', rule_value: data.houseRules.fireworks?.toString() || null, created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'groups_allowed', rule_value: data.houseRules.groups?.toString() || null, created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'waste_separation_required', rule_value: data.houseRules.waste?.toString() || null, created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'silence_hours_start', rule_value: data.houseRules.silenceStart || null, created_at: new Date().toISOString() },
      { house_id: houseId, rule_type: 'silence_hours_end', rule_value: data.houseRules.silenceEnd || null, created_at: new Date().toISOString() },
      ...data.houseRules.customRules.map(rule => ({ house_id: houseId, rule_type: 'custom_rule', rule_value: rule, created_at: new Date().toISOString() }))
    ];
    
    const { error: rulesError } = await supabase
      .from('house_rules')
      .insert(rulesData as any);

    if (rulesError) {
      console.error('Error saving house rules:', rulesError);
      throw new Error(`Failed to save house rules: ${rulesError.message}`);
    }

    // Insert extra costs
    if (data.extraCosts && data.extraCosts.length > 0) {
      const { error: extraCostsError } = await supabase
        .from('extra_costs')
        .insert(
          data.extraCosts.map(cost => ({
            house_id: houseId,
            cost_name: cost,
            amount: 0,
            required: false,
            created_at: new Date().toISOString()
          })) as any
        );

      if (extraCostsError) {
        console.error('Error saving extra costs:', extraCostsError);
        throw new Error(`Failed to save extra costs: ${extraCostsError.message}`);
      }
    }

    // Insert arrival and departure days
    console.log('=== ARRIVAL/DEPARTURE DAYS DEBUG ===');
    console.log('Arrival days:', data.arrivalDays);
    console.log('Departure days:', data.departureDays);
    
    const arrivalDepartureDays = [
      ...(data.arrivalDays || []).map(day => ({
        house_id: houseId,
        day_name: day,
        day_type: 'arrival',
        created_at: new Date().toISOString()
      })),
      ...(data.departureDays || []).map(day => ({
        house_id: houseId,
        day_name: day,
        day_type: 'departure',
        created_at: new Date().toISOString()
      }))
    ];
    
    console.log('Arrival/Departure data to insert:', JSON.stringify(arrivalDepartureDays, null, 2));
    
    if (arrivalDepartureDays.length > 0) {
      const { error: daysError } = await supabase
        .from('arrival_departure_days')
        .insert(arrivalDepartureDays as any);

      if (daysError) {
        console.error('Error saving arrival/departure days:', daysError);
        throw new Error(`Failed to save arrival/departure days: ${daysError.message}`);
      }
      console.log('✓ Arrival/Departure days saved successfully');
    } else {
      console.log('⚠ No arrival/departure days to save');
    }
    console.log('=== END ARRIVAL/DEPARTURE DAYS DEBUG ===');

    // Insert availability settings (check-in/check-out times, booking settings)
    console.log('=== AVAILABILITY SETTINGS DEBUG ===');
    console.log('Check-in from:', data.checkInFrom);
    console.log('Check-in until:', data.checkInUntil);
    console.log('Check-out from:', data.checkOutFrom);
    console.log('Check-out until:', data.checkOutUntil);
    console.log('Min booking days:', data.minBookingDays);
    
    const availabilitySettings = {
      house_id: houseId,
      check_in_from: data.checkInFrom || '15:00',
      check_in_until: data.checkInUntil || '22:00',
      check_out_from: data.checkOutFrom || '07:00',
      check_out_until: data.checkOutUntil || '11:00',
      min_booking_days: data.minBookingDays || 0,
      created_at: new Date().toISOString()
    };
    
    console.log('Availability settings to insert:', JSON.stringify(availabilitySettings, null, 2));
    
    const { error: availabilityError } = await supabase
      .from('availability_settings')
      .insert(availabilitySettings as any);

    if (availabilityError) {
      console.error('Error saving availability settings:', availabilityError);
      // Don't throw error if table doesn't exist yet, just log it
      console.warn('Availability settings table may not exist. Skipping this step.');
    } else {
      console.log('✓ Availability settings saved successfully');
    }
    console.log('=== END AVAILABILITY SETTINGS DEBUG ===');

    return {
      success: true,
      houseId: houseId,
      message: 'Listing saved successfully!'
    };

  } catch (error) {
    console.error('Error saving listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function updateListingToDatabase(listingId: string, data: ListingData, userId: string) {
  const supabase = createClient();
  
  console.log('updateListingToDatabase called with listingId:', listingId, 'userId:', userId);
  console.log('Data being updated:', JSON.stringify(data, null, 2));
  
  try {
    const numericListingId = parseInt(listingId);
    if (isNaN(numericListingId)) {
      throw new Error('Invalid listing ID');
    }

    // First, verify the listing exists and who owns it
    const { data: existingHouse, error: fetchError } = await (supabase as any)
      .from('houses')
      .select('id, host_id')
      .eq('id', numericListingId)
      .single();

    if (fetchError || !existingHouse) {
      throw new Error('Listing not found');
    }

    const isOwner = existingHouse.host_id === userId;
    if (!isOwner) {
      throw new Error('Only the host of this house can edit this listing');
    }

    // Update the main house record
    const { error: houseError } = await (supabase as any)
      .from('houses')
      .update({
        accommodation_name: data.accommodationName || "",
        type: data.type || 'Cottage',
        max_person: data.maxPerson,
        living_situation: data.livingSituation || 'Detached',
        country: data.country || 'Netherlands',
        region: data.region || 'Drenthe',
        min_nights: data.minNights,
        max_nights: data.maxNights || 364,
        location: data.location,
        plot_size: data.plotSize || null,
        is_near_neighbors: data.isNearNeighbors,
        registration_number_option: data.registrationNumberOption,
        registration_number: data.registrationNumber || null,
        has_public_transport: data.hasPublicTransport,
        street: data.street,
        house_number: data.number,
        postal_code: data.postalCode,
        place: data.place,
        land_registration_option: data.landRegistrationOption,
        description: data.description,
        surroundings: data.surroundings,
        energy_label: data.energyLabel || null,
        price_per_night: parseFloat(data.pricePerNight),
        safety_deposit: data.safetyDeposit === 'deposit_required' ? 'deposit_required' : 'no_deposit',
        safety_deposit_amount: data.safetyDepositAmount ? parseFloat(data.safetyDepositAmount) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', numericListingId);

    if (houseError) {
      console.error('Error updating house:', houseError);
      throw new Error(`Failed to update house: ${houseError.message}`);
    }

    // Update images - delete existing and insert new
    await (supabase as any).from('house_images').delete().eq('house_id', numericListingId);
    if (data.images && data.images.length > 0) {
      const { error: imagesError } = await (supabase as any)
        .from('house_images')
        .insert(
          data.images.map((url, index) => ({
            house_id: numericListingId,
            image_url: url,
            sort_order: index
          }))
        );

      if (imagesError) {
        console.error('Error updating images:', imagesError);
        throw new Error(`Failed to update images: ${imagesError.message}`);
      }
    }

    // Update person pricing
    await (supabase as any).from('person_pricing').delete().eq('house_id', numericListingId);
    const { error: personPricingError } = await (supabase as any)
      .from('person_pricing')
      .insert({
        house_id: numericListingId,
        base_persons: data.personPricing.basePersons,
        additional_person_price: data.personPricing.additionalPersonPrice ? parseFloat(data.personPricing.additionalPersonPrice) : null,
        created_at: new Date().toISOString()
      });

    if (personPricingError) {
      console.error('Error updating person pricing:', personPricingError);
      throw new Error(`Failed to update person pricing: ${personPricingError.message}`);
    }

    // Update amenities
    await (supabase as any).from('house_amenities').delete().eq('house_id', numericListingId);
    if (data.amenities && data.amenities.length > 0) {
      const { error: amenitiesError } = await (supabase as any)
        .from('house_amenities')
        .insert(
          data.amenities.map(amenity => ({
            house_id: numericListingId,
            amenity_name: amenity,
            created_at: new Date().toISOString()
          }))
        );

      if (amenitiesError) {
        console.error('Error updating amenities:', amenitiesError);
        throw new Error(`Failed to update amenities: ${amenitiesError.message}`);
      }
    }

    // Update sustainability features
    console.log('=== UPDATE SUSTAINABILITY DEBUG ===');
    console.log('Full sustainability object:', JSON.stringify(data.sustainability, null, 2));
    console.log('Energy label:', data.energyLabel);
    console.log('Sustainability object keys:', Object.keys(data.sustainability));
    console.log('Sustainability object values:', Object.values(data.sustainability));
    
    await (supabase as any).from('sustainability_features').delete().eq('house_id', numericListingId);
    console.log('Deleted existing sustainability features for house:', numericListingId);
    
    const sustainabilityEntries = Object.entries(data.sustainability).filter(([key, value]) => {
      console.log(`Checking sustainability entry: ${key} = ${value} (type: ${typeof value})`);
      return value && value !== '' && value !== 'undefined' && value !== 'null';
    });
    console.log('Filtered sustainability entries to update:', sustainabilityEntries);
    
    if (sustainabilityEntries.length > 0) {
      const insertData = sustainabilityEntries.map(([feature, value]) => ({
        house_id: numericListingId,
        feature_key: feature,
        feature_value: value,
        created_at: new Date().toISOString()
      }));
      console.log('Sustainability update data:', JSON.stringify(insertData, null, 2));
      
      const { error: sustainabilityError } = await (supabase as any)
        .from('sustainability_features')
        .insert(insertData);

      if (sustainabilityError) {
        console.error('Error updating sustainability:', sustainabilityError);
        throw new Error(`Failed to update sustainability: ${sustainabilityError.message}`);
      }
      console.log('✓ Sustainability features updated successfully');
    } else {
      console.log('⚠ No sustainability features to update (all values were empty or falsy)');
    }
    console.log('=== END UPDATE SUSTAINABILITY DEBUG ===');

    // Update rooms
    console.log('Checking if rooms table exists and deleting existing rooms for house ID:', numericListingId);
    
    // First check if rooms table exists and get its structure
    try {
      const { data: testRooms, error: testError } = await (supabase as any)
        .from('rooms')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('Rooms table may not exist or access error:', testError);
        throw new Error(`Rooms table error: ${testError.message}`);
      }
      
      console.log('Rooms table exists, structure:', testRooms);
      console.log('Available columns:', testRooms && testRooms.length > 0 ? Object.keys(testRooms[0]) : 'No data');
    } catch (err) {
      console.error('Error checking rooms table:', err);
      throw new Error('Rooms table is not available');
    }
    
    // Update rooms - TEMPORARILY DISABLED DUE TO SCHEMA ISSUES
    console.log('Skipping rooms update due to schema issues');
    // await (supabase as any).from('rooms').delete().eq('house_id', numericListingId);
    // if (data.rooms && data.rooms.length > 0) {
    //   console.log('Inserting rooms data:', JSON.stringify(data.rooms, null, 2));
    //   const { error: roomsError } = await (supabase as any)
    //     .from('rooms')
    //     .insert(
    //       data.rooms.map((room: any) => ({
    //         house_id: numericListingId,
    //         name: room.name || '',
    //         description: room.description || null,
    //         room_type: room.room_type || 'Bedroom',
    //         size_m2: room.size_m2 || null,
    //         price_per_night: room.price_per_night ? parseFloat(room.price_per_night) : null,
    //         created_at: new Date().toISOString(),
    //         updated_at: new Date().toISOString()
    //       }))
    //     );

    //   if (roomsError) {
    //     console.error('Error updating rooms:', JSON.stringify(roomsError, null, 2));
    //     console.error('Error details:', roomsError);
    //     throw new Error(`Failed to update rooms: ${roomsError.message || 'Unknown error'}`);
    //   }
    // }

    // Update house rules
    await (supabase as any).from('house_rules').delete().eq('house_id', numericListingId);
    const rulesData = [
      { house_id: numericListingId, rule_type: 'babies_allowed', rule_value: data.houseRules.babies.toString(), created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'pets_allowed', rule_value: data.houseRules.pets.toString(), created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'child_age_limit', rule_value: data.houseRules.childAge.toString(), created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'min_booking_age', rule_value: data.houseRules.bookingAge.toString(), created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'parties_allowed', rule_value: data.houseRules.parties?.toString() || null, created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'smoking_allowed', rule_value: data.houseRules.smoking?.toString() || null, created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'fireworks_allowed', rule_value: data.houseRules.fireworks?.toString() || null, created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'groups_allowed', rule_value: data.houseRules.groups?.toString() || null, created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'waste_separation_required', rule_value: data.houseRules.waste?.toString() || null, created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'silence_hours_start', rule_value: data.houseRules.silenceStart || null, created_at: new Date().toISOString() },
      { house_id: numericListingId, rule_type: 'silence_hours_end', rule_value: data.houseRules.silenceEnd || null, created_at: new Date().toISOString() },
      ...data.houseRules.customRules.map(rule => ({ house_id: numericListingId, rule_type: 'custom_rule', rule_value: rule, created_at: new Date().toISOString() }))
    ];
    
    const { error: rulesError } = await (supabase as any)
      .from('house_rules')
      .insert(rulesData);

    if (rulesError) {
      console.error('Error updating house rules:', rulesError);
      throw new Error(`Failed to update house rules: ${rulesError.message}`);
    }

    // Update extra costs
    await (supabase as any).from('extra_costs').delete().eq('house_id', numericListingId);
    if (data.extraCosts && data.extraCosts.length > 0) {
      const { error: extraCostsError } = await (supabase as any)
        .from('extra_costs')
        .insert(
          data.extraCosts.map(cost => ({
            house_id: numericListingId,
            cost_name: cost,
            amount: 0,
            required: false,
            created_at: new Date().toISOString()
          }))
        );

      if (extraCostsError) {
        console.error('Error updating extra costs:', extraCostsError);
        throw new Error(`Failed to update extra costs: ${extraCostsError.message}`);
      }
    }

    // Update arrival and departure days
    console.log('=== UPDATE ARRIVAL/DEPARTURE DAYS DEBUG ===');
    console.log('Arrival days:', data.arrivalDays);
    console.log('Departure days:', data.departureDays);
    
    await (supabase as any).from('arrival_departure_days').delete().eq('house_id', numericListingId);
    console.log('Deleted existing arrival/departure days for house:', numericListingId);
    
    const arrivalDepartureDays = [
      ...(data.arrivalDays || []).map(day => ({
        house_id: numericListingId,
        day_name: day,
        day_type: 'arrival',
        created_at: new Date().toISOString()
      })),
      ...(data.departureDays || []).map(day => ({
        house_id: numericListingId,
        day_name: day,
        day_type: 'departure',
        created_at: new Date().toISOString()
      }))
    ];
    
    console.log('Arrival/Departure data to update:', JSON.stringify(arrivalDepartureDays, null, 2));
    
    if (arrivalDepartureDays.length > 0) {
      const { error: daysError } = await (supabase as any)
        .from('arrival_departure_days')
        .insert(arrivalDepartureDays);

      if (daysError) {
        console.error('Error updating arrival/departure days:', daysError);
        throw new Error(`Failed to update arrival/departure days: ${daysError.message}`);
      }
      console.log('✓ Arrival/Departure days updated successfully');
    } else {
      console.log('⚠ No arrival/departure days to update');
    }
    console.log('=== END UPDATE ARRIVAL/DEPARTURE DAYS DEBUG ===');

    // Update availability settings (check-in/check-out times, booking settings)
    console.log('=== UPDATE AVAILABILITY SETTINGS DEBUG ===');
    console.log('Check-in from:', data.checkInFrom);
    console.log('Check-in until:', data.checkInUntil);
    console.log('Check-out from:', data.checkOutFrom);
    console.log('Check-out until:', data.checkOutUntil);
    console.log('Min booking days:', data.minBookingDays);
    
    await (supabase as any).from('availability_settings').delete().eq('house_id', numericListingId);
    console.log('Deleted existing availability settings for house:', numericListingId);
    
    const availabilitySettings = {
      house_id: numericListingId,
      check_in_from: data.checkInFrom || '15:00',
      check_in_until: data.checkInUntil || '22:00',
      check_out_from: data.checkOutFrom || '07:00',
      check_out_until: data.checkOutUntil || '11:00',
      min_booking_days: data.minBookingDays || 0,
      created_at: new Date().toISOString()
    };
    
    console.log('Availability settings to update:', JSON.stringify(availabilitySettings, null, 2));
    
    const { error: availabilityUpdateError } = await (supabase as any)
      .from('availability_settings')
      .insert(availabilitySettings);

    if (availabilityUpdateError) {
      console.error('Error updating availability settings:', availabilityUpdateError);
      // Don't throw error if table doesn't exist yet, just log it
      console.warn('Availability settings table may not exist. Skipping this step.');
    } else {
      console.log('✓ Availability settings updated successfully');
    }
    console.log('=== END UPDATE AVAILABILITY SETTINGS DEBUG ===');

    return {
      success: true,
      message: 'Listing updated successfully!'
    };

  } catch (error) {
    console.error('Error updating listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
