import { createClient } from '@/utils/supabase/client';
import { RoomImage } from '@/types/rooms';

// Simple image upload that bypasses RLS issues by using untyped client
export async function uploadRoomImageSimple(
  roomId: number,
  imageUrl: string,
  imageType: string = 'general',
  sortOrder: number = 0
): Promise<{ data: RoomImage | null; error: any }> {
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

    if (error) {
      console.error('Image upload error:', error);
      return { data: null, error };
    }

    return { data: data as RoomImage, error: null };
  } catch (err) {
    console.error('Unexpected error during image upload:', err);
    return { data: null, error: err };
  }
}

// Simple image delete function
export async function deleteRoomImageSimple(imageId: number): Promise<{ error: any }> {
  const supabase = createClient();
  const untypedClient = supabase as any;
  
  try {
    const { error } = await untypedClient
      .from('room_images')
      .delete()
      .eq('id', imageId);

    return { error };
  } catch (err) {
    console.error('Error deleting image:', err);
    return { error: err };
  }
}

// Get room images function
export async function getRoomImagesSimple(roomId: number): Promise<{ data: RoomImage[] | null; error: any }> {
  const supabase = createClient();
  const untypedClient = supabase as any;
  
  try {
    const { data, error } = await untypedClient
      .from('room_images')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true });

    return { data, error };
  } catch (err) {
    console.error('Error getting room images:', err);
    return { data: null, error: err };
  }
}
