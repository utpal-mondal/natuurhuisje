// Room types and interfaces
export interface Room {
  id: number;
  house_id: number;
  room_name: string;
  room_type: string;
  room_number?: string;
  floor_level?: number;
  size_sqm?: number;
  ceiling_height?: number;
  bed_type?: string;
  bed_count?: number;
  max_occupants?: number;
  has_private_bathroom?: boolean;
  has_private_kitchen?: boolean;
  has_private_entrance?: boolean;
  has_balcony?: boolean;
  has_terrace?: boolean;
  has_air_conditioning?: boolean;
  has_heating?: boolean;
  has_tv?: boolean;
  has_wifi?: boolean;
  has_desk?: boolean;
  has_wardrobe?: boolean;
  has_safety_box?: boolean;
  window_count?: number;
  window_direction?: string;
  has_blackout_curtains?: boolean;
  is_wheelchair_accessible?: boolean;
  has_ground_floor_access?: boolean;
  description?: string;
  price_per_night?: number;
  min_nights?: number;
  is_active?: boolean;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RoomImage {
  id: number;
  room_id: number;
  image_url: string;
  sort_order: number;
  image_type: string;
  created_at?: string;
}

export interface RoomFormData {
  room_name: string;
  room_type: string;
  room_number?: string;
  floor_level: number;
  size_sqm?: number;
  ceiling_height?: number;
  bed_type?: string;
  bed_count: number;
  max_occupants: number;
  has_private_bathroom: boolean;
  has_private_kitchen: boolean;
  has_private_entrance: boolean;
  has_balcony: boolean;
  has_terrace: boolean;
  has_air_conditioning: boolean;
  has_heating: boolean;
  has_tv: boolean;
  has_wifi: boolean;
  has_desk: boolean;
  has_wardrobe: boolean;
  has_safety_box: boolean;
  window_count: number;
  window_direction?: string;
  has_blackout_curtains: boolean;
  is_wheelchair_accessible: boolean;
  has_ground_floor_access: boolean;
  description?: string;
  price_per_night?: number;
  min_nights?: number;
  is_active: boolean;
  is_available: boolean;
}

export const ROOM_TYPES = [
  'Bedroom',
  'Living Room',
  'Kitchen',
  'Bathroom',
  'Dining Room',
  'Office',
  'Storage',
  'Garage',
  'Basement',
  'Attic',
  'Studio',
  'Suite',
  'Apartment',
] as const;

export const BED_TYPES = [
  'Single',
  'Double',
  'Queen',
  'King',
  'Twin',
  'Bunk Bed',
  'Sofa Bed',
  'Murphy Bed',
  'Futon',
] as const;

export const WINDOW_DIRECTIONS = [
  'North',
  'South',
  'East',
  'West',
  'Northeast',
  'Northwest',
  'Southeast',
  'Southwest',
] as const;
