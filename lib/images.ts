import { createClient } from '@/utils/supabase/client';
import { createAdminClient } from '@/utils/supabase/admin';
import { RoomImage } from '@/types/rooms';
import { canEditHouse } from '@/lib/roles';

// Server-side image upload that bypasses RLS with proper permission checks
export async function uploadRoomImageSecure(
  roomId: number,
  imageUrl: string,
  imageType: string = 'general',
  sortOrder: number = 0
): Promise<{ data: RoomImage | null; error: any }> {
  const supabase = createClient();
  
  try {
    // Step 1: Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    // Step 2: Get room details to check ownership
    const untypedClient = supabase as any;
    const { data: room, error: roomError } = await untypedClient
      .from('rooms')
      .select('house_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return { data: null, error: { message: 'Room not found' } };
    }

    // Step 3: Check if user can edit the house
    const canEdit = await canEditHouse(user.id, room.house_id);
    if (!canEdit) {
      return { data: null, error: { message: 'You do not have permission to upload images to this room' } };
    }

    // Step 4: Use admin client to bypass RLS since we've verified permissions
    const adminClient = createAdminClient();
    
    const insertData = {
      room_id: roomId,
      image_url: imageUrl,
      sort_order: sortOrder,
      image_type: imageType,
    };

    const { data, error } = await adminClient
      .from('room_images')
      .insert(insertData)
      .select()
      .single();

    return { data: data as RoomImage, error };
  } catch (error) {
    console.error('Secure image upload failed:', error);
    return { data: null, error };
  }
}

// Fallback function that tries regular client first, then admin client
export async function uploadRoomImageWithFallback(
  roomId: number,
  imageUrl: string,
  imageType: string = 'general',
  sortOrder: number = 0
): Promise<{ data: RoomImage | null; error: any }> {
  // Try regular client first
  const supabase = createClient();
  const untypedClient = supabase as any;
  
  const insertData = {
    room_id: roomId,
    image_url: imageUrl,
    sort_order: sortOrder,
    image_type: imageType,
  };

  try {
    const { data, error } = await untypedClient
      .from('room_images')
      .insert(insertData)
      .select()
      .single();

    if (!error && data) {
      return { data: data as RoomImage, error: null };
    }
  } catch (regularError) {
    console.warn('Regular client upload failed, trying admin client:', regularError);
  }

  // Fallback to secure admin client upload
  return uploadRoomImageSecure(roomId, imageUrl, imageType, sortOrder);
}
