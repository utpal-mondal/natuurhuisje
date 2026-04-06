"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createRoom, updateRoom, getRoomById, getRoomImages, uploadRoomImage, deleteRoomImage } from "@/lib/rooms";
import { uploadRoomImageSimple, deleteRoomImageSimple } from "@/lib/simple-images";
import { RoomFormData, Room, ROOM_TYPES, BED_TYPES, WINDOW_DIRECTIONS, RoomImage } from "@/types/rooms";
import { Database } from "@/types/supabase";
import AccountLayout from "@/components/AccountLayout";
import { ArrowLeft, Save, Bed, Square, Users, DollarSign, Home, Wifi, Tv, Wind, Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AddEditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const houseId = parseInt(params.id as string);
  const roomId = params.slug ? parseInt(params.slug as string) : null;
  const isEdit = !!roomId;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | boolean>(false);
  const [house, setHouse] = useState<any>(null);
  const [roomImages, setRoomImages] = useState<RoomImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to convert base64 to File
  const base64ToFile = async (base64: string, fileName: string): Promise<File> => {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  // Load locally saved data on component mount
  useEffect(() => {
    const loadLocalData = async () => {
      if (isEdit && roomId) {
        const storageKey = `room_edit_${roomId}`;
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setFormData({
              room_name: parsed.room_name,
              room_type: parsed.room_type,
              room_number: parsed.room_number || '',
              floor_level: parsed.floor_level || 1,
              size_sqm: parsed.size_sqm || undefined,
              ceiling_height: parsed.ceiling_height || undefined,
              bed_type: parsed.bed_type || '',
              bed_count: parsed.bed_count || 1,
              max_occupants: parsed.max_occupants || 2,
              has_private_bathroom: parsed.has_private_bathroom || false,
              has_private_kitchen: parsed.has_private_kitchen || false,
              has_private_entrance: parsed.has_private_entrance || false,
              has_balcony: parsed.has_balcony || false,
              has_terrace: parsed.has_terrace || false,
              has_air_conditioning: parsed.has_air_conditioning || false,
              has_heating: parsed.has_heating || false,
              has_tv: parsed.has_tv || false,
              has_wifi: parsed.has_wifi || false,
              has_desk: parsed.has_desk || false,
              has_wardrobe: parsed.has_wardrobe || false,
              has_safety_box: parsed.has_safety_box || false,
              window_count: parsed.window_count || 1,
              window_direction: parsed.window_direction || '',
              has_blackout_curtains: parsed.has_blackout_curtains || false,
              is_wheelchair_accessible: parsed.is_wheelchair_accessible || false,
              has_ground_floor_access: parsed.has_ground_floor_access || false,
              description: parsed.description || '',
              price_per_night: parsed.price_per_night || undefined,
              min_nights: parsed.min_nights || undefined,
              is_active: parsed.is_active ?? true,
              is_available: parsed.is_available ?? true,
            });
            
            // Handle images with base64 files
            const imagesWithFiles = await Promise.all((parsed.images || []).map(async (img: any) => {
              const imageCopy = { ...img };
              if (img.fileBase64 && img.fileName) {
                const file = await base64ToFile(img.fileBase64, img.fileName);
                (imageCopy as any).file = file;
                delete (imageCopy as any).fileBase64;
                delete (imageCopy as any).fileName;
              }
              return imageCopy;
            }));
            
            setRoomImages(imagesWithFiles);
            setHasLocalData(true);
          } catch (error) {
            console.error('Error loading local data:', error);
          }
        }
      }
    };

    loadLocalData();
  }, [isEdit, roomId]);

  // Function to sync local data to Supabase
  const syncLocalToSupabase = async () => {
    if (!hasLocalData || !isEdit || !roomId) return;

    const storageKey = `room_edit_${roomId}`;
    const localData = localStorage.getItem(storageKey);
    if (!localData) return;

    try {
      const parsed = JSON.parse(localData);
      const supabase = createClient();
      
      // Try to update the room with images
      const result = await updateRoom(roomId, parsed, parsed.user_id, parsed.images);
      
      if (result.data) {
        // Clean up local data on successful sync
        localStorage.removeItem(storageKey);
        setHasLocalData(false);
        setSuccess('Room synced to Supabase successfully!');
      }
    } catch (error) {
      console.error('Sync to Supabase failed:', error);
      setError('Failed to sync to Supabase: ' + (error as any).message);
    }
  };

  const [formData, setFormData] = useState<RoomFormData>({
    room_name: '',
    room_type: 'Bedroom',
    room_number: '',
    floor_level: 1,
    size_sqm: undefined,
    ceiling_height: undefined,
    bed_type: '',
    bed_count: 1,
    max_occupants: 2,
    has_private_bathroom: false,
    has_private_kitchen: false,
    has_private_entrance: false,
    has_balcony: false,
    has_terrace: false,
    has_air_conditioning: false,
    has_heating: false,
    has_tv: false,
    has_wifi: false,
    has_desk: false,
    has_wardrobe: false,
    has_safety_box: false,
    window_count: 1,
    window_direction: '',
    has_blackout_curtains: false,
    is_wheelchair_accessible: false,
    has_ground_floor_access: false,
    description: '',
    price_per_night: undefined,
    min_nights: undefined,
    is_active: true,
    is_available: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Get house details
        const { data: houseData, error: houseError } = await supabase
          .from('houses')
          .select('*')
          .eq('id', houseId)
          .single();
        
        if (houseError) throw houseError;
        setHouse(houseData);

        // If editing, get room details and images
        if (isEdit && roomId) {
          const { data: roomData, error: roomError } = await getRoomById(roomId);
          if (roomError) throw roomError;
          if (roomData) {
            setFormData({
              room_name: roomData.room_name,
              room_type: roomData.room_type,
              room_number: roomData.room_number || '',
              floor_level: roomData.floor_level || 1,
              size_sqm: roomData.size_sqm || undefined,
              ceiling_height: roomData.ceiling_height || undefined,
              bed_type: roomData.bed_type || '',
              bed_count: roomData.bed_count || 1,
              max_occupants: roomData.max_occupants || 2,
              has_private_bathroom: roomData.has_private_bathroom || false,
              has_private_kitchen: roomData.has_private_kitchen || false,
              has_private_entrance: roomData.has_private_entrance || false,
              has_balcony: roomData.has_balcony || false,
              has_terrace: roomData.has_terrace || false,
              has_air_conditioning: roomData.has_air_conditioning || false,
              has_heating: roomData.has_heating || false,
              has_tv: roomData.has_tv || false,
              has_wifi: roomData.has_wifi || false,
              has_desk: roomData.has_desk || false,
              has_wardrobe: roomData.has_wardrobe || false,
              has_safety_box: roomData.has_safety_box || false,
              window_count: roomData.window_count || 1,
              window_direction: roomData.window_direction || '',
              has_blackout_curtains: roomData.has_blackout_curtains || false,
              is_wheelchair_accessible: roomData.is_wheelchair_accessible || false,
              has_ground_floor_access: roomData.has_ground_floor_access || false,
              description: roomData.description || '',
              price_per_night: roomData.price_per_night || undefined,
              min_nights: roomData.min_nights || undefined,
              is_active: roomData.is_active ?? true,
              is_available: roomData.is_available ?? true,
            });

            // Fetch existing room images
            const { data: images, error: imagesError } = await getRoomImages(roomId);
            if (imagesError) throw imagesError;
            setRoomImages(images || []);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [houseId, isEdit, roomId]);

  const handleInputChange = (field: keyof RoomFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create a local preview URL for immediate display
        const localUrl = URL.createObjectURL(file);
        
        // Create temporary image object for local display
        const tempImage: RoomImage = {
          id: 0, // Temporary ID
          room_id: 0, // Will be set when room is created
          image_url: localUrl,
          sort_order: roomImages.length,
          image_type: 'general',
          created_at: new Date().toISOString()
        };
        
        // Store the actual file for later upload
        (tempImage as any).file = file;
        
        setRoomImages(prev => [...prev, tempImage]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingImages(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (imageIdOrIndex: number) => {
    try {
      // Check if this is an index (for local images) or an ID (for database images)
      const isIndex = imageIdOrIndex >= 0 && roomImages[imageIdOrIndex]?.id === 0;
      
      let imageToDelete;
      if (isIndex) {
        // This is a local image, get it by index
        imageToDelete = roomImages[imageIdOrIndex];
      } else {
        // This is a database image, get it by ID
        imageToDelete = roomImages.find(img => img.id === imageIdOrIndex);
      }
      
      if (!imageToDelete) {
        throw new Error('Image not found');
      }
      
      // Only delete from database if it's a real database image (id !== 0)
      if (!isIndex && isEdit && roomId && imageIdOrIndex !== 0) {
        const { error } = await deleteRoomImageSimple(imageIdOrIndex);
        if (error) throw error;
      }
      
      // Clean up blob URL if it's a local image
      if (isIndex && imageToDelete.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.image_url);
      }
      
      // Remove from state
      if (isIndex) {
        // Remove by index for local images
        setRoomImages(prev => prev.filter((_, idx) => idx !== imageIdOrIndex));
      } else {
        // Remove by ID for database images
        setRoomImages(prev => prev.filter(img => img.id !== imageIdOrIndex));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add/edit rooms');
      }

      // Step 1: Store room data locally first (convert files to base64 for localStorage)
      const localRoomData = {
        ...formData,
        house_id: houseId,
        user_id: user.id,
        images: await Promise.all(roomImages.map(async (img) => {
          const imageCopy = { ...img };
          if ((img as any).file) {
            // Convert file to base64 for localStorage storage
            const base64 = await fileToBase64((img as any).file);
            (imageCopy as any).fileBase64 = base64;
            (imageCopy as any).fileName = (img as any).file.name;
            delete (imageCopy as any).file; // Remove the actual file object
          }
          return imageCopy;
        })),
        is_edit: isEdit,
        room_id: roomId
      };

      // Store in localStorage for immediate feedback
      const storageKey = isEdit ? `room_edit_${roomId}` : `room_new_${Date.now()}`;
      localStorage.setItem(storageKey, JSON.stringify(localRoomData));

      // Step 2: Try to upload to Supabase (non-blocking)
      let result;
      try {
        if (isEdit && roomId) {
          result = await updateRoom(roomId, formData, user.id, roomImages);
        } else {
          result = await createRoom(houseId, formData, user.id, roomImages);
        }
      } catch (supabaseError) {
        // If Supabase upload fails, we still have the local data
        console.warn('Supabase upload failed, data saved locally:', supabaseError);
        setSuccess(true);
        setError('Room saved locally. Supabase upload failed: ' + (supabaseError as any).message);
        setLoading(false);
        return;
      }

      // Step 3: Clean up localStorage on successful Supabase upload
      if (result.data) {
        localStorage.removeItem(storageKey);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/host/rooms/${houseId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AccountLayout
        lang="en"
        title={isEdit ? "Edit Room" : "Add Room"}
        subtitle="Manage your room details and availability"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      lang="en"
      title={isEdit ? "Edit Room" : "Add Room"}
      subtitle={`${house?.title || 'House'} • ${isEdit ? 'Update room information' : 'Create a new room'}`}
      backButton={{
        href: `/host/rooms/${houseId}`,
        label: "Back to Rooms"
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-600">
              {typeof success === 'string' 
                ? success 
                : `Room ${isEdit ? 'updated' : 'created'} successfully! Redirecting...`
              }
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {/* Local Data Notification */}
        {hasLocalData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-800 font-medium">Working with local data</p>
                <p className="text-yellow-600 text-sm">Your changes are saved locally. Sync to Supabase when ready.</p>
              </div>
              <button
                type="button"
                onClick={syncLocalToSupabase}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Sync to Supabase
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={formData.room_name}
                  onChange={(e) => handleInputChange('room_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type *
                </label>
                <select
                  value={formData.room_type}
                  onChange={(e) => handleInputChange('room_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {ROOM_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number
                </label>
                <input
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => handleInputChange('room_number', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 101, A, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor Level
                </label>
                <input
                  type="number"
                  value={formData.floor_level}
                  onChange={(e) => handleInputChange('floor_level', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Square className="w-5 h-5" />
              Room Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (m²)
                </label>
                <input
                  type="number"
                  value={formData.size_sqm || ''}
                  onChange={(e) => handleInputChange('size_sqm', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ceiling Height (m)
                </label>
                <input
                  type="number"
                  value={formData.ceiling_height || ''}
                  onChange={(e) => handleInputChange('ceiling_height', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bed Type
                </label>
                <select
                  value={formData.bed_type}
                  onChange={(e) => handleInputChange('bed_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select bed type</option>
                  {BED_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Beds
                </label>
                <input
                  type="number"
                  value={formData.bed_count}
                  onChange={(e) => handleInputChange('bed_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Occupants
                </label>
                <input
                  type="number"
                  value={formData.max_occupants}
                  onChange={(e) => handleInputChange('max_occupants', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Window Direction
                </label>
                <select
                  value={formData.window_direction}
                  onChange={(e) => handleInputChange('window_direction', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select direction</option>
                  {WINDOW_DIRECTIONS.map(direction => (
                    <option key={direction} value={direction}>{direction}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Window Count
                </label>
                <input
                  type="number"
                  value={formData.window_count}
                  onChange={(e) => handleInputChange('window_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Features & Amenities
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { key: 'has_private_bathroom', label: 'Private Bathroom' },
                { key: 'has_private_kitchen', label: 'Private Kitchen' },
                { key: 'has_private_entrance', label: 'Private Entrance' },
                { key: 'has_balcony', label: 'Balcony' },
                { key: 'has_terrace', label: 'Terrace' },
                { key: 'has_air_conditioning', label: 'Air Conditioning' },
                { key: 'has_heating', label: 'Heating' },
                { key: 'has_tv', label: 'TV' },
                { key: 'has_wifi', label: 'WiFi' },
                { key: 'has_desk', label: 'Desk' },
                { key: 'has_wardrobe', label: 'Wardrobe' },
                { key: 'has_safety_box', label: 'Safety Box' },
                { key: 'has_blackout_curtains', label: 'Blackout Curtains' },
                { key: 'is_wheelchair_accessible', label: 'Wheelchair Accessible' },
                { key: 'has_ground_floor_access', label: 'Ground Floor Access' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData[key as keyof RoomFormData] as boolean}
                    onChange={(e) => handleInputChange(key as keyof RoomFormData, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing & Availability */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing & Availability
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per Night
                </label>
                <input
                  type="number"
                  value={formData.price_per_night || ''}
                  onChange={(e) => handleInputChange('price_per_night', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Nights
                </label>
                <input
                  type="number"
                  value={formData.min_nights || ''}
                  onChange={(e) => handleInputChange('min_nights', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => handleInputChange('is_available', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Available for booking</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the room, its features, and what makes it special..."
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Room Images
            </h2>
            
            {/* Upload Button */}
            <div className="mb-6">
              <label className="block">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="hidden"
                />
                <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {uploadingImages ? 'Uploading...' : 'Click to upload images or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB each</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Images Grid */}
            {roomImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {roomImages.map((image, index) => {
                  // Create a unique key that works for both local and database images
                  const uniqueKey = image.id !== 0 ? image.id : `local-${index}`;
                  
                  return (
                    <div key={uniqueKey} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={image.image_url}
                          alt={`Room image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.id !== 0 ? image.id : index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Image Number */}
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {roomImages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No images uploaded yet</p>
                <p className="text-sm">Add images to showcase your room</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/host/rooms/${houseId}`}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : (isEdit ? 'Update Room' : 'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </AccountLayout>
  );
}
