import { createClient } from '@/utils/supabase/client';
import { Room, RoomFormData, RoomImage } from '@/types/rooms';
import { canEditHouse } from '@/lib/roles';
import { Database } from '@/types/supabase';

export async function getRoomsByHouse(houseId: number): Promise<{ data: Room[] | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('house_id', houseId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function getRoomById(roomId: number): Promise<{ data: Room | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  return { data, error };
}

export async function createRoom(
  houseId: number,
  roomData: RoomFormData,
  userId: string,
  images?: RoomImage[]
): Promise<{ data: Room | null; error: any }> {
  const supabase = createClient();
  
  // Check if user can edit the house
  const canEdit = await canEditHouse(userId, houseId);
  if (!canEdit) {
    return { data: null, error: { message: 'You do not have permission to add rooms to this house' } };
  }
  
  // Map RoomFormData to database schema for insertion
  const insertData: Database['public']['Tables']['rooms']['Insert'] = {
    house_id: houseId,
    room_name: roomData.room_name,
    room_type: roomData.room_type,
    room_number: roomData.room_number || null,
    floor_level: roomData.floor_level,
    size_sqm: roomData.size_sqm || null,
    bed_type: roomData.bed_type || null,
    bed_count: roomData.bed_count,
    max_occupants: roomData.max_occupants,
    has_private_bathroom: roomData.has_private_bathroom,
    has_private_kitchen: roomData.has_private_kitchen,
    has_private_entrance: roomData.has_private_entrance,
    has_balcony: roomData.has_balcony,
    has_terrace: roomData.has_terrace,
    has_air_conditioning: roomData.has_air_conditioning,
    has_heating: roomData.has_heating,
    has_tv: roomData.has_tv,
    has_wifi: roomData.has_wifi,
    has_desk: roomData.has_desk,
    has_wardrobe: roomData.has_wardrobe,
    has_safety_box: roomData.has_safety_box,
    window_count: roomData.window_count,
    window_direction: roomData.window_direction || null,
    has_blackout_curtains: roomData.has_blackout_curtains,
    is_wheelchair_accessible: roomData.is_wheelchair_accessible,
    has_ground_floor_access: roomData.has_ground_floor_access,
    description: roomData.description || null,
    price_per_night: roomData.price_per_night || null,
    min_nights: roomData.min_nights || null,
    is_active: roomData.is_active,
    is_available: roomData.is_available,
  };
  
  const { data, error } = await supabase
    .from('rooms')
    .insert(insertData as any)
    .select()
    .single()
    .returns<Room>();

  if (error) {
    return { data, error };
  }

  // Handle images if provided
  if (images && images.length > 0 && data) {
    const untypedClient = supabase as any;
    const room = data as Room; // Properly type the room data
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log('Image:', image);
      
      // Handle local images (with file objects)
      if ((image as any).file) {
        try {
          const file = (image as any).file;
          
          // Upload to Supabase storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `room-images/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('room-images')
            .upload(filePath, file);
            
          if (uploadError) {
            console.warn('Image upload failed:', uploadError);
            continue; // Skip this image but continue with others
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('room-images')
            .getPublicUrl(filePath);
          
          // Save to database
          const insertImageData = {
            room_id: room.id,
            image_url: publicUrl,
            sort_order: i,
            image_type: image.image_type || 'general',
          };
          
          await untypedClient
            .from('room_images')
            .insert(insertImageData);
            
        } catch (imageError) {
          console.warn('Failed to process image:', imageError);
          // Continue with other images
        }
      } else {
        // Handle existing images (already uploaded)
        try {
          const insertImageData = {
            room_id: room.id,
            image_url: image.image_url,
            sort_order: i,
            image_type: image.image_type || 'general',
          };
          
          await untypedClient
            .from('room_images')
            .insert(insertImageData);
        } catch (imageError) {
          console.warn('Failed to save existing image:', imageError);
        }
      }
    }
  }

  return { data, error };
}

export async function updateRoom(
  roomId: number,
  roomData: Partial<RoomFormData>,
  userId: string,
  images?: RoomImage[]
): Promise<{ data: Room | null; error: any }> {
  const supabase = createClient();
  
  // First get the room to check house ownership
  const { data: room, error: roomError } = await getRoomById(roomId);
  if (roomError || !room) {
    return { data: null, error: roomError || { message: 'Room not found' } };
  }
  
  // Check if user can edit the house
  const canEdit = await canEditHouse(userId, room.house_id);
  if (!canEdit) {
    return { data: null, error: { message: 'You do not have permission to edit this room' } };
  }
  
  // Map RoomFormData to database schema
  const updateData: Database['public']['Tables']['rooms']['Update'] = {};
  
  if (roomData.room_name !== undefined) updateData.room_name = roomData.room_name;
  if (roomData.room_type !== undefined) updateData.room_type = roomData.room_type;
  if (roomData.room_number !== undefined) updateData.room_number = roomData.room_number;
  if (roomData.floor_level !== undefined) updateData.floor_level = roomData.floor_level;
  if (roomData.size_sqm !== undefined) updateData.size_sqm = roomData.size_sqm;
  if (roomData.bed_type !== undefined) updateData.bed_type = roomData.bed_type;
  if (roomData.bed_count !== undefined) updateData.bed_count = roomData.bed_count;
  if (roomData.max_occupants !== undefined) updateData.max_occupants = roomData.max_occupants;
  if (roomData.has_private_bathroom !== undefined) updateData.has_private_bathroom = roomData.has_private_bathroom;
  if (roomData.has_private_kitchen !== undefined) updateData.has_private_kitchen = roomData.has_private_kitchen;
  if (roomData.has_private_entrance !== undefined) updateData.has_private_entrance = roomData.has_private_entrance;
  if (roomData.has_balcony !== undefined) updateData.has_balcony = roomData.has_balcony;
  if (roomData.has_terrace !== undefined) updateData.has_terrace = roomData.has_terrace;
  if (roomData.has_air_conditioning !== undefined) updateData.has_air_conditioning = roomData.has_air_conditioning;
  if (roomData.has_heating !== undefined) updateData.has_heating = roomData.has_heating;
  if (roomData.has_tv !== undefined) updateData.has_tv = roomData.has_tv;
  if (roomData.has_wifi !== undefined) updateData.has_wifi = roomData.has_wifi;
  if (roomData.has_desk !== undefined) updateData.has_desk = roomData.has_desk;
  if (roomData.has_wardrobe !== undefined) updateData.has_wardrobe = roomData.has_wardrobe;
  if (roomData.has_safety_box !== undefined) updateData.has_safety_box = roomData.has_safety_box;
  if (roomData.window_count !== undefined) updateData.window_count = roomData.window_count;
  if (roomData.window_direction !== undefined) updateData.window_direction = roomData.window_direction;
  if (roomData.has_blackout_curtains !== undefined) updateData.has_blackout_curtains = roomData.has_blackout_curtains;
  if (roomData.is_wheelchair_accessible !== undefined) updateData.is_wheelchair_accessible = roomData.is_wheelchair_accessible;
  if (roomData.has_ground_floor_access !== undefined) updateData.has_ground_floor_access = roomData.has_ground_floor_access;
  if (roomData.description !== undefined) updateData.description = roomData.description;
  if (roomData.price_per_night !== undefined) updateData.price_per_night = roomData.price_per_night;
  if (roomData.min_nights !== undefined) updateData.min_nights = roomData.min_nights;
  if (roomData.is_active !== undefined) updateData.is_active = roomData.is_active;
  if (roomData.is_available !== undefined) updateData.is_available = roomData.is_available;
  
  // Only update if there are fields to update
  if (Object.keys(updateData).length === 0) {
    return { data: room, error: null };
  }
  
  const { data, error } = await (supabase as any)
    .from('rooms')
    .update(updateData)
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    return { data, error };
  }

  // Handle images if provided
  if (images && images.length > 0) {
    const untypedClient = supabase as any;
    
    // First, delete existing images for this room
    try {
      const { error: deleteError } = await untypedClient
        .from('room_images')
        .delete()
        .eq('room_id', roomId);
      
      if (deleteError) {
        console.warn('Failed to delete existing images:', deleteError);
        // Don't throw error, continue with image insertion
      }
    } catch (deleteError) {
      console.warn('Failed to delete existing images:', deleteError);
    }
    
    // Then add new images
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log('Image:', image);
      
      // Handle local images (with file objects)
      if ((image as any).file) {
        try {
          const file = (image as any).file;
          
          // Upload to Supabase storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `room-images/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('room-images')
            .upload(filePath, file);
            
          if (uploadError) {
            console.warn('Image upload failed:', uploadError);
            continue; // Skip this image but continue with others
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('room-images')
            .getPublicUrl(filePath);
          
          // Save to database
          const insertImageData = {
            room_id: roomId,
            image_url: publicUrl,
            sort_order: i,
            image_type: image.image_type || 'general',
          };
          
          const { error: insertError } = await untypedClient
            .from('room_images')
            .insert(insertImageData);
            
          if (insertError) {
            console.warn('Failed to insert image:', insertError);
            // Continue with other images
          }
            
        } catch (imageError) {
          console.warn('Failed to process image:', imageError);
          // Continue with other images
        }
      } else {
        // Handle existing images (already uploaded)
        try {
          const insertImageData = {
            room_id: roomId,
            image_url: image.image_url,
            sort_order: i,
            image_type: image.image_type || 'general',
          };
          
          const { error: insertError } = await untypedClient
            .from('room_images')
            .insert(insertImageData);
            
          if (insertError) {
            console.warn('Failed to save existing image:', insertError);
          }
        } catch (imageError) {
          console.warn('Failed to save existing image:', imageError);
        }
      }
    }
  }

  return { data, error };
}

export async function deleteRoom(roomId: number, userId: string): Promise<{ error: any }> {
  const supabase = createClient();
  
  // First get the room to check house ownership
  const { data: room, error: roomError } = await getRoomById(roomId);
  if (roomError || !room) {
    return { error: roomError || { message: 'Room not found' } };
  }
  
  // Check if user can edit the house
  const canEdit = await canEditHouse(userId, room.house_id);
  if (!canEdit) {
    return { error: { message: 'You do not have permission to delete this room' } };
  }
  
  const { error } = await (supabase as any)
    .from('rooms')
    .update({ is_active: false })
    .eq('id', roomId);

  // Also delete room images
  if (!error) {
    const { error: imageError } = await (supabase as any)
      .from('room_images')
      .delete()
      .eq('room_id', roomId);
    
    return { error: imageError };
  }

  return { error };
}

export async function getRoomImages(roomId: number): Promise<{ data: RoomImage[] | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('room_images')
    .select('*')
    .eq('room_id', roomId)
    .order('sort_order', { ascending: true });

  return { data, error };
}

export async function uploadRoomImage(
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
  
  const { data, error } = await untypedClient
    .from('room_images')
    .insert(insertData)
    .select()
    .single();

  return { data: data as RoomImage | null, error };
}

export async function deleteRoomImage(imageId: number): Promise<{ error: any }> {
  const supabase = createClient();
  const untypedClient = supabase as any;
  
  const { error } = await untypedClient
    .from('room_images')
    .delete()
    .eq('id', imageId);

  return { error };
}
