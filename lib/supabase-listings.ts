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
        max_nights: 364,
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
    const sustainabilityEntries = Object.entries(data.sustainability).filter(([_, value]) => value);
    if (sustainabilityEntries.length > 0) {
      const { error: sustainabilityError } = await supabase
        .from('sustainability_features')
        .insert(
          sustainabilityEntries.map(([feature, value]) => ({
            house_id: houseId,
            feature_key: feature,
            feature_value: value,
            created_at: new Date().toISOString()
          })) as any
        );

      if (sustainabilityError) {
        console.error('Error saving sustainability:', sustainabilityError);
        throw new Error(`Failed to save sustainability: ${sustainabilityError.message}`);
      }
    }

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

    // First, verify the user owns this listing
    const { data: existingHouse, error: fetchError } = await (supabase as any)
      .from('houses')
      .select('id, host_id')
      .eq('id', numericListingId)
      .single();

    if (fetchError || !existingHouse) {
      throw new Error('Listing not found');
    }

    if (existingHouse.host_id !== userId) {
      throw new Error('You do not have permission to update this listing');
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
    await (supabase as any).from('sustainability_features').delete().eq('house_id', numericListingId);
    const sustainabilityEntries = Object.entries(data.sustainability).filter(([_, value]) => value);
    if (sustainabilityEntries.length > 0) {
      const { error: sustainabilityError } = await (supabase as any)
        .from('sustainability_features')
        .insert(
          sustainabilityEntries.map(([feature, value]) => ({
            house_id: numericListingId,
            feature_key: feature,
            feature_value: value,
            created_at: new Date().toISOString()
          }))
        );

      if (sustainabilityError) {
        console.error('Error updating sustainability:', sustainabilityError);
        throw new Error(`Failed to update sustainability: ${sustainabilityError.message}`);
      }
    }

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
