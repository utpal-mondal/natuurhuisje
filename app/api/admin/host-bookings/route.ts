import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: roleData, error: roleError } = await (supabase as any)
    .from('user_roles')
    .select('role_name')
    .eq('user_id', user.id)
    .single();

  if (roleError || roleData?.role_name !== 'admin') {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const itemsPerPage = Math.max(parseInt(searchParams.get('itemsPerPage') || '10', 10), 1);
    const offset = (page - 1) * itemsPerPage;

    const adminCheck = await requireAdminUser();
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const adminClient = createAdminClient();

    const { count, error: countError } = await (adminClient as any)
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    const { data, error } = await (adminClient as any)
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

    if (error) {
      throw error;
    }

    const transformedData = (data || []).map((booking: any) => {
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
            .map((img: any) => img.image_url),
        },
      };
    });

    return NextResponse.json({ success: true, data: transformedData, total: count || 0 });
  } catch (error: any) {
    console.error('Error in GET /api/admin/host-bookings:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch host bookings' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const body = await request.json();
    const { bookingId, status } = body || {};

    if (!bookingId || !status) {
      return NextResponse.json(
        { success: false, error: 'bookingId and status are required' },
        { status: 400 },
      );
    }

    if (!['confirmed', 'cancelled', 'completed', 'pending'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const { data, error } = await (adminClient as any)
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/host-bookings:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update booking status' },
      { status: 500 },
    );
  }
}
