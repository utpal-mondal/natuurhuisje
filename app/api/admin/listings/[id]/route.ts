import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import type { ListingData } from '@/lib/supabase-listings';

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminData, error: adminError } = await (supabase as any)
    .from('admin_users')
    .select('auth_user_id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (adminError || !adminData || adminData.role !== 'admin') {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminCheck = await requireAdminUser();
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { id } = await params;
    const listingId = Number.parseInt(id, 10);
    if (Number.isNaN(listingId)) {
      return NextResponse.json({ success: false, error: 'Invalid listing ID' }, { status: 400 });
    }

    const body = await request.json();
    const data = body?.data as ListingData;

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: existingHouse, error: fetchError } = await (adminClient as any)
      .from('houses')
      .select('id')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingHouse) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    const { error: houseError } = await (adminClient as any)
      .from('houses')
      .update({
        accommodation_name: data.accommodationName || '',
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
        price_per_night: Number.parseFloat(data.pricePerNight),
        safety_deposit: data.safetyDeposit === 'deposit_required' ? 'deposit_required' : 'no_deposit',
        safety_deposit_amount: data.safetyDepositAmount ? Number.parseFloat(data.safetyDepositAmount) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (houseError) {
      throw new Error(`Failed to update house: ${houseError.message}`);
    }

    await (adminClient as any).from('house_images').delete().eq('house_id', listingId);
    if (Array.isArray(data.images) && data.images.length > 0) {
      const { error: imagesError } = await (adminClient as any)
        .from('house_images')
        .insert(
          data.images.map((url, index) => ({
            house_id: listingId,
            image_url: url,
            sort_order: index,
          })),
        );

      if (imagesError) {
        throw new Error(`Failed to update images: ${imagesError.message}`);
      }
    }

    await (adminClient as any).from('person_pricing').delete().eq('house_id', listingId);
    const { error: personPricingError } = await (adminClient as any)
      .from('person_pricing')
      .insert({
        house_id: listingId,
        base_persons: data.personPricing?.basePersons ?? 0,
        additional_person_price: data.personPricing?.additionalPersonPrice
          ? Number.parseFloat(data.personPricing.additionalPersonPrice)
          : null,
        created_at: new Date().toISOString(),
      });

    if (personPricingError) {
      throw new Error(`Failed to update person pricing: ${personPricingError.message}`);
    }

    await (adminClient as any).from('house_amenities').delete().eq('house_id', listingId);
    if (Array.isArray(data.amenities) && data.amenities.length > 0) {
      const { error: amenitiesError } = await (adminClient as any)
        .from('house_amenities')
        .insert(
          data.amenities.map((amenity) => ({
            house_id: listingId,
            amenity_name: amenity,
            created_at: new Date().toISOString(),
          })),
        );

      if (amenitiesError) {
        throw new Error(`Failed to update amenities: ${amenitiesError.message}`);
      }
    }

    await (adminClient as any).from('sustainability_features').delete().eq('house_id', listingId);
    const sustainabilityEntries = Object.entries(data.sustainability || {}).filter(([, value]) => {
      return value && value !== '' && value !== 'undefined' && value !== 'null';
    });

    if (sustainabilityEntries.length > 0) {
      const { error: sustainabilityError } = await (adminClient as any)
        .from('sustainability_features')
        .insert(
          sustainabilityEntries.map(([feature, value]) => ({
            house_id: listingId,
            feature_key: feature,
            feature_value: value,
            created_at: new Date().toISOString(),
          })),
        );

      if (sustainabilityError) {
        throw new Error(`Failed to update sustainability: ${sustainabilityError.message}`);
      }
    }

    await (adminClient as any).from('house_rules').delete().eq('house_id', listingId);
    const rulesData = [
      { house_id: listingId, rule_type: 'babies_allowed', rule_value: String(data.houseRules?.babies ?? 0), created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'pets_allowed', rule_value: String(data.houseRules?.pets ?? 0), created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'child_age_limit', rule_value: String(data.houseRules?.childAge ?? 0), created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'min_booking_age', rule_value: String(data.houseRules?.bookingAge ?? 18), created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'parties_allowed', rule_value: data.houseRules?.parties?.toString() || null, created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'smoking_allowed', rule_value: data.houseRules?.smoking?.toString() || null, created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'fireworks_allowed', rule_value: data.houseRules?.fireworks?.toString() || null, created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'groups_allowed', rule_value: data.houseRules?.groups?.toString() || null, created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'waste_separation_required', rule_value: data.houseRules?.waste?.toString() || null, created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'silence_hours_start', rule_value: data.houseRules?.silenceStart || null, created_at: new Date().toISOString() },
      { house_id: listingId, rule_type: 'silence_hours_end', rule_value: data.houseRules?.silenceEnd || null, created_at: new Date().toISOString() },
      ...((data.houseRules?.customRules || []).map((rule) => ({
        house_id: listingId,
        rule_type: 'custom_rule',
        rule_value: rule,
        created_at: new Date().toISOString(),
      }))),
    ];

    const { error: rulesError } = await (adminClient as any).from('house_rules').insert(rulesData);
    if (rulesError) {
      throw new Error(`Failed to update house rules: ${rulesError.message}`);
    }

    await (adminClient as any).from('extra_costs').delete().eq('house_id', listingId);
    if (Array.isArray(data.extraCosts) && data.extraCosts.length > 0) {
      const { error: extraCostsError } = await (adminClient as any)
        .from('extra_costs')
        .insert(
          data.extraCosts.map((cost) => ({
            house_id: listingId,
            cost_name: cost,
            amount: 0,
            required: false,
            created_at: new Date().toISOString(),
          })),
        );

      if (extraCostsError) {
        throw new Error(`Failed to update extra costs: ${extraCostsError.message}`);
      }
    }

    await (adminClient as any).from('arrival_departure_days').delete().eq('house_id', listingId);
    const arrivalDepartureDays = [
      ...((data.arrivalDays || []).map((day) => ({
        house_id: listingId,
        day_name: day,
        day_type: 'arrival',
        created_at: new Date().toISOString(),
      }))),
      ...((data.departureDays || []).map((day) => ({
        house_id: listingId,
        day_name: day,
        day_type: 'departure',
        created_at: new Date().toISOString(),
      }))),
    ];

    if (arrivalDepartureDays.length > 0) {
      const { error: daysError } = await (adminClient as any)
        .from('arrival_departure_days')
        .insert(arrivalDepartureDays);

      if (daysError) {
        throw new Error(`Failed to update arrival/departure days: ${daysError.message}`);
      }
    }

    await (adminClient as any).from('availability_settings').delete().eq('house_id', listingId);
    const { error: availabilityError } = await (adminClient as any)
      .from('availability_settings')
      .insert({
        house_id: listingId,
        check_in_from: data.checkInFrom || '15:00',
        check_in_until: data.checkInUntil || '22:00',
        check_out_from: data.checkOutFrom || '07:00',
        check_out_until: data.checkOutUntil || '11:00',
        min_booking_days: data.minBookingDays || 0,
        created_at: new Date().toISOString(),
      });

    if (availabilityError) {
      throw new Error(`Failed to update availability settings: ${availabilityError.message}`);
    }

    return NextResponse.json({ success: true, message: 'Listing updated successfully!' });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/listings/[id]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update listing' },
      { status: 500 },
    );
  }
}
