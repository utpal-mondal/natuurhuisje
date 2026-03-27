"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { X, Upload, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ListingFormProps {
  listing: {
    id: string;
    host_id: string;
    title: string;
    description: string;
    property_type: string;
    location: string;
    address: string;
    price_per_night: number;
    min_nights: number;
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: string[];
    images: string[];
    is_published: boolean;
  };
  isNew: boolean;
}

const initialFormState = {
  id: '',
  host_id: '',
  title: '',
  description: '',
  property_type: 'cabin',
  location: '',
  address: '',
  price_per_night: 0,
  min_nights: 1,
  max_guests: 1,
  bedrooms: 0,
  beds: 1,
  bathrooms: 0,
  amenities: [],
  images: [],
  is_published: false,
} as ListingFormProps['listing'];

export function ListingForm({ listing, isNew }: ListingFormProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // Form state
  const [formState, setFormState] = useState({ ...initialFormState, ...listing });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>(formState.images);
  
  // Amenity options
  const amenityOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'pets', label: 'Pets Allowed' },
    { value: 'fireplace', label: 'Fireplace' },
    { value: 'pool', label: 'Pool' },
    { value: 'hot-tub', label: 'Hot Tub' },
    { value: 'bbq', label: 'BBQ' },
    { value: 'lake', label: 'Lake Access' },
    { value: 'mountain-view', label: 'Mountain Views' },
    { value: 'beachfront', label: 'Beachfront' },
    { value: 'secluded', label: 'Secluded' },
    { value: 'forest', label: 'Forest' }
  ];
  
  // Property type options
  const propertyTypeOptions = [
    { value: 'cabin', label: 'Cabin' },
    { value: 'treehouse', label: 'Treehouse' },
    { value: 'glamping', label: 'Glamping' },
    { value: 'tiny-house', label: 'Tiny House' },
    { value: 'farm', label: 'Farm Stay' },
    { value: 'other', label: 'Other' }
  ];
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormState({
        ...formState,
        [name]: value === '' ? 0 : Number(value)
      });
    } else {
      setFormState({
        ...formState,
        [name]: value
      });
    }
    
    // Clear error when user edits field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Handle amenities selection
  const handleAmenityToggle = (amenity: string) => {
    if (formState.amenities.includes(amenity)) {
      setFormState({
        ...formState,
        amenities: formState.amenities.filter(a => a !== amenity)
      });
    } else {
      setFormState({
        ...formState,
        amenities: [...formState.amenities, amenity]
      });
    }
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    setUploadingImages(true);
    
    // Convert FileList to array and limit to 5 images
    const files = Array.from(e.target.files).slice(0, 5);
    setImageFiles([...imageFiles, ...files]);
    
    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
    
    setUploadingImages(false);
  };
  
  // Remove image
  const removeImage = (index: number) => {
    // If it's from existing images, maintain reference in DB but remove from preview
    if (index < listing.images.length) {
      setFormState({
        ...formState,
        images: formState.images.filter((_, i) => i !== index)
      });
    }
    
    // Update previews and files
    setImagePreview(imagePreview.filter((_, i) => i !== index));
    
    if (index >= listing.images.length) {
      const newFileIndex = index - listing.images.length;
      setImageFiles(imageFiles.filter((_, i) => i !== newFileIndex));
    }
  };
  
  // Upload images to Supabase Storage
  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (imageFiles.length === 0) {
      return formState.images;
    }
    
    const uploadedImageUrls: string[] = [...formState.images];
    
    for (const file of imageFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${formState.host_id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('listing_images')
        .upload(filePath, file);
        
      if (error) {
        console.error('Error uploading image:', error);
        continue;
      }
      
      const { data: publicUrl } = supabase.storage
        .from('listing_images')
        .getPublicUrl(filePath);
        
      uploadedImageUrls.push(publicUrl.publicUrl);
    }
    
    return uploadedImageUrls;
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formState.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formState.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formState.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formState.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (formState.price_per_night <= 0) {
      newErrors.price_per_night = 'Price must be greater than 0';
    }
    
    if (formState.max_guests <= 0) {
      newErrors.max_guests = 'Maximum guests must be at least 1';
    }
    
    if (imagePreview.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images if there are new ones
      const imageUrls = await uploadImagesToStorage();
      
      const listingData = {
        ...formState,
        images: imageUrls,
      };
      
      let result;
      
      if (isNew) {
        // Create new listing
        result = await (supabase
          .from('listings') as any)
          .insert([listingData])
          .select();
      } else {
        // Update existing listing
        const { id, ...updateData } = listingData;
        result = await (supabase
          .from('listings') as any)
          .update(updateData)
          .eq('id', id)
          .select();
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Redirect to host dashboard on success
      router.push('/en/host/listings');
      router.refresh();
      
    } catch (error) {
      console.error('Error saving listing:', error);
      setErrors({
        ...errors,
        submit: 'Failed to save listing. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <form onSubmit={handleSubmit} className="space-y-8">
        {errors.submit && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-lg">
            {errors.submit}
          </div>
        )}
        
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-forest-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-forest-700 mb-1">
                Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                className={`block w-full rounded-lg border ${
                  errors.title ? 'border-rose-500' : 'border-border'
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                placeholder="e.g., Cozy Cabin in the Woods"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-rose-600">{errors.title}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-forest-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                rows={5}
                className={`block w-full rounded-lg border ${
                  errors.description ? 'border-rose-500' : 'border-border'
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                placeholder="Describe your property, surroundings, and what makes it special..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-rose-600">{errors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="property_type" className="block text-sm font-medium text-forest-700 mb-1">
                  Property Type*
                </label>
                <select
                  id="property_type"
                  name="property_type"
                  value={formState.property_type}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500"
                >
                  {propertyTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-forest-700 mb-1">
                  Location* (City, Region)
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formState.location}
                  onChange={handleInputChange}
                  className={`block w-full rounded-lg border ${
                    errors.location ? 'border-rose-500' : 'border-border'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  placeholder="e.g., Lake District, England"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-rose-600">{errors.location}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-forest-700 mb-1">
                Full Address* (Not shown to guests until booking)
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formState.address}
                onChange={handleInputChange}
                className={`block w-full rounded-lg border ${
                  errors.address ? 'border-rose-500' : 'border-border'
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                placeholder="Full address including postal code"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-rose-600">{errors.address}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Details */}
        <div>
          <h2 className="text-xl font-semibold text-forest-900 mb-4">Property Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="price_per_night" className="block text-sm font-medium text-forest-700 mb-1">
                Price per Night*
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-cream-50 text-forest-700">
                  €
                </span>
                <input
                  type="number"
                  id="price_per_night"
                  name="price_per_night"
                  value={formState.price_per_night}
                  onChange={handleInputChange}
                  min="1"
                  className={`block w-full rounded-r-lg border ${
                    errors.price_per_night ? 'border-rose-500' : 'border-border'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                />
              </div>
              {errors.price_per_night && (
                <p className="mt-1 text-sm text-rose-600">{errors.price_per_night}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="min_nights" className="block text-sm font-medium text-forest-700 mb-1">
                Minimum Nights
              </label>
              <input
                type="number"
                id="min_nights"
                name="min_nights"
                value={formState.min_nights}
                onChange={handleInputChange}
                min="1"
                className="block w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            
            <div>
              <label htmlFor="max_guests" className="block text-sm font-medium text-forest-700 mb-1">
                Maximum Guests*
              </label>
              <input
                type="number"
                id="max_guests"
                name="max_guests"
                value={formState.max_guests}
                onChange={handleInputChange}
                min="1"
                className={`block w-full rounded-lg border ${
                  errors.max_guests ? 'border-rose-500' : 'border-border'
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500`}
              />
              {errors.max_guests && (
                <p className="mt-1 text-sm text-rose-600">{errors.max_guests}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-forest-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                id="bedrooms"
                name="bedrooms"
                value={formState.bedrooms}
                onChange={handleInputChange}
                min="0"
                className="block w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            
            <div>
              <label htmlFor="beds" className="block text-sm font-medium text-forest-700 mb-1">
                Beds
              </label>
              <input
                type="number"
                id="beds"
                name="beds"
                value={formState.beds}
                onChange={handleInputChange}
                min="1"
                className="block w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
            
            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-forest-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                id="bathrooms"
                name="bathrooms"
                value={formState.bathrooms}
                onChange={handleInputChange}
                min="0"
                step="0.5"
                className="block w-full rounded-lg border border-border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </div>
        
        {/* Amenities */}
        <div>
          <h2 className="text-xl font-semibold text-forest-900 mb-4">Amenities</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {amenityOptions.map((amenity) => (
              <div 
                key={amenity.value}
                className={`
                  flex items-center gap-2 p-3 border rounded-lg cursor-pointer
                  ${formState.amenities.includes(amenity.value) 
                    ? 'bg-forest-100 border-forest-300' 
                    : 'bg-white border-border hover:bg-cream-50'
                  }
                `}
                onClick={() => handleAmenityToggle(amenity.value)}
              >
                <input
                  type="checkbox"
                  id={`amenity-${amenity.value}`}
                  checked={formState.amenities.includes(amenity.value)}
                  onChange={() => {}} // Handled by onClick on parent div
                  className="sr-only"
                />
                <div className={`w-5 h-5 flex items-center justify-center rounded-md border ${
                  formState.amenities.includes(amenity.value)
                    ? 'bg-forest-600 text-white border-forest-600'
                    : 'border-gray-300'
                }`}>
                  {formState.amenities.includes(amenity.value) && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <label htmlFor={`amenity-${amenity.value}`} className="flex-1 cursor-pointer">
                  {amenity.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Image Upload */}
        <div>
          <h2 className="text-xl font-semibold text-forest-900 mb-4">Images</h2>
          
          <div className="mb-4">
            <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
              errors.images ? 'border-rose-300 bg-rose-50' : 'border-border bg-cream-50'
            }`}>
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
              />
              <label htmlFor="images" className="cursor-pointer">
                <div className="mx-auto flex justify-center">
                  <Upload className="h-12 w-12 text-forest-500" />
                </div>
                <p className="mt-2 text-sm text-forest-700">
                  Click to upload images (max 5)
                </p>
                <p className="mt-1 text-xs text-forest-500">
                  PNG, JPG, WEBP up to 10MB each
                </p>
              </label>
            </div>
            {errors.images && (
              <p className="mt-1 text-sm text-rose-600">{errors.images}</p>
            )}
          </div>
          
          {/* Image previews */}
          {imagePreview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {imagePreview.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <Image
                    src={src}
                    alt={`Property image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
                  >
                    <X size={16} className="text-rose-600" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-forest-700/70 text-white text-xs py-1 text-center">
                      Cover Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Publish Status */}
        <div>
          <h2 className="text-xl font-semibold text-forest-900 mb-4">Listing Status</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              name="is_published"
              checked={formState.is_published}
              onChange={(e) => setFormState({
                ...formState,
                is_published: e.target.checked
              })}
              className="h-5 w-5 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
            />
            <label htmlFor="is_published" className="text-sm font-medium text-forest-700">
              Publish listing (visible to guests)
            </label>
          </div>
          <p className="mt-1 text-sm text-forest-500">
            {formState.is_published 
              ? 'Your listing will be visible to guests once saved'
              : 'Your listing will be saved as a draft and won\'t be visible to guests'}
          </p>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => router.push('/en/host/listings')}
            className="px-6 py-3 rounded-2xl border border-forest-300 text-forest-700 hover:bg-forest-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isNew ? 'Create Listing' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
