import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    console.log('Creating Supabase client...');
    const supabase = await createClient();
    console.log('Supabase client created successfully');

    console.log('Fetching houses from database...');
    const { data, error } = await supabase
      .from('houses')
      .select(`
        id,
        accommodation_name,
        type,
        max_person,
        location,
        price_per_night,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }
    
    console.log(`Found ${data?.length || 0} houses`);
    console.log('Sample house data:', data?.[0]);

    // Fetch images for each house
    const houseIds = (data || []).map((house: any) => house.id);
    let houseImages: any[] = [];
    
    if (houseIds.length > 0) {
      const { data: imagesData } = await supabase
        .from('house_images')
        .select('house_id, image_url, sort_order')
        .in('house_id', houseIds)
        .order('sort_order');
      
      houseImages = imagesData || [];
    }
    
    // Transform the data to match the expected format
    const transformedListings = (data || []).map((listing: any) => {
      const images = houseImages
        .filter((img: any) => img.house_id === listing.id)
        .map((img: any) => img.image_url);
      
      // Generate realistic placeholder ratings based on property type
      const ratingMap: { [key: string]: number } = {
        'cottage': 4.6,
        'treehouse': 4.8,
        'tent': 4.4,
        'windmill': 4.9,
        'tiny_house': 4.3,
        'chalet': 4.7,
        'villa': 4.8,
      };
      
      return {
        id: listing.id,
        slug: listing.id.toString(), // Use ID as slug for now
        title: listing.accommodation_name,
        property_type: listing.type || '',
        location: listing.location || 'Unknown location',
        images: images.length > 0 ? images : ['/images/default-house.jpg'],
        price_per_night: listing.price_per_night || 0,
        max_person: listing.max_person || 0,
        avg_rating: ratingMap[listing.type] || 4.5, // Realistic placeholder rating
        created_at: listing.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedListings
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
