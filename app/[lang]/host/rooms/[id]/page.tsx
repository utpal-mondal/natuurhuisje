"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getRoomsByHouse, deleteRoom, getRoomImages } from "@/lib/rooms";
import { Room } from "@/types/rooms";
import AccountLayout from "@/components/AccountLayout";
import { Plus, Edit, Trash2, Bed, Square, Users, DollarSign } from "lucide-react";
import Link from "next/link";

export default function RoomsPage() {
  const params = useParams();
  const houseId = parseInt(params.id as string);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomImages, setRoomImages] = useState<{ [key: number]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [house, setHouse] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
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

        // Get rooms
        const { data: roomsData, error: roomsError } = await getRoomsByHouse(houseId);
        
        if (roomsError) throw roomsError;
        setRooms(roomsData || []);

        // Fetch images for each room
        if (roomsData && roomsData.length > 0) {
          const imagesPromises = roomsData.map(async (room) => {
            const { data: imagesData } = await getRoomImages(room.id);
            return { roomId: room.id, images: imagesData || [] };
          });
          
          const imagesResults = await Promise.all(imagesPromises);
          const imagesMap = imagesResults.reduce((acc, result) => {
            acc[result.roomId] = result.images;
            return acc;
          }, {} as { [key: number]: any[] });
          
          setRoomImages(imagesMap);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [houseId]);

  const handleDeleteRoom = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(roomId);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to delete rooms');
      }

      const { error } = await deleteRoom(roomId, user.id);
      if (error) {
        throw error;
      }

      // Refresh rooms list
      const { data: roomsData, error: roomsError } = await getRoomsByHouse(houseId);
      if (roomsError) throw roomsError;
      setRooms(roomsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <AccountLayout
        lang="en"
        title="Rooms"
        subtitle="Manage your house rooms"
      >
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AccountLayout>
    );
  }

  if (error) {
    return (
      <AccountLayout
        lang="en"
        title="Rooms"
        subtitle="Manage your house rooms"
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      lang="en"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{house?.title || 'House'}</h1>
            <p className="text-gray-600 mt-1">
              {rooms.length} room{rooms.length !== 1 ? 's' : ''} in this house
            </p>
          </div>
          <Link
            href={`/host/rooms/${houseId}/new`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Room
          </Link>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
            <p className="text-gray-600 mb-4">Add your first room to get started</p>
            <Link
              href={`/host/rooms/${houseId}/new`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Room
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const images = roomImages[room.id] || [];
              const mainImage = images.find(img => img.image_type === 'main') || images[0];
              
              return (
                <div key={room.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Room Image */}
                  {mainImage ? (
                    <div className="h-48 bg-gray-100">
                      <img
                        src={mainImage.image_url}
                        alt={room.room_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <Bed className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{room.room_name}</h3>
                        <p className="text-sm text-gray-600">{room.room_type}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/host/rooms/${houseId}/edit/${room.id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDeleteRoom(room.id)}
                          disabled={deleteLoading === room.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {room.size_sqm && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Square className="w-4 h-4" />
                          {room.size_sqm} m²
                        </div>
                      )}
                      
                      {room.max_occupants && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          Up to {room.max_occupants} guests
                        </div>
                      )}
                      
                      {room.bed_type && room.bed_count && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Bed className="w-4 h-4" />
                          {room.bed_count} {room.bed_type}{room.bed_count > 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {room.price_per_night && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          ${room.price_per_night}/night
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {room.is_available ? 'Available' : 'Unavailable'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.is_active 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {room.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}