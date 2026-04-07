"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutList, 
  MapPin, 
  Camera, 
  Euro, 
  CalendarCheck, 
  Calendar, 
  BedDouble, 
  AlignLeft, 
  Bike, 
  Leaf, 
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { uploadHouseImages, validateImageFile } from '@/lib/supabase-storage';
import { saveListingToDatabase, updateListingToDatabase } from '@/lib/supabase-listings';
import { getUserRole } from '@/lib/roles';
import { createClient } from '@/utils/supabase/client';

// Unified checkbox handler
const handleCheckboxToggle = (item: string, selectedItems: string[], setSelectedItems: (items: string[]) => void) => {
  setSelectedItems(
    selectedItems.includes(item)
      ? selectedItems.filter(i => i !== item)
      : [...selectedItems, item]
  );
};

// Unified checkbox component
const UnifiedCheckbox = ({ 
  checked, 
  onChange, 
  label, 
  className = "",
  disabled = false 
}: {
  checked: boolean;
  onChange: () => void;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => (
  <label className={`flex items-center gap-3 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
    <input 
      type="checkbox" 
      className="w-5 h-5 rounded border-gray-300 text-[#59A559] focus:ring-[#59A559]"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
    {label}
  </label>
);
import { useRouter } from 'next/navigation';

// Step definitions
const STEPS = [
  { id: 'general', label: 'General', icon: LayoutList },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'pricing', label: 'Pricing', icon: Euro },
  { id: 'availability', label: 'Availability', icon: CalendarCheck },
  // { id: 'calendar', label: 'Calendar', icon: Calendar },
  // { id: 'bedrooms', label: 'Bedrooms', icon: BedDouble },
  { id: 'description', label: 'Description', icon: AlignLeft },
  { id: 'stay_details', label: 'Stay details', icon: Bike },
  { id: 'sustainability', label: 'Sustainability', icon: Leaf },
  { id: 'house_rules', label: 'House rules', icon: ClipboardList },
];

export function ListingWizard({ mode = 'create', existingListing = null }: { mode?: 'create' | 'edit', existingListing?: any }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('general');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const [formData, setFormData] = useState(() => {
    if (mode === 'edit' && existingListing) {
      return {
        // General
        accommodationName: existingListing.accommodationName || '',
        type: existingListing.type || 'Cottage',
        maxPerson: existingListing.maxPerson || 1,
        livingSituation: existingListing.livingSituation || 'Detached',
        location: existingListing.location || '',
        plotSize: existingListing.plotSize || '',
        isNearNeighbors: existingListing.isNearNeighbors,
        registrationNumberOption: existingListing.registrationNumberOption || 'I don\'t have a registration number',
        registrationNumber: existingListing.registrationNumber || '',
        hasPublicTransport: existingListing.hasPublicTransport || false,

        // Location
        country: existingListing.country || 'Netherlands',
        region: existingListing.region || 'Drenthe',
        street: existingListing.street || '',
        number: existingListing.number || '',
        postalCode: existingListing.postalCode || '',
        place: existingListing.place || '',
        landRegistrationOption: existingListing.landRegistrationOption || '',

        // Photos
        images: existingListing.images || [],

        // Pricing
        pricePerNight: existingListing.pricePerNight || '',
        includedFacilities: existingListing.includedFacilities || ['Final cleaning', 'Bed linen', 'Bath towels', 'Kitchen linen', 'Water', 'Electricity'],
        safetyDeposit: existingListing.safetyDeposit || 'no_deposit',
        safetyDepositAmount: existingListing.safetyDepositAmount || '',
        longerStayPricing: existingListing.longerStayPricing || {
          weeklyPrice: '',
          monthlyPrice: '',
          weekendPrice: '',
          longWeekendPrice: '',
          weekdayPrice: '',
          weekPrice: ''
        },
        personPricing: existingListing.personPricing || {
          basePersons: 0,
          additionalPersonPrice: ''
        },
        extraCosts: existingListing.extraCosts || [],

        // Availability
        minNights: existingListing.minNights || 1,
        maxNights: existingListing.maxNights || 364,
        availabilityLimit: existingListing.availabilityLimit || '2_years',
        checkInFrom: existingListing.checkInFrom || '15:00',
        checkInUntil: existingListing.checkInUntil || '22:00',
        checkOutFrom: existingListing.checkOutFrom || '07:00',
        checkOutUntil: existingListing.checkOutUntil || '11:00',
        minBookingDays: existingListing.minBookingDays || 0,

        // Calendar Availability
        arrivalDays: existingListing.arrivalDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        departureDays: existingListing.departureDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

        // Description
        description: existingListing.description || '',
        surroundings: existingListing.surroundings || '',

        // Stay Details
        amenities: existingListing.amenities || [],

        // Sustainability
        energyLabel: existingListing.energyLabel || '',
        sustainability: existingListing.sustainability || {},

        // House Rules
        houseRules: existingListing.houseRules || {
          babies: 0,
          pets: 0,
          childAge: 0,
          bookingAge: 18,
          parties: null,
          smoking: null,
          fireworks: null,
          groups: null,
          waste: null,
          silenceStart: '',
          silenceEnd: '',
          customRules: []
        },

        // Rooms
        rooms: existingListing.rooms || []
      };
    }

    return {
      // General
      accommodationName: '',
      type: 'Cottage',
      maxPerson: 1,
      livingSituation: 'Detached',
      location: '',
      plotSize: '',
      isNearNeighbors: null as boolean | null,
      registrationNumberOption: 'I don\'t have a registration number',
      registrationNumber: '',
      hasPublicTransport: false,

      // Location
      country: 'Netherlands',
      region: 'Drenthe',
      street: '',
      number: '',
      postalCode: '',
      place: '',
      landRegistrationOption: '',

      // Photos
      images: [] as string[],

      // Pricing
      pricePerNight: '',
      includedFacilities: ['Final cleaning', 'Bed linen', 'Bath towels', 'Kitchen linen', 'Water', 'Electricity'] as string[],
      safetyDeposit: 'no_deposit',
      safetyDepositAmount: '',
      longerStayPricing: {
        weeklyPrice: '',
        monthlyPrice: '',
        weekendPrice: '',
        longWeekendPrice: '',
        weekdayPrice: '',
        weekPrice: ''
      },
      personPricing: {
        basePersons: 0,
        additionalPersonPrice: ''
      },
      extraCosts: [] as string[],

      // Availability
      minNights: 1,
      maxNights: 364,
      availabilityLimit: '2_years',
      checkInFrom: '15:00',
      checkInUntil: '22:00',
      checkOutFrom: '07:00',
      checkOutUntil: '11:00',
      minBookingDays: 0,

      // Calendar Availability
      arrivalDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as string[],
      departureDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as string[],

      // Description
      description: '',
      surroundings: '',

      // Stay Details
      amenities: [] as string[],

      // Sustainability
      energyLabel: '',
      sustainability: {} as Record<string, string>,

      // House Rules
      houseRules: {
        babies: 0,
        pets: 0,
        childAge: 0,
        bookingAge: 18,
        parties: null,
        smoking: null,
        fireworks: null,
        groups: null,
        waste: null,
        silenceStart: '',
        silenceEnd: '',
        customRules: [] as string[]
      },

      // Rooms
      rooms: [] as Array<{
        name: string;
        description?: string;
        room_type?: string;
        size_m2?: number;
        price_per_night?: string;
      }>
    };
  });

  const handleStepChange = (stepId: string) => {
    setCurrentStep(stepId);
  };

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'general':
        return <GeneralStep data={formData} updateData={setFormData} onNext={() => handleNext('general')} onPrevious={() => handlePrevious('general')} />;
      case 'location':
        return <LocationStep data={formData} updateData={setFormData} onNext={() => handleNext('location')} onPrevious={() => handlePrevious('location')} />;
      case 'photos':
        return <PhotosStep data={formData} updateData={setFormData} onNext={() => handleNext('photos')} onPrevious={() => handlePrevious('photos')} />;
      case 'pricing':
        return <PricingStep data={formData} updateData={setFormData} onNext={() => handleNext('pricing')} onPrevious={() => handlePrevious('pricing')} />;
      case 'availability':
        return <AvailabilityStep data={formData} updateData={setFormData} onNext={() => handleNext('availability')} onPrevious={() => handlePrevious('availability')} />;
      // case 'calendar':
      //   return <CalendarStep data={formData} updateData={setFormData} onNext={() => handleNext('calendar')} onPrevious={() => handlePrevious('calendar')} />;
      // case 'bedrooms':
      //   return <BedroomsStep data={formData} updateData={setFormData} onNext={() => handleNext('bedrooms')} onPrevious={() => handlePrevious('bedrooms')} />;
      case 'description':
        return <DescriptionStep data={formData} updateData={setFormData} onNext={() => handleNext('description')} onPrevious={() => handlePrevious('description')} />;
      case 'stay_details':
        return <StayDetailsStep data={formData} updateData={setFormData} onNext={() => handleNext('stay_details')} onPrevious={() => handlePrevious('stay_details')} />;
      case 'sustainability':
        return <SustainabilityStep data={formData} updateData={setFormData} onNext={() => handleNext('sustainability')} onPrevious={() => handlePrevious('sustainability')} />;
      case 'house_rules':
        return <HouseRulesStep data={formData} updateData={setFormData} onNext={() => handleNext('house_rules')} onPrevious={() => handlePrevious('house_rules')} mode={mode} existingListing={existingListing} onSave={handleSave} />;
      default:
        return <GeneralStep data={formData} updateData={setFormData} onNext={() => handleNext('general')} onPrevious={() => handlePrevious('general')} />;
    }
  };

  const handleNext = (currentStepId: string) => {
    markStepComplete(currentStepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStepId);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handlePrevious = (currentStepId: string) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSave = async () => {
    try {
      // Get current authenticated user
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('You must be logged in to save the listing');
        return;
      }

      const userId = user.id;
      const userRole = await getUserRole(userId);
      const redirectPath = userRole === 'admin' ? '/admin/listings' : '/account/listings';

      console.log("Form data:", formData);

      if (mode === 'edit' && existingListing) {
        // Update existing listing
        console.log('Updating listing:', existingListing.id, formData);
        const result = await updateListingToDatabase(existingListing.id, formData, userId);
        if (result.success) {
          alert('Listing updated successfully!');
          router.push(redirectPath);
        } else {
          alert(`Error updating listing: ${result.error}`);
        }
      } else {
        // Create new listing
        console.log('Creating new listing:', formData);
        const result = await saveListingToDatabase(formData, userId);
        if (result.success) {
          alert('Listing created successfully!');
          router.push(redirectPath);
        } else {
          alert(`Error creating listing: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F4E3]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#F8F4E3] border-r border-[#E5E5E5] sticky h-full overflow-y-auto hidden md:block">
        <div className="p-6">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-[#244224] hover:bg-white/50 mb-6"
          >
            <ChevronLeft size={18} className="text-gray-400" />
            <span>{mode === 'edit' ? 'Back to Listing' : 'Back to Account'}</span>
          </button>
          
          <div className="w-8 h-1 bg-[#244224] mb-8 rounded-full"></div>
          <nav className="space-y-1">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.includes(step.id);
              
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepChange(step.id)}
                  className={`
                    w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive ? 'text-[#244224] bg-white shadow-sm' : 'text-gray-500 hover:text-[#244224] hover:bg-white/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-[#244224]' : 'text-gray-400'} />
                    <span>{step.label}</span>
                  </div>
                  {isCompleted && !isActive && (
                    <CheckCircle size={14} className="text-green-600" />
                  )}
                  {!isCompleted && !isActive && (
                    <span className="text-rose-500 text-xs font-bold">⚠</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => router.push(mode === 'edit' ? `/host/edit/${existingListing?.id}` : '/en/account/landlord')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-[#244224] hover:bg-white/50"
          >
            <ChevronLeft size={16} className="text-gray-400" />
            <span>{mode === 'edit' ? 'Back to Listing' : 'Back to Account'}</span>
          </button>
        </div>
        
        <div className="mx-auto bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] p-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-[#1D331D]">
              {mode === 'edit' ? 'Edit Listing' : 'Create New Listing'}
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === 'edit' 
                ? 'Update your listing information below.' 
                : 'Fill in the details to create your new listing.'
              }
            </p>
          </div>
          
          {renderStepContent()}
        </div>
      </main>
    </div>
  );
}

// Temporary placeholder components for steps
function GeneralStep({ data, updateData, onNext, onPrevious }: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-serif text-[#1D331D]">General</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Accommodation name</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            placeholder="Enter accommodation name"
            value={data.accommodationName}
            onChange={(e) => updateData({...data, accommodationName: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Type</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
            value={data.type}
            onChange={(e) => updateData({...data, type: e.target.value})}
          >
            <option>Cottage</option>
            <option>Accommodation</option>
            <option>Bungalow</option>
            <option>Apartment</option>
            <option>Group accommodation</option>
            <option>Farm</option>
            <option>Country house</option>
            <option>Boat</option>
            <option>Villa</option>
            <option>Yurt</option>
            <option>Caravan</option>
            <option>Log cabin</option>
            <option>Tree house</option>
            <option>B&B</option>
            <option>Safaritent</option>
            <option>Tiny house</option>
            <option>Cabin</option>
            <option>Glamping</option>
            <option>Chalet</option>
            <option>Camping spot</option>
            <option>Wikkelhouse</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Max. person</label>
          <input 
            type="number" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            value={data.maxPerson || ''}
            onChange={(e) => updateData({...data, maxPerson: parseInt(e.target.value) || 0})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Living situation</label>
          <select 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
            value={data.livingSituation}
            onChange={(e) => updateData({...data, livingSituation: e.target.value})}
          >
            <option>Detached</option>
            <option>Semi-detached</option>
            <option>Part of house, no other guests</option>
            <option>Part of house, other guests possible</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#1D331D]">Location</label>
        <select 
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
          value={data.location}
          onChange={(e) => updateData({...data, location: e.target.value})}
        >
          <option value="">-- Select location --</option>
          <option value="isolated">Isolated</option>
          <option value="yard">On a yard</option>
          <option value="holiday_park">Small holiday park</option>
          <option value="estate">On an estate</option>
          <option value="island">On an island</option>
          <option value="village_center">Near the center of a village</option>
          <option value="village_edge">At the edge of a village</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
            Plot size around accommodation 
            <div className="relative group">
              <span 
                className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                  if (!tooltip || !arrow) return;
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const tooltipHeight = 80;
                  const spaceBelow = window.innerHeight - rect.bottom;
                  
                  if (spaceBelow < tooltipHeight + 10) {
                    tooltip.style.top = 'auto';
                    tooltip.style.bottom = '100%';
                    tooltip.style.marginBottom = '8px';
                    tooltip.style.marginTop = '0';
                    arrow.style.borderTopColor = '#1f2937';
                    arrow.style.borderBottomColor = 'transparent';
                    arrow.style.top = '100%';
                    arrow.style.bottom = 'auto';
                    arrow.style.marginTop = '-1px';
                    arrow.style.marginBottom = '0';
                  } else {
                    tooltip.style.top = '100%';
                    tooltip.style.bottom = 'auto';
                    tooltip.style.marginTop = '8px';
                    tooltip.style.marginBottom = '0';
                    arrow.style.borderBottomColor = '#1f2937';
                    arrow.style.borderTopColor = 'transparent';
                    arrow.style.bottom = '100%';
                    arrow.style.top = 'auto';
                    arrow.style.marginBottom = '-1px';
                    arrow.style.marginTop = '0';
                  }
                }}
              >ⓘ</span>
              <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
                <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
                The amount of square meters of your plot.
              </div>
            </div>
          </label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            placeholder="Enter plot size in square meters"
            value={data.plotSize}
            onChange={(e) => updateData({...data, plotSize: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
            Is your house closer than 10m from the nearest neighbour? (Door to door)
          </label>
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="neighbors"
                className="w-5 h-5 text-[#59A559] focus:ring-2 focus:ring-[#59A559]/20 transition-all duration-200 group-hover:scale-110"
                checked={data.isNearNeighbors === true}
                onChange={() => updateData({...data, isNearNeighbors: true})}
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="neighbors"
                className="w-5 h-5 text-[#59A559] focus:ring-2 focus:ring-[#59A559]/20 transition-all duration-200 group-hover:scale-110"
                checked={data.isNearNeighbors === false}
                onChange={() => updateData({...data, isNearNeighbors: false})}
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">No</span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
            Registration number 
            <div className="relative group">
              <span 
                className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
                onMouseEnter={(e) => {
                  const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                  const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                  if (!tooltip || !arrow) return;
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const tooltipHeight = 120;
                  const spaceBelow = window.innerHeight - rect.bottom;
                  
                  if (spaceBelow < tooltipHeight + 10) {
                    tooltip.style.top = 'auto';
                    tooltip.style.bottom = '100%';
                    tooltip.style.marginBottom = '8px';
                    tooltip.style.marginTop = '0';
                    arrow.style.borderTopColor = '#1f2937';
                    arrow.style.borderBottomColor = 'transparent';
                    arrow.style.top = '100%';
                    arrow.style.bottom = 'auto';
                    arrow.style.marginTop = '-1px';
                    arrow.style.marginBottom = '0';
                  } else {
                    tooltip.style.top = '100%';
                    tooltip.style.bottom = 'auto';
                    tooltip.style.marginTop = '8px';
                    tooltip.style.marginBottom = '0';
                    arrow.style.borderBottomColor = '#1f2937';
                    arrow.style.borderTopColor = 'transparent';
                    arrow.style.bottom = '100%';
                    arrow.style.top = 'auto';
                    arrow.style.marginBottom = '-1px';
                    arrow.style.marginTop = '0';
                  }
                }}
              >ⓘ</span>
              <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
                <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
                In certain cities, regions or countries it is mandatory to have a registration number when renting your accommodation. You receive this number from your government.
              </div>
            </div>
          </label>
          <select 
            suppressHydrationWarning
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none bg-white"
            value={data.registrationNumberOption}
            onChange={(e) => updateData({...data, registrationNumberOption: e.target.value})}
          >
            <option>I don't have a registration number</option>
            <option>I have a registration number</option>
            <option>I have an exemption for the registration number</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Registration number</label>
          <input 
            suppressHydrationWarning
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-gray-400 disabled:hover:shadow-none disabled:focus:scale-100"
            placeholder="Enter registration number"
            disabled={data.registrationNumberOption !== 'I have a registration number'}
            value={data.registrationNumber}
            onChange={(e) => updateData({...data, registrationNumber: e.target.value})}
          />
        </div>
      </div>

      <div className="pt-4">
        <UnifiedCheckbox
          checked={data.hasPublicTransport}
          onChange={() => updateData({...data, hasPublicTransport: !data.hasPublicTransport})}
          label={<span className="text-gray-700">There is a public transport opportunity at a maximum of one km from the naturehouse</span>}
          className="items-start"
        />
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          disabled
          suppressHydrationWarning
          className="bg-gray-100 text-gray-400 px-8 py-3 rounded-lg font-medium cursor-not-allowed flex items-center gap-2"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          suppressHydrationWarning
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors flex items-center gap-2"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function LocationStep({ data, updateData, onNext, onPrevious }: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-serif text-[#1D331D]">Location</h2>
      <p className="text-xl font-serif text-[#1D331D] italic">Where is your nature house located?</p>
      
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#1D331D]">Country</label>
        <select 
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
          value={data.country}
          onChange={(e) => {
            const newCountry = e.target.value;
            const defaultRegions: { [key: string]: string } = {
              'Netherlands': 'Drenthe',
              'Belgium': 'Flanders',
              'Germany': 'Bavaria',
              'France': 'Île-de-France',
              'India': 'Maharashtra'
            };
            updateData({...data, country: newCountry, region: defaultRegions[newCountry] || 'Drenthe'});
          }}
        >
          <option>Netherlands</option>
          <option>Belgium</option>
          <option>Germany</option>
          <option>France</option>
          <option>India</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#1D331D]">Region</label>
        <select 
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
          value={data.region}
          onChange={(e) => updateData({...data, region: e.target.value})}
        >
          {/* Netherlands Regions */}
          {data.country === 'Netherlands' && (
            <>
              <option>Drenthe</option>
              <option>Friesland</option>
              <option>Groningen</option>
              <option>Flevoland</option>
              <option>Gelderland</option>
              <option>Limburg</option>
              <option>Noord-Brabant</option>
              <option>Noord-Holland</option>
              <option>Overijssel</option>
              <option>Utrecht</option>
              <option>Zeeland</option>
              <option>Zuid-Holland</option>
            </>
          )}
          
          {/* Indian States */}
          {data.country === 'India' && (
            <>
              <option>Andhra Pradesh</option>
              <option>Arunachal Pradesh</option>
              <option>Assam</option>
              <option>Bihar</option>
              <option>Chhattisgarh</option>
              <option>Goa</option>
              <option>Gujarat</option>
              <option>Haryana</option>
              <option>Himachal Pradesh</option>
              <option>Jharkhand</option>
              <option>Karnataka</option>
              <option>Kerala</option>
              <option>Madhya Pradesh</option>
              <option>Maharashtra</option>
              <option>Manipur</option>
              <option>Meghalaya</option>
              <option>Mizoram</option>
              <option>Nagaland</option>
              <option>Odisha</option>
              <option>Punjab</option>
              <option>Rajasthan</option>
              <option>Sikkim</option>
              <option>Tamil Nadu</option>
              <option>Telangana</option>
              <option>Tripura</option>
              <option>Uttar Pradesh</option>
              <option>Uttarakhand</option>
              <option>West Bengal</option>
              <option>Delhi</option>
              <option>Jammu and Kashmir</option>
              <option>Ladakh</option>
            </>
          )}
          
          {/* Belgium Regions */}
          {data.country === 'Belgium' && (
            <>
              <option>Flanders</option>
              <option>Wallonia</option>
              <option>Brussels</option>
            </>
          )}
          
          {/* Germany Regions */}
          {data.country === 'Germany' && (
            <>
              <option>Bavaria</option>
              <option>Baden-Württemberg</option>
              <option>North Rhine-Westphalia</option>
              <option>Hesse</option>
              <option>Saxony</option>
              <option>Lower Saxony</option>
            </>
          )}
          
          {/* France Regions */}
          {data.country === 'France' && (
            <>
              <option>Île-de-France</option>
              <option>Provence-Alpes-Côte d'Azur</option>
              <option>Auvergne-Rhône-Alpes</option>
              <option>Nouvelle-Aquitaine</option>
              <option>Occitanie</option>
              <option>Brittany</option>
            </>
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Street</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            placeholder="Enter street name"
            value={data.street}
            onChange={(e) => updateData({...data, street: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Number</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            placeholder="Enter house number"
            value={data.number}
            onChange={(e) => updateData({...data, number: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Postal code</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            placeholder="Enter postal code"
            value={data.postalCode}
            onChange={(e) => updateData({...data, postalCode: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-bold text-[#1D331D]">Place</label>
          <input 
            type="text" 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            placeholder="Enter city/place"
            value={data.place}
            onChange={(e) => updateData({...data, place: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
          Land registration number 
          <div className="relative group">
            <span 
              className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
              onMouseEnter={(e) => {
                const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                if (!tooltip || !arrow) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const tooltipHeight = 120;
                const spaceBelow = window.innerHeight - rect.bottom;
                
                if (spaceBelow < tooltipHeight + 10) {
                  tooltip.style.top = 'auto';
                  tooltip.style.bottom = '100%';
                  tooltip.style.marginBottom = '8px';
                  tooltip.style.marginTop = '0';
                  arrow.style.borderTopColor = '#1f2937';
                  arrow.style.borderBottomColor = 'transparent';
                  arrow.style.top = '100%';
                  arrow.style.bottom = 'auto';
                  arrow.style.marginTop = '-1px';
                  arrow.style.marginBottom = '0';
                } else {
                  tooltip.style.top = '100%';
                  tooltip.style.bottom = 'auto';
                  tooltip.style.marginTop = '8px';
                  tooltip.style.marginBottom = '0';
                  arrow.style.borderBottomColor = '#1f2937';
                  arrow.style.borderTopColor = 'transparent';
                  arrow.style.bottom = '100%';
                  arrow.style.top = 'auto';
                  arrow.style.marginBottom = '-1px';
                  arrow.style.marginTop = '0';
                }
              }}
            >ⓘ</span>
            <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
              <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
              The land registration number is needed to complete the information on activities of nature houses.
            </div>
          </div>
        </label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="landRegistration"
              className="w-5 h-5 text-[#59A559] focus:ring-2 focus:ring-[#59A559]/20 transition-all duration-200 group-hover:scale-110"
              value="available"
              checked={data.landRegistrationOption === 'available'}
              onChange={(e) => updateData({...data, landRegistrationOption: e.target.value})}
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">Yes, I have a land registration number</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="landRegistration"
              className="w-5 h-5 text-[#59A559] focus:ring-2 focus:ring-[#59A559]/20 transition-all duration-200 group-hover:scale-110"
              value="not_applicable"
              checked={data.landRegistrationOption === 'not_applicable'}
              onChange={(e) => updateData({...data, landRegistrationOption: e.target.value})}
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">No, not applicable</span>
          </label>
        </div>
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors flex items-center gap-2"
        >
          Next
        </button>
      </div>
    </div>
  );
}

const FACILITIES_DATA = {
  'Basic facilities': ['Final cleaning', 'Bed linen', 'Bath towels', 'Kitchen linen', 'Tourist tax'],
  'Utilities': ['Electricity', 'Gas', 'Water', 'Energy costs', 'Wood', 'Internet'],
  'Services': ['Pet', 'Bicycle rental', 'Breakfast', 'Meal service', "Children's cot", 'High chair', 'Washing machine', 'Tumble dryer', 'Hot tub', 'Jacuzzi', 'Sauna', 'Luxury check-in wellness', 'Other costs'],
};

function FacilitiesModal({ isOpen, onClose, selected, onUpdate }: any) {
  const [localSelected, setLocalSelected] = useState(selected);
  const [prices, setPrices] = useState<{ [key: string]: string }>({});

  // Sync with parent state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalSelected(selected);
    }
  }, [isOpen, selected]);

  if (!isOpen) return null;

  const handleToggle = (facility: string) => {
    if (localSelected.includes(facility)) {
      setLocalSelected(localSelected.filter((f: string) => f !== facility));
      // Clear price when deselected
      setPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[facility];
        return newPrices;
      });
    } else {
      setLocalSelected([...localSelected, facility]);
    }
  };

  const handlePriceChange = (facility: string, price: string) => {
    setPrices(prev => ({ ...prev, [facility]: price }));
  };

  const handleSave = () => {
    onUpdate(localSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-serif text-[#1D331D]">Included in the price</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          {Object.entries(FACILITIES_DATA).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-bold text-lg text-[#1D331D] mb-3">{category}</h4>
              <div className="space-y-3">
                {items.map((item) => {
                  const needsPrice = item === 'Pet' || item === "Children's cot";
                  const isSelected = localSelected.includes(item);
                  
                  return (
                    <div key={item} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <UnifiedCheckbox
                          checked={isSelected}
                          onChange={() => handleToggle(item)}
                          label={<span>{item}</span>}
                        />
                        {needsPrice && isSelected && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm text-gray-600">Price:</span>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                className="w-24 pl-7 pr-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559]"
                                value={prices[item] || ''}
                                onChange={(e) => handlePriceChange(item, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <span className="text-sm text-gray-600">per stay</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-[#5b2d8e] text-white font-medium hover:bg-[#4a2475]">Add</button>
        </div>
      </div>
    </div>
  );
}

function ExtraCostsModal({ isOpen, onClose, selected, onUpdate }: any) {
  const [localSelected, setLocalSelected] = useState(selected);

  // Sync with parent state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalSelected(selected);
    }
  }, [isOpen, selected]);

  if (!isOpen) return null;

  const handleToggle = (cost: string) => {
    if (localSelected.includes(cost)) {
      setLocalSelected(localSelected.filter((c: string) => c !== cost));
    } else {
      setLocalSelected([...localSelected, cost]);
    }
  };

  const handleSave = () => {
    onUpdate(localSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-serif text-[#1D331D]">Add extra costs</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          {Object.entries(FACILITIES_DATA).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-bold text-lg text-[#1D331D] mb-3">{category}</h4>
              <div className="space-y-3">
                {items.map((item) => (
                  <UnifiedCheckbox
                    key={item}
                    checked={localSelected.includes(item)}
                    onChange={() => handleToggle(item)}
                    label={<span>{item}</span>}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-[#5b2d8e] text-white font-medium hover:bg-[#4a2475]">Add</button>
        </div>
      </div>
    </div>
  );
}

function PhotosStep({ data, updateData, onNext, onPrevious }: any) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      filesArray.forEach((file) => {
        const validation = validateImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreviews((prevPreviews) => [...prevPreviews, reader.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
      setUploadErrors((prevErrors) => [...prevErrors, ...errors]);
    }
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      const filesArray = Array.from(event.dataTransfer.files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      filesArray.forEach((file) => {
        const validation = validateImageFile(file);
        if (validation.valid) {
          validFiles.push(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreviews((prevPreviews) => [...prevPreviews, reader.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      });

      setSelectedFiles((prevFiles) => [...prevFiles, ...validFiles]);
      setUploadErrors((prevErrors) => [...prevErrors, ...errors]);
    }
  }, []);

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) {
      setUploadErrors(['Please select at least one image']);
      return;
    }

    setUploading(true);
    setUploadErrors([]);

    try {
      // Get current authenticated user
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setUploadErrors(['You must be logged in to upload images']);
        return;
      }
      
      console.log('Uploading images for user:', user.id);

      // For now, we'll use a temporary house ID
      // In a real implementation, you'd get this from the form or create the house first
      const tempHouseId = 'temp-' + Date.now();
      const userId = user.id;

      const results = await uploadHouseImages(selectedFiles, tempHouseId, userId);
      
      const successfulUploads = results.filter(result => !result.error);
      const failedUploads = results.filter(result => result.error);

      if (successfulUploads.length > 0) {
        // Update form data with uploaded image URLs
        const imageUrls = successfulUploads.map(result => result.url);
        updateData({ ...data, images: [...data.images, ...imageUrls] });
        
        // Clear selected files after successful upload
        setSelectedFiles([]);
        setImagePreviews([]);
        
        // Show success message
        alert(`Successfully uploaded ${successfulUploads.length} image(s)!`);
      }

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error!);
        setUploadErrors(errorMessages);
      }
    } catch (error) {
      setUploadErrors(['Upload failed. Please try again.']);
    } finally {
      setUploading(false);
    }
  };

  const handleClickUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-serif text-[#1D331D]">Photos</h2>
      <p className="text-xl font-serif text-[#1D331D] italic">Add photos of your nature house</p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-blue-900">Photo requirements:</p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Include at least 10 photos</li>
          <li>Show the exterior of the nature cottage</li>
          <li>Display interior rooms and amenities</li>
          <li>Include surroundings and nature areas</li>
          <li>No logos or watermarks on photos</li>
        </ul>
        <a href="#" className="text-sm text-blue-600 underline hover:text-blue-800">Read more tips on adding photos here</a>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-bold text-[#1D331D]">
          Photos ({selectedFiles.length} selected)
        </label>
        
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClickUpload}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-gray-500">
            <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">Click to upload or drag and drop</p>
            <p className="text-sm mt-2">PNG, JPG, GIF up to 10MB each</p>
          </div>
        </div>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Selected Photos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
              
              {/* Add More Photos Button */}
              <div 
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={handleClickUpload}
              >
                <div className="text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Add more</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Images */}
        {data.images.length > 0 && imagePreviews.length === 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Uploaded Photos ({data.images.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.images.map((imageUrl: string, index: number) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imageUrl}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newImages = data.images.filter((_: any, i: number) => i !== index);
                      updateData({ ...data, images: newImages });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
              
              {/* Add More Photos Button */}
              <div 
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={handleClickUpload}
              >
                <div className="text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Add more</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Upload Errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2">Upload Errors:</h4>
          <ul className="text-red-600 text-sm space-y-1">
            {uploadErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
        >
          Previous
        </button>
        <div className="flex gap-3">
          {selectedFiles.length > 0 && (
            <button 
              onClick={handleUploadImages}
              disabled={uploading}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Photo' : 'Photos'}
                </>
              )}
            </button>
          )}
          <button 
            onClick={onNext}
            className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors flex items-center gap-2"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingStep({ data, updateData, onNext, onPrevious }: any) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isExtraCostsModalOpen, setIsExtraCostsModalOpen] = useState(false);

  const handleRemoveFacility = (facility: string) => {
    updateData({ ...data, includedFacilities: data.includedFacilities.filter((f: string) => f !== facility) });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-[#1D331D]">Pricing</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-300 bg-purple-50 text-purple-700 hover:border-purple-400 hover:bg-purple-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
          <span className="font-bold text-lg">:</span>
          <span>More</span>
        </button>
      </div>
      <h2 className="text-2xl font-serif text-[#1D331D]">Base price</h2>
      
      <div className="text-gray-600">
        <p>In the rates, you set the base price and extra costs for a stay. Later, you can set prices for specific periods in the calendar. <a href="#" className="text-[#5b2d8e] underline">Learn more about setting your prices.</a></p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#1D331D]">Price per night</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
          <input 
            type="number" 
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
            value={data.pricePerNight || ''}
            onChange={(e) => updateData({...data, pricePerNight: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-bold text-[#1D331D]">Included in the price</label>
        <div className="flex flex-wrap gap-3">
          {data.includedFacilities.map((item: string, idx: number) => (
            <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700">
              {item}
              <button onClick={() => handleRemoveFacility(item)} className="text-gray-400 hover:text-gray-600">×</button>
            </span>
          ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#EFEFEF] text-[#1D331D] px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
          + Add facilities
        </button>
        <FacilitiesModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          selected={data.includedFacilities}
          onUpdate={(newFacilities: string[]) => updateData({...data, includedFacilities: newFacilities})}
        />
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-lg font-bold text-[#1D331D] mb-2">Safety deposit</label>
          <p className="text-sm text-gray-600 mb-6">Choose how you'd like to handle security deposits for your property</p>
        </div>
        
        <div className="space-y-4">
          {/* No Deposit Option */}
          <div className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
            data.safetyDeposit === 'no_deposit' 
              ? 'border-[#59A559] bg-[#59A559]/5 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input 
                  type="radio" 
                  name="safetyDeposit"
                  value="no_deposit"
                  checked={data.safetyDeposit === 'no_deposit'}
                  onChange={(e) => updateData({...data, safetyDeposit: e.target.value})}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                  data.safetyDeposit === 'no_deposit' 
                    ? 'border-[#59A559] bg-[#59A559]' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {data.safetyDeposit === 'no_deposit' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <span className="font-semibold text-[#1D331D] text-base">No deposit</span>
                <p className="text-sm text-gray-600 mt-1">Guests don't need to pay a security deposit</p>
              </div>
            </label>
          </div>

          {/* Pay Upon Booking Option */}
          <div className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
            data.safetyDeposit === 'pay_upon_booking' 
              ? 'border-[#59A559] bg-[#59A559]/5 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input 
                  type="radio" 
                  name="safetyDeposit"
                  value="pay_upon_booking"
                  checked={data.safetyDeposit === 'pay_upon_booking'}
                  onChange={(e) => updateData({...data, safetyDeposit: e.target.value})}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                  data.safetyDeposit === 'pay_upon_booking' 
                    ? 'border-[#59A559] bg-[#59A559]' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {data.safetyDeposit === 'pay_upon_booking' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <span className="font-semibold text-[#1D331D] text-base">Pay upon booking</span>
                <p className="text-sm text-gray-600 mt-1">Guests pay the deposit when they make their reservation</p>
              </div>
            </label>
            
            {data.safetyDeposit === 'pay_upon_booking' && (
              <div className="mt-4 pl-10">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Deposit amount:</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-32 pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white shadow-sm"
                      value={data.safetyDepositAmount || ''}
                      onChange={(e) => updateData({...data, safetyDepositAmount: e.target.value})}
                    />
                  </div>
                  <span className="text-sm text-gray-500">per stay</span>
                </div>
              </div>
            )}
          </div>

          {/* Pay On Site Option */}
          <div className={`relative border-2 rounded-xl p-4 transition-all cursor-pointer ${
            data.safetyDeposit === 'pay_on_site' 
              ? 'border-[#59A559] bg-[#59A559]/5 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}>
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input 
                  type="radio" 
                  name="safetyDeposit"
                  value="pay_on_site"
                  checked={data.safetyDeposit === 'pay_on_site'}
                  onChange={(e) => updateData({...data, safetyDeposit: e.target.value})}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                  data.safetyDeposit === 'pay_on_site' 
                    ? 'border-[#59A559] bg-[#59A559]' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {data.safetyDeposit === 'pay_on_site' && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <span className="font-semibold text-[#1D331D] text-base">Pay on site</span>
                <p className="text-sm text-gray-600 mt-1">Guests pay the deposit when they arrive at your property</p>
              </div>
            </label>
            
            {data.safetyDeposit === 'pay_on_site' && (
              <div className="mt-4 pl-10">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Deposit amount:</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-32 pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white shadow-sm"
                      value={data.safetyDepositAmount || ''}
                      onChange={(e) => updateData({...data, safetyDepositAmount: e.target.value})}
                    />
                  </div>
                  <span className="text-sm text-gray-500">per stay</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Different prices for longer stays */}
        <div className={`border-2 rounded-xl transition-all ${
          expandedSection === 'longer_stays' 
            ? 'border-[#59A559] bg-[#59A559]/5 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('longer_stays')}
          >
            <div>
              <h3 className="font-serif text-xl text-[#1D331D]">Different prices for longer stays</h3>
              <p className="text-sm text-gray-500 mt-1">For certain periods you can set different rates. The rate for a week will also apply to multiple weeks.</p>
            </div>
            <ChevronRight className={`text-gray-400 transition-transform ${
              expandedSection === 'longer_stays' ? 'rotate-90' : ''
            }`} />
          </div>
          
          {expandedSection === 'longer_stays' && (
            <div className="px-4 pb-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
                    Total price weekend 
                    <div className="relative group">
                      <span 
                        className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                          const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                          if (!tooltip || !arrow) return;
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipHeight = 80;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          
                          if (spaceBelow < tooltipHeight + 10) {
                            tooltip.style.top = 'auto';
                            tooltip.style.bottom = '100%';
                            tooltip.style.marginBottom = '8px';
                            tooltip.style.marginTop = '0';
                            arrow.style.borderTopColor = '#1f2937';
                            arrow.style.borderBottomColor = 'transparent';
                            arrow.style.top = '100%';
                            arrow.style.bottom = 'auto';
                            arrow.style.marginTop = '-1px';
                            arrow.style.marginBottom = '0';
                          } else {
                            tooltip.style.top = '100%';
                            tooltip.style.bottom = 'auto';
                            tooltip.style.marginTop = '8px';
                            tooltip.style.marginBottom = '0';
                            arrow.style.borderBottomColor = '#1f2937';
                            arrow.style.borderTopColor = 'transparent';
                            arrow.style.bottom = '100%';
                            arrow.style.top = 'auto';
                            arrow.style.marginBottom = '-1px';
                            arrow.style.marginTop = '0';
                          }
                        }}
                      >ⓘ</span>
                      <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
                        <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                        Set the total price for weekend stays (Friday to Sunday).
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white"
                      value={data.longerStayPricing.weekendPrice || ''}
                      onChange={(e) => updateData({
                        ...data, 
                        longerStayPricing: {
                          ...data.longerStayPricing, 
                          weekendPrice: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
                    Total price long weekend 
                    <div className="relative group">
                      <span 
                        className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                          const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                          if (!tooltip || !arrow) return;
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipHeight = 80;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          
                          if (spaceBelow < tooltipHeight + 10) {
                            tooltip.style.top = 'auto';
                            tooltip.style.bottom = '100%';
                            tooltip.style.marginBottom = '8px';
                            tooltip.style.marginTop = '0';
                            arrow.style.borderTopColor = '#1f2937';
                            arrow.style.borderBottomColor = 'transparent';
                            arrow.style.top = '100%';
                            arrow.style.bottom = 'auto';
                            arrow.style.marginTop = '-1px';
                            arrow.style.marginBottom = '0';
                          } else {
                            tooltip.style.top = '100%';
                            tooltip.style.bottom = 'auto';
                            tooltip.style.marginTop = '8px';
                            tooltip.style.marginBottom = '0';
                            arrow.style.borderBottomColor = '#1f2937';
                            arrow.style.borderTopColor = 'transparent';
                            arrow.style.bottom = '100%';
                            arrow.style.top = 'auto';
                            arrow.style.marginBottom = '-1px';
                            arrow.style.marginTop = '0';
                          }
                        }}
                      >ⓘ</span>
                      <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
                        <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                        Set the total price for long weekend stays (Friday to Monday).
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white"
                      value={data.longerStayPricing.longWeekendPrice || ''}
                      onChange={(e) => updateData({
                        ...data, 
                        longerStayPricing: {
                          ...data.longerStayPricing, 
                          longWeekendPrice: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
                    Total price during the week 
                    <div className="relative group">
                      <span 
                        className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                          const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                          if (!tooltip || !arrow) return;
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipHeight = 80;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          
                          if (spaceBelow < tooltipHeight + 10) {
                            tooltip.style.top = 'auto';
                            tooltip.style.bottom = '100%';
                            tooltip.style.marginBottom = '8px';
                            tooltip.style.marginTop = '0';
                            arrow.style.borderTopColor = '#1f2937';
                            arrow.style.borderBottomColor = 'transparent';
                            arrow.style.top = '100%';
                            arrow.style.bottom = 'auto';
                            arrow.style.marginTop = '-1px';
                            arrow.style.marginBottom = '0';
                          } else {
                            tooltip.style.top = '100%';
                            tooltip.style.bottom = 'auto';
                            tooltip.style.marginTop = '8px';
                            tooltip.style.marginBottom = '0';
                            arrow.style.borderBottomColor = '#1f2937';
                            arrow.style.borderTopColor = 'transparent';
                            arrow.style.bottom = '100%';
                            arrow.style.top = 'auto';
                            arrow.style.marginBottom = '-1px';
                            arrow.style.marginTop = '0';
                          }
                        }}
                      >ⓘ</span>
                      <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
                        <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                        Set the total price for weekday stays (Monday to Thursday).
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white"
                      value={data.longerStayPricing.weekdayPrice || ''}
                      onChange={(e) => updateData({
                        ...data, 
                        longerStayPricing: {
                          ...data.longerStayPricing, 
                          weekdayPrice: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1D331D] flex items-center gap-2">
                    Total price week 
                    <div className="relative group">
                      <span 
                        className="text-gray-400 cursor-help transition-colors hover:text-gray-600"
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                          const arrow = tooltip?.querySelector('.arrow') as HTMLElement;
                          if (!tooltip || !arrow) return;
                          
                          const rect = e.currentTarget.getBoundingClientRect();
                          const tooltipHeight = 80;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          
                          if (spaceBelow < tooltipHeight + 10) {
                            tooltip.style.top = 'auto';
                            tooltip.style.bottom = '100%';
                            tooltip.style.marginBottom = '8px';
                            tooltip.style.marginTop = '0';
                            arrow.style.borderTopColor = '#1f2937';
                            arrow.style.borderBottomColor = 'transparent';
                            arrow.style.top = '100%';
                            arrow.style.bottom = 'auto';
                            arrow.style.marginTop = '-1px';
                            arrow.style.marginBottom = '0';
                          } else {
                            tooltip.style.top = '100%';
                            tooltip.style.bottom = 'auto';
                            tooltip.style.marginTop = '8px';
                            tooltip.style.marginBottom = '0';
                            arrow.style.borderBottomColor = '#1f2937';
                            arrow.style.borderTopColor = 'transparent';
                            arrow.style.bottom = '100%';
                            arrow.style.top = 'auto';
                            arrow.style.marginBottom = '-1px';
                            arrow.style.marginTop = '0';
                          }
                        }}
                      >ⓘ</span>
                      <div className="absolute right-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform scale-95 group-hover:scale-100 z-10 w-64 shadow-lg p-3 bg-gray-900 text-white text-sm rounded-lg">
                        <div className="arrow absolute right-4 bottom-full -mb-1 transition-all duration-200">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                        Set the total price for full week stays (7 nights).
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white"
                      value={data.longerStayPricing.weekPrice || ''}
                      onChange={(e) => updateData({
                        ...data, 
                        longerStayPricing: {
                          ...data.longerStayPricing, 
                          weekPrice: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Different price for number of people */}
        <div className={`border-2 rounded-xl transition-all ${
          expandedSection === 'person_pricing' 
            ? 'border-[#59A559] bg-[#59A559]/5 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('person_pricing')}
          >
            <div>
              <h3 className="font-serif text-xl text-[#1D331D]">Different price for number of people</h3>
              <p className="text-sm text-gray-500 mt-1">Enter a different price for extra persons</p>
            </div>
            <ChevronRight className={`text-gray-400 transition-transform ${
              expandedSection === 'person_pricing' ? 'rotate-90' : ''
            }`} />
          </div>
          
          {expandedSection === 'person_pricing' && (
            <div className="px-4 pb-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1D331D]">Number of persons within the base price</label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
                    <button 
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#5b2d8e]"
                      onClick={() => updateData({
                        ...data, 
                        personPricing: {
                          ...data.personPricing, 
                          basePersons: Math.max(0, data.personPricing.basePersons - 1)
                        }
                      })}
                    >-</button>
                    <span className="w-8 text-center font-medium">{data.personPricing.basePersons}</span>
                    <button 
                      className="w-8 h-8 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#5b2d8e] hover:bg-[#e0d0f0]"
                      onClick={() => updateData({
                        ...data, 
                        personPricing: {
                          ...data.personPricing, 
                          basePersons: data.personPricing.basePersons + 1
                        }
                      })}
                    >+</button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1D331D]">Price per additional person per night</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white"
                      value={data.personPricing.additionalPersonPrice || ''}
                      onChange={(e) => updateData({
                        ...data, 
                        personPricing: {
                          ...data.personPricing, 
                          additionalPersonPrice: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Extra costs */}
        <div className={`border-2 rounded-xl transition-all ${
          expandedSection === 'extra_costs' 
            ? 'border-[#59A559] bg-[#59A559]/5 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}>
          <div 
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('extra_costs')}
          >
            <div>
              <h3 className="font-serif text-xl text-[#1D331D]">Extra costs</h3>
              <p className="text-sm text-gray-500 mt-1">Indicate below, which additional costs you charge for a stay in your nature house.</p>
            </div>
            <ChevronRight className={`text-gray-400 transition-transform ${
              expandedSection === 'extra_costs' ? 'rotate-90' : ''
            }`} />
          </div>
          
          {expandedSection === 'extra_costs' && (
            <div className="px-4 pb-4 border-t border-gray-200">
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.extraCosts.map((cost: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 bg-white text-gray-700 text-sm">
                      {cost}
                      <button 
                        onClick={() => updateData({ 
                          ...data, 
                          extraCosts: data.extraCosts.filter((c: string) => c !== cost) 
                        })}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => setIsExtraCostsModalOpen(true)}
                  className="bg-[#EFEFEF] text-[#1D331D] px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  + Add amenities
                </button>
                <ExtraCostsModal 
                  isOpen={isExtraCostsModalOpen} 
                  onClose={() => setIsExtraCostsModalOpen(false)} 
                  selected={data.extraCosts}
                  onUpdate={(newCosts: string[]) => updateData({...data, extraCosts: newCosts})}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function AvailabilityStep({ data, updateData, onNext, onPrevious }: any) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);

  const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const TimePicker = ({ value, onChange, label, fieldKey }: { value: string, onChange: (val: string) => void, label: string, fieldKey: string }) => {
    const [currentHour, currentMinute] = value.split(':');
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setShowTimePicker(null);
        }
      };

      if (showTimePicker === fieldKey) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showTimePicker, fieldKey]);
    
    return (
      <div className="relative" ref={pickerRef}>
        <div 
          className="w-full px-3 py-2 rounded-xl border-2 border-gray-400 bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md cursor-pointer flex items-center justify-between"
          onClick={() => setShowTimePicker(showTimePicker === fieldKey ? null : fieldKey)}
        >
          <span className="text-gray-700">{value}</span>
          <span className="text-gray-400">🕒</span>
        </div>
        
        {showTimePicker === fieldKey && (
          <div className="absolute top-full mt-2 bg-white border-2 border-gray-400 rounded-xl shadow-lg p-4 z-20 min-w-[200px]">
            <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Hour</div>
                <div className="grid grid-cols-6 gap-1 max-h-32 overflow-y-auto">
                  {hours.map(hour => (
                    <button
                      key={hour}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        currentHour === hour 
                          ? 'bg-[#59A559] text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => onChange(`${hour}:${currentMinute}`)}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Minute</div>
                <div className="grid grid-cols-4 gap-1">
                  {minutes.map(minute => (
                    <button
                      key={minute}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        currentMinute === minute 
                          ? 'bg-[#59A559] text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => onChange(`${currentHour}:${minute}`)}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <h2 className="text-3xl font-serif text-[#1D331D]">Availability</h2>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-serif text-[#1D331D]">Length of stay</h2>
        <p className="text-gray-600">What is the minimum and maximum number of nights of a stay?</p>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
              <button 
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#5b2d8e]"
                onClick={() => updateData({...data, minNights: Math.max(1, data.minNights - 1)})}
                disabled={data.minNights <= 1}
              >-</button>
              <span className="w-8 text-center font-medium">{data.minNights}</span>
              <button 
                className="w-8 h-8 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#5b2d8e] hover:bg-[#e0d0f0]"
                onClick={() => updateData({...data, minNights: Math.min(364, data.minNights + 1)})}
                disabled={data.minNights >= 364}
              >+</button>
            </div>
            <span className="text-gray-700">night minimal</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
              <button 
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#5b2d8e]"
                onClick={() => updateData({...data, maxNights: Math.max(1, (data.maxNights || 364) - 1)})}
                disabled={(data.maxNights || 364) <= 1}
              >-</button>
              <span className="w-8 text-center font-medium">{data.maxNights || 364}</span>
              <button 
                className="w-8 h-8 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#5b2d8e] hover:bg-[#e0d0f0]"
                onClick={() => updateData({...data, maxNights: Math.min(364, (data.maxNights || 364) + 1)})}
                disabled={(data.maxNights || 364) >= 364}
              >+</button>
            </div>
            <span className="text-gray-700">nights maximum</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-serif text-[#1D331D]">Arrival days</h2>
        <p className="text-gray-600">On which days and times can guests arrive and depart?</p>

        <div className="space-y-4">
          <h3 className="font-bold text-[#1D331D]">Arrival days</h3>
          <div className="flex flex-wrap gap-3">
            {days.map(day => (
              <label key={`arr-${day}`} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-[#59A559] focus:ring-[#59A559] rounded"
                  checked={data.arrivalDays?.includes(day) || false}
                  onChange={() => handleCheckboxToggle(day, data.arrivalDays || [], (newDays) => 
                    updateData({...data, arrivalDays: newDays})
                  )}
                />
                <span className="text-sm font-medium text-gray-700">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-[#1D331D]">Departure days</h3>
          <div className="flex flex-wrap gap-3">
            {days.map(day => (
              <label key={`dep-${day}`} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 text-[#59A559] focus:ring-[#59A559] rounded"
                  checked={data.departureDays?.includes(day) || false}
                  onChange={() => handleCheckboxToggle(day, data.departureDays || [], (newDays) => 
                    updateData({...data, departureDays: newDays})
                  )}
                />
                <span className="text-sm font-medium text-gray-700">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="font-bold text-[#1D331D]">Check in</h3>
            <div className="flex gap-4">
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-500 mb-1">From</label>
                <div className="relative">
                  <TimePicker 
                    value={data.checkInFrom || '15:00'}
                    onChange={(value) => updateData({...data, checkInFrom: value})}
                    label="Check-in From"
                    fieldKey="checkInFrom"
                  />
                </div>
              </div>
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-500 mb-1">Until</label>
                <div className="relative">
                  <TimePicker 
                    value={data.checkInUntil || '22:00'}
                    onChange={(value) => updateData({...data, checkInUntil: value})}
                    label="Check-in Until"
                    fieldKey="checkInUntil"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-[#1D331D]">Check out</h3>
            <div className="flex gap-4">
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-500 mb-1">From</label>
                <div className="relative">
                  <TimePicker 
                    value={data.checkOutFrom || '07:00'}
                    onChange={(value) => updateData({...data, checkOutFrom: value})}
                    label="Check-out From"
                    fieldKey="checkOutFrom"
                  />
                </div>
              </div>
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-500 mb-1">Until</label>
                <div className="relative">
                  <TimePicker 
                    value={data.checkOutUntil || '11:00'}
                    onChange={(value) => updateData({...data, checkOutUntil: value})}
                    label="Check-out Until"
                    fieldKey="checkOutUntil"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-serif text-[#1D331D]">Bookings</h2>
        <div>
          <h3 className="font-bold text-[#1D331D] mb-2">Minimum number of days between booking and arrival</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
              <button 
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#5b2d8e]"
                onClick={() => updateData({...data, minBookingDays: Math.max(0, (data.minBookingDays || 0) - 1)})}
                disabled={(data.minBookingDays || 0) <= 0}
              >-</button>
              <span className="w-8 text-center font-medium">{data.minBookingDays || 0}</span>
              <button 
                className="w-8 h-8 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#5b2d8e] hover:bg-[#e0d0f0]"
                onClick={() => updateData({...data, minBookingDays: (data.minBookingDays || 0) + 1})}
              >+</button>
            </div>
            <span className="text-gray-700">days before arrival</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">How many days prior to arrival can a guest make a booking?</p>
        </div>

        <div className="space-y-3 pt-4">
          <h3 className="font-bold text-[#1D331D]">Availability limit</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="availabilityLimit"
                className="w-5 h-5 text-[#59A559] focus:ring-2 focus:ring-[#59A559]/20 transition-all duration-200 group-hover:scale-110"
                value="2_years"
                checked={data.availabilityLimit === '2_years'}
                onChange={(e) => updateData({...data, availabilityLimit: e.target.value})}
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">2 years</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="radio" 
                name="availabilityLimit"
                className="w-5 h-5 text-[#59A559] focus:ring-2 focus:ring-[#59A559]/20 transition-all duration-200 group-hover:scale-110"
                value="1_year"
                checked={data.availabilityLimit === '1_year'}
                onChange={(e) => updateData({...data, availabilityLimit: e.target.value})}
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-200">1 year</span>
            </label>
          </div>
          <p className="text-sm text-gray-500">How far into the future do you want to receive bookings? Availability is based on this setting and is relative to the current date.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-serif text-[#1D331D]">Automatically approve bookings</h2>
        <UnifiedCheckbox
          checked={false}
          onChange={() => {}}
          label={<span className="text-gray-700 font-medium">Automatically approve new bookings</span>}
          className="items-start"
        />
        
        <div className="bg-[#EAF6FA] border border-[#BDE0EF] rounded-lg p-4 flex gap-3">
          <div className="text-[#0099CC] mt-0.5">ⓘ</div>
          <div className="text-sm text-[#006688]">
            <p className="font-bold mb-1">Automatically approve bookings</p>
            <p>Please note: when you turn on direct booking, bookings are automatically approved immediately. This way guests get a fast reply on their booking. Make sure that the rates, availability and other settings are correct, otherwise this will be at the expense of the guest experience and your visibility on the platform.</p>
          </div>
        </div>
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CalendarStep({ data, updateData, onNext, onPrevious }: any) {
  const [visibleMonths, setVisibleMonths] = useState(12);
  const [activeMode, setActiveMode] = useState<'availability' | 'configuration'>('availability');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showAvailabilityPopup, setShowAvailabilityPopup] = useState(false);
  const [showConfigurationPopup, setShowConfigurationPopup] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [minNights, setMinNights] = useState(1);
  const [maxNights, setMaxNights] = useState(364);
  const [blockReason, setBlockReason] = useState('');
  const [selectedArrivalDays, setSelectedArrivalDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [selectedDepartureDays, setSelectedDepartureDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);
  
  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.date-picker-container') && !target.closest('input[readonly]')) {
        setShowDatePicker(null);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Close configuration popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Use timeout to avoid conflicts with other click handlers
      setTimeout(() => {
        const configPopup = document.querySelector('[data-config-popup="true"]');
        if (configPopup && !configPopup.contains(target)) {
          setShowConfigurationPopup(false);
          setExpandedSection(null);
        }
      }, 0);
    };

    if (showConfigurationPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfigurationPopup]);

  // Handlers for min/max nights
  const handleMinNightsChange = (value: number) => {
    const newValue = Math.max(1, Math.min(value, maxNights - 1));
    setMinNights(newValue);
  };

  const handleMaxNightsChange = (value: number) => {
    const newValue = Math.max(minNights + 1, Math.min(value, 364));
    setMaxNights(newValue);
  };

  // Handlers for day selection
  const toggleArrivalDay = (day: string) => {
    handleCheckboxToggle(day, selectedArrivalDays, setSelectedArrivalDays);
  };

  const toggleDepartureDay = (day: string) => {
    handleCheckboxToggle(day, selectedDepartureDays, setSelectedDepartureDays);
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate months starting from current date
  const generateMonths = (count: number) => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    for (let i = 0; i < count; i++) {
      const monthDate = new Date(currentYear, currentMonth + i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Get days in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      // Get starting day of week (0 = Sunday, 1 = Monday, etc.)
      const startDay = new Date(year, month, 1).getDay();
      
      months.push({
        name: monthName,
        days: daysInMonth,
        startDay: startDay,
        year: year,
        month: month
      });
    }
    
    return months;
  };
  
  const months = generateMonths(visibleMonths);
  
  const handleShowMore = () => {
    console.log('Show more clicked, current months:', visibleMonths);
    setVisibleMonths(prev => {
      console.log('Setting months to:', prev + 3);
      return prev + 3;
    });
  };

  const handlePopupDateClick = (field: 'from' | 'to') => {
    setShowDatePicker(field);
  };

  const handleDateSelect = (date: Date) => {
    const newSelectedDates = [...selectedDates];
    if (showDatePicker === 'from') {
      newSelectedDates[0] = date;
    } else if (showDatePicker === 'to') {
      newSelectedDates[1] = date;
    }
    setSelectedDates(newSelectedDates.sort((a, b) => a.getTime() - b.getTime()));
    setShowDatePicker(null);
  };

  const SimpleDatePicker = () => {
    // Determine which month to show based on selected dates
    const getMonthToShow = () => {
      if (selectedDates.length === 0) {
        // If no dates selected, show current month
        const currentDate = new Date();
        return {
          month: currentDate.getMonth(),
          year: currentDate.getFullYear()
        };
      }
      
      // If dates are selected, show the month of the first selected date
      const firstDate = selectedDates[0];
      return {
        month: firstDate.getMonth(),
        year: firstDate.getFullYear()
      };
    };
    
    const { month: displayMonth, year: displayYear } = getMonthToShow();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const startDay = new Date(displayYear, displayMonth, 1).getDay();
    
    return (
      <div className="date-picker-container absolute top-full mt-1 bg-white border-2 border-gray-400 rounded-xl shadow-lg p-3 z-50 min-w-[280px]">
        <div className="text-sm font-medium text-gray-700 mb-2">
          {new Date(displayYear, displayMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="font-medium">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }, (_, i) => (
            <div key={`empty-${i}`} className="h-6"></div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(displayYear, displayMonth, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isPast = date < today;
            const isSelected = selectedDates.some(selectedDate => 
              selectedDate.getDate() === day && 
              selectedDate.getMonth() === displayMonth && 
              selectedDate.getFullYear() === displayYear
            );
            
            return (
              <button
                key={day}
                onClick={() => !isPast && handleDateSelect(date)}
                disabled={isPast}
                className={`h-6 text-xs rounded transition-colors ${
                  isPast 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : isSelected 
                      ? 'bg-[#59A559] text-white' 
                      : 'text-gray-700 hover:bg-[#59A559] hover:text-white'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  const generateCalendarDays = (month: any) => {
    const days = [];
    const currentDay = new Date();
    const today = new Date(currentDay.getFullYear(), currentDay.getMonth(), currentDay.getDate());
    
    // Add empty cells for days before month starts
    for (let i = 0; i < month.startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= month.days; day++) {
      const cellDate = new Date(month.year, month.month, day);
      const isToday = currentDay.getDate() === day && 
                     currentDay.getMonth() === month.month && 
                     currentDay.getFullYear() === month.year;
      const isPast = cellDate < today;
      const isSelected = selectedDates.some(date => 
        date.getDate() === day && 
        date.getMonth() === month.month && 
        date.getFullYear() === month.year
      );
      
      const handleDateClick = () => {
        if (isPast) return;
        
        const newSelectedDates = [...selectedDates];
        const existingIndex = newSelectedDates.findIndex(date => 
          date.getDate() === day && 
          date.getMonth() === month.month && 
          date.getFullYear() === month.year
        );
        
        if (existingIndex >= 0) {
          newSelectedDates.splice(existingIndex, 1);
        } else {
          newSelectedDates.push(cellDate);
        }
        
        setSelectedDates(newSelectedDates.sort((a, b) => a.getTime() - b.getTime()));
        
        if (newSelectedDates.length === 2) {
          if (activeMode === 'availability') {
            setShowAvailabilityPopup(true);
          } else if (activeMode === 'configuration') {
            setShowConfigurationPopup(true);
          }
        }
      };

      days.push(
        <div 
          key={day} 
          className={`h-8 flex items-center justify-center text-xs rounded transition-colors ${
            isPast 
              ? 'text-gray-300 cursor-not-allowed' 
              : isSelected
                ? 'bg-red-500 text-white font-bold cursor-pointer hover:bg-red-600'
                : isToday 
                  ? 'bg-[#59A559] text-white font-bold cursor-pointer hover:bg-[#4a8a4a]' 
                  : activeMode === 'availability'
                    ? 'hover:bg-blue-100 text-gray-700 cursor-pointer'
                    : 'hover:bg-gray-100 text-gray-700 cursor-pointer'
          }`}
          onClick={handleDateClick}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif text-[#1D331D]">Calendar</h2>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-purple-300 bg-purple-50 text-purple-700 hover:border-purple-400 hover:bg-purple-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
          <span className="font-bold text-lg">:</span>
          <span>More</span>
        </button>
      </div>
      
      <h2 className="text-2xl font-serif text-[#1D331D]">Custom settings</h2>
      
      <div className="prose text-gray-600">
        <p>In the calendar, you can block periods and enter custom settings via 'configuration'. Always keep your availability up to date to avoid double bookings. Via 'more' you can link your availability to other ICAL calendars for automatic synchronisation. Blocking or unblocking can be done via 'availability', adjusted prices can be set via 'configuration'. <a href="#" className="text-[#5b2d8e] underline">More information on using the calendar</a></p>
      </div>

      <div className="flex gap-4 justify-center">
        <button 
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeMode === 'availability' 
              ? 'bg-[#5b2d8e] text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveMode('availability')}
        >
          Availability
        </button>
        <button 
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            activeMode === 'configuration' 
              ? 'bg-[#5b2d8e] text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => setActiveMode('configuration')}
        >
          Configuration
        </button>
      </div>

      <div className="flex gap-6 text-sm justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-300 bg-white"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#244224] text-white text-[10px] flex items-center justify-center">▼</div>
          <span>Custom settings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#BDDBBD]"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-400 flex items-center justify-center">
            <div className="w-full h-[1px] bg-white rotate-45"></div>
          </div>
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-blue-300 bg-blue-50"></div>
          <span>Synced block</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((month, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-[#1D331D] mb-4">{month.name}</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="font-medium">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays(month)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button 
          onClick={handleShowMore}
          className="bg-[#5b2d8e] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Show more months
        </button>
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>

      {/* Availability Popup Modal */}
      {showAvailabilityPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => {
                setShowAvailabilityPopup(false);
                setSelectedDates([]);
                setBlockReason('');
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold text-[#1D331D] mb-4 pr-8">Adjust settings</h3>
            
            <p className="text-gray-600 mb-4">
              The selected dates will be <strong>blocked as arrival day</strong>.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md cursor-pointer"
                      value={selectedDates[0]?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) || ''}
                      readOnly
                      onClick={() => handlePopupDateClick('from')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                    {showDatePicker === 'from' && <SimpleDatePicker />}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-gray-400">→</span>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md cursor-pointer"
                      value={selectedDates[1]?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) || ''}
                      readOnly
                      onClick={() => handlePopupDateClick('to')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                    {showDatePicker === 'to' && <SimpleDatePicker />}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select
                className="w-full px-3 py-2 border-2 border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md cursor-pointer appearance-none"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                <option value="rented_website">Rented via own website</option>
                <option value="rented_other_platform">Rented via other platform</option>
                <option value="own_use">Own use</option>
                <option value="construction">Construction</option>
                <option value="not_rented">Not rented during this period</option>
                <option value="pricing_not_configured">Pricing not configured</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border-2 border-red-500 rounded-lg hover:text-red-600 hover:border-red-600 transition-colors"
                onClick={() => {
                  setShowAvailabilityPopup(false);
                  setSelectedDates([]);
                  setBlockReason('');
                }}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-[#5b2d8e] text-white rounded-lg hover:bg-[#4a2475] transition-colors"
                onClick={() => {
                  // Save the blocked dates
                  const blockedDates = data.blockedDates || [];
                  const newBlockedDates = [
                    ...blockedDates,
                    ...selectedDates.map(date => ({
                      date: date.toISOString(),
                      reason: blockReason
                    }))
                  ];
                  updateData({...data, blockedDates: newBlockedDates});
                  
                  setShowAvailabilityPopup(false);
                  setSelectedDates([]);
                  setBlockReason('');
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Popup Modal */}
      {showConfigurationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 relative max-h-[90vh] overflow-y-auto" data-config-popup="true">
            <button 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => {
                setShowConfigurationPopup(false);
                setSelectedDates([]);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-xl font-bold text-[#1D331D] mb-4 pr-8">Adjust settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md cursor-pointer"
                      value={selectedDates[0]?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) || ''}
                      readOnly
                      onClick={() => handlePopupDateClick('from')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                    {showDatePicker === 'from' && <SimpleDatePicker />}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-gray-400">→</span>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border-2 border-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md cursor-pointer"
                      value={selectedDates[1]?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) || ''}
                      readOnly
                      onClick={() => handlePopupDateClick('to')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                    {showDatePicker === 'to' && <SimpleDatePicker />}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div 
                className="border border-gray-300 rounded-lg overflow-hidden"
                onClick={() => setExpandedSection(expandedSection === 'price' ? null : 'price')}
              >
                <div className="px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                  <div className="font-medium text-gray-700">Price settings</div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedSection === 'price' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {expandedSection === 'price' && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3">
                    <p className="text-sm text-gray-600 mb-3">The prices from your basic price plan will apply unless you change the price below specifically for the selected period.</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Night</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">€</span>
                          <div className="relative group">
                            <input 
                              type="number" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                              placeholder="0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                              Price per night for single day stays
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Total price weekend</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">€</span>
                          <div className="relative group">
                            <input 
                              type="number" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                              placeholder="0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                              Price for Friday to Sunday stay
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Total price long weekend</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">€</span>
                          <div className="relative group">
                            <input 
                              type="number" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                              placeholder="0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                              Price for extended weekend (e.g., Thursday to Monday)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Total price during the week</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">€</span>
                          <div className="relative group">
                            <input 
                              type="number" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                              placeholder="0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                              Price for Monday to Thursday stay
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Total price week</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">€</span>
                          <div className="relative group">
                            <input 
                              type="number" 
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                              placeholder="0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                              Price for full week (7 nights) stay
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div 
                className="border border-gray-300 rounded-lg overflow-hidden"
                onClick={() => setExpandedSection(expandedSection === 'duration' ? null : 'duration')}
              >
                <div className="px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                  <div className="font-medium text-gray-700">Duration of stay</div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedSection === 'duration' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {expandedSection === 'duration' && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-4">
                    <p className="text-sm text-gray-600">The length of stay from your availability settings will apply unless you change the length of stay below specifically for the selected period.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum number of nights per booking</label>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMinNightsChange(minNights - 1);
                            }}
                            disabled={minNights <= 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                            value={minNights}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleMinNightsChange(parseInt(e.target.value) || 1);
                            }}
                            min="1"
                            max={maxNights - 1}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button 
                            type="button"
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMinNightsChange(minNights + 1);
                            }}
                            disabled={minNights >= maxNights - 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Maximum number of nights per booking</label>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaxNightsChange(maxNights - 1);
                            }}
                            disabled={maxNights <= minNights + 1}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#59A559]"
                            value={maxNights}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleMaxNightsChange(parseInt(e.target.value) || 364);
                            }}
                            min={minNights + 1}
                            max="364"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button 
                            type="button"
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMaxNightsChange(maxNights + 1);
                            }}
                            disabled={maxNights >= 364}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div 
                className="border border-gray-300 rounded-lg overflow-hidden"
                onClick={() => setExpandedSection(expandedSection === 'arrival' ? null : 'arrival')}
              >
                <div className="px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                  <div className="font-medium text-gray-700">Arrival and departure</div>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedSection === 'arrival' ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {expandedSection === 'arrival' && (
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-6">
                    <p className="text-sm text-gray-600">Change the possible arrival and departure days for the selected period below.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700">Arrival days</label>
                          <span className="text-xs text-gray-500">
                            Normally on {selectedArrivalDays.join(', ')}.
                          </span>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {fullDayNames.map((dayName, index) => (
                            <button
                              key={dayName}
                              type="button"
                              className={`px-3 py-2 text-xs border rounded transition-colors ${
                                selectedArrivalDays.includes(dayNames[index])
                                  ? 'bg-[#59A559] text-white border-[#59A559]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleArrivalDay(dayNames[index]);
                              }}
                            >
                              {dayName.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-700">Departure days</label>
                          <span className="text-xs text-gray-500">
                            Normally on {selectedDepartureDays.join(', ')}.
                          </span>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {fullDayNames.map((dayName, index) => (
                            <button
                              key={dayName}
                              type="button"
                              className={`px-3 py-2 text-xs border rounded transition-colors ${
                                selectedDepartureDays.includes(dayNames[index])
                                  ? 'bg-[#59A559] text-white border-[#59A559]'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDepartureDay(dayNames[index]);
                              }}
                            >
                              {dayName.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 border-2 border-red-500 rounded-lg hover:text-red-600 hover:border-red-600 transition-colors"
                onClick={() => {
                  setShowConfigurationPopup(false);
                  setSelectedDates([]);
                }}
              >
                Delete
              </button>
              <button
                className="px-4 py-2 bg-[#5b2d8e] text-white rounded-lg hover:bg-[#4a2475] transition-colors"
                onClick={() => {
                  // Save configuration settings
                  setShowConfigurationPopup(false);
                  setSelectedDates([]);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BedroomsStep({ data, updateData, onNext, onPrevious }: any) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const rooms = data.rooms || [];

  const addRoom = () => {
    const newRoom = {
      id: Date.now(), // Temporary ID for new rooms
      name: "",
      description: "",
      room_type: "Bedroom",
      size_m2: null,
      max_person: 2,
      price_per_night: null
    };
    updateData({ ...data, rooms: [...rooms, newRoom] });
    setEditingIndex(rooms.length);
  };

  const updateRoom = (index: number, field: string, value: any) => {
    const updatedRooms = [...rooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    updateData({ ...data, rooms: updatedRooms });
  };

  const deleteRoom = (index: number) => {
    const updatedRooms = rooms.filter((_: any, i: number) => i !== index);
    updateData({ ...data, rooms: updatedRooms });
    setEditingIndex(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-3xl font-serif text-[#1D331D]">Bedrooms</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif text-[#1D331D]">Bedrooms ({rooms.length})</h3>
          <button 
            onClick={addRoom}
            className="bg-[#EFEFEF] text-[#5b2d8e] px-6 py-3 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <span className="text-xl">+</span> Add a bedroom
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No bedrooms added yet</p>
            <button 
              onClick={addRoom}
              className="bg-[#59A559] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#4a8a4a] transition-colors"
            >
              Add your first bedroom
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room: any, index: number) => (
              <div key={room.id || index} className="border border-gray-200 rounded-lg p-6 bg-white">
                {editingIndex === index ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-[#1D331D]">Edit Bedroom {index + 1}</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingIndex(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => deleteRoom(index)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1D331D]">Room Name</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
                          placeholder="e.g., Master Bedroom"
                          value={room.name || ""}
                          onChange={(e) => updateRoom(index, 'name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1D331D]">Room Type</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
                          value={room.room_type || "Bedroom"}
                          onChange={(e) => updateRoom(index, 'room_type', e.target.value)}
                        >
                          <option>Bedroom</option>
                          <option>Living Room</option>
                          <option>Kitchen</option>
                          <option>Bathroom</option>
                          <option>Other</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1D331D]">Size (m²)</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
                          placeholder="e.g., 20"
                          value={room.size_m2 || ""}
                          onChange={(e) => updateRoom(index, 'size_m2', e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1D331D]">Max Persons</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
                          placeholder="e.g., 2"
                          value={room.max_person || 2}
                          onChange={(e) => updateRoom(index, 'max_person', parseInt(e.target.value) || 2)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1D331D]">Price per Night (optional)</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
                          placeholder="e.g., 100"
                          value={room.price_per_night || ""}
                          onChange={(e) => updateRoom(index, 'price_per_night', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1D331D]">Description</label>
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] min-h-[100px] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400 resize-none"
                        placeholder="Describe the room, bedding, amenities, etc."
                        value={room.description || ""}
                        onChange={(e) => updateRoom(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-[#1D331D]">
                        {room.name || `Bedroom ${index + 1}`}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>Type: {room.room_type || 'Bedroom'}</span>
                        {room.size_m2 && <span>Size: {room.size_m2}m²</span>}
                        <span>Max: {room.max_person || 2} persons</span>
                        {room.price_per_night && <span>€{room.price_per_night}/night</span>}
                      </div>
                      {room.description && (
                        <p className="text-gray-600 mt-2">{room.description}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setEditingIndex(index)}
                      className="px-4 py-2 bg-[#59A559] text-white rounded-lg hover:bg-[#4a8a4a] transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function DescriptionStep({ data, updateData, onNext, onPrevious }: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif text-[#1D331D]">Description</h2>
        <p className="text-gray-600">
          Add a description of you nature house, the nature and the surroundings. <a href="#" className="text-[#5b2d8e] underline">Read some tips on how to write a good advertisement.</a> Note: write the description in the following language: English.
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#1D331D]">About your nature house</label>
        <div className="relative">
          <textarea 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] min-h-[150px] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400 resize-none"
            placeholder="Add your text of up to 1000 characters here."
            maxLength={1000}
            value={data.description}
            onChange={(e) => updateData({...data, description: e.target.value})}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {data.description.length} / 1000
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#1D331D]">Nature and surroundings</label>
        <div className="relative">
          <textarea 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] min-h-[150px] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400 resize-none"
            placeholder="Add your text of up to 1000 characters here."
            maxLength={1000}
            value={data.surroundings}
            onChange={(e) => updateData({...data, surroundings: e.target.value})}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {data.surroundings.length} / 1000
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        In order to give you the best chance to get booked in other countries, your description will be automatically translated into German, Dutch, French and Italian by our translation machine.
      </p>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StayDetailsStep({ data, updateData, onNext, onPrevious }: any) {
  const categories = [
    {
      title: "Peace and Quiet",
      items: [
        { 
          name: "Contactless stay", 
          tooltip: "Guests can stay without personal contact with the host, for example via a key box or digital access. Contactless stays are not mandatory. You can arrange this with the guest after the booking has been made." 
        },
        { 
          name: "Firework-free area", 
          tooltip: "Firework-free means that no fireworks can be heard in and around the accommodation. You may hear some noise or see some light from fireworks being set off outside the immediate vicinity, but this is generally limited and most guests experience little disturbance from it. Please note that you can indicate in the house rules whether fireworks are permitted." 
        }
      ]
    },
    {
      title: "Accessibility",
      items: ["Wheelchair accessible", "Parking"]
    },
    {
      title: "Utilities",
      items: [
        "Internet access (WiFi)", "Internet", "Fire place", "Pellet stove", "Wood stove", 
        "Gas heater", "Central heating", "Heating (electric, central heating)", "Heating (electric)", 
        "Air conditioning", "Car charging station", "RV hookup", "Drinking water", "Hot water", "Electricity"
      ]
    },
    {
      title: "Outdoor",
      items: [
        "Garden", "Garden (fenced)", "Garden (shared)", "BBQ", "Garden furniture", 
        "Terrace", "Terrace (shared)", "Terrace (covered)", "Balcony", "Patio (shared)", 
        "Small lake", "Garden doors", "Storage"
      ]
    },
    {
      title: "Entertainment",
      items: [
        "TV", "Swimming pool (shared)", "Swimming pool (private)", "Jacuzzi / hot tub", 
        "Sauna", "Infrared sauna", "Tanning bed", "Bicycles available (free)", 
        "Bicycles available (extra charge)", "Table tennis table", "Table football", 
        "Pétanque court", "Pinball machine"
      ]
    },
    {
      title: "Business meetings",
      items: ["Whiteboard", "Projector", "Flip chart"]
    },
    {
      title: "Children",
      items: ["Cot", "High chair", "Baby bath", "Playpen", "Playground equipment", "Sandbox", "Playground", "Trampoline"]
    },
    {
      title: "Pets",
      items: ["Dog bed", "Dog bowl"]
    },
    {
      title: "Kitchen",
      items: ["Kitchen", "Kitchen (shared)", "Dishwasher", "Fridge/freezer", "Oven", "Gas stove"]
    },
    {
      title: "Bathroom",
      items: ["Sanitary facilities", "Bathroom", "Bathroom (shared)", "Bath", "Shower", "Toilet"]
    },
    {
      title: "Laundry",
      items: ["Washing machine", "Washing machine (shared)", "Dryer", "Dryer (shared)"]
    }
  ];

  const handleToggle = (item: string) => {
    handleCheckboxToggle(item, data.amenities, (newAmenities) => 
      updateData({...data, amenities: newAmenities})
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif text-[#1D331D]">Stay details</h2>
        <p className="text-gray-600">Indicate what applies to your nature house</p>
      </div>

      <div className="space-y-8">
        {categories.map((cat, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="font-bold text-[#1D331D] text-lg">{cat.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cat.items.map((item, i) => {
                const itemName = typeof item === 'string' ? item : item.name;
                const itemTooltip = typeof item === 'string' ? null : item.tooltip;
                
                return (
                  <div key={i} className="flex items-center gap-2">
                    <UnifiedCheckbox
                      checked={data.amenities.includes(itemName)}
                      onChange={() => handleToggle(itemName)}
                      label={
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 group-hover:text-[#1D331D] transition-colors">{itemName}</span>
                          {itemTooltip && (
                            <div className="relative group">
                              <button
                                type="button"
                                className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => {
                                  const button = e.currentTarget;
                                  const tooltip = button.nextElementSibling as HTMLElement;
                                  if (tooltip) {
                                    const buttonRect = button.getBoundingClientRect();
                                    const tooltipWidth = 288; // w-72 = 288px
                                    const spaceOnRight = window.innerWidth - buttonRect.right - 8;
                                    const spaceOnLeft = buttonRect.left - 8;
                                    
                                    if (spaceOnRight < tooltipWidth && spaceOnLeft > tooltipWidth) {
                                      // Show on left side
                                      tooltip.style.left = 'auto';
                                      tooltip.style.right = '100%';
                                      tooltip.style.marginLeft = '0';
                                      tooltip.style.marginRight = '8px';
                                    } else {
                                      // Show on right side
                                      tooltip.style.left = '100%';
                                      tooltip.style.right = 'auto';
                                      tooltip.style.marginLeft = '8px';
                                      tooltip.style.marginRight = '0';
                                    }
                                  }
                                }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <div className="absolute top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-sm rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 w-72 max-w-xs border border-gray-700" style={{left: '100%', marginLeft: '8px'}}>
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"></div>
                                  <div className="relative text-left leading-relaxed space-y-2">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                      <span className="font-semibold text-blue-300 text-xs uppercase tracking-wide">Information</span>
                                    </div>
                                    <div className="text-gray-100 text-xs leading-relaxed font-light">
                                      {itemTooltip}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function SustainabilityStep({ data, updateData, onNext, onPrevious }: any) {
  const sections = [
    {
      title: "Energy",
      questions: [
        { 
          id: "off_grid", 
          text: "Is your nature house off grid or supplied with 100% renewable energy?", 
          tooltip: "Can be fully self-sufficient (e.g. with solar panels, geothermal energy) and/or on the basis of an energy contract with a supplier providing 100% renewable energy (solar, wind, geothermal and/or hydropower)"
        },
        { 
          id: "natural_insulation", 
          text: "Is your nature house insulated with natural isolation materials?", 
          tooltip: "For example: Wood fibre, Cotton, Sheep's wool, Hemp, Flax, Grass fibre, Cellulose, Mineral, Cork"
        },
        { 
          id: "natural_materials", 
          text: "Is your nature house build with natural/sustainable materials?", 
          tooltip: "For example: Wood, Loam, Straw, Wicker, Bamboo, Natural stone, Recycled materials (as e.g. recycled steel)"
        }
      ]
    },
    {
      title: "Waste",
      questions: [
        { 
          id: "waste_food", 
          text: "Do you minimize food waste (pre-ordered or fixed portion size)?", 
          tooltip: "For example re-usable tupperware availble and pre-ordered or fixed portion size"
        },
        { 
          id: "waste_inventory", 
          text: "The use of sustainable materials has been conciously considered when compiling the inventory?", 
          tooltip: "For example pre-owned tableware, furniture or renewable, recyclable, and biodegradable materials in your inventory"
        },
        { 
          id: "waste_separation", 
          text: "Are guest informed about the way they can reduce and/or separate waste following the local guidelines?", 
          tooltip: "Glass, paper, plastic, food waste/organic"
        },
        { 
          id: "waste_plastic", 
          text: "Have single-use plastic amenities/supplies been replaced into reusable amenities/supplies?", 
          tooltip: "You function in the nature house completely packaging-free and without single-use plastic?"
        },
        { 
          id: "waste_water", 
          text: "Do you encourage guests to use tap water or water from an installed water refill station instead of single-use plastic water bottles?", 
          tooltip: "You offer guests the option of refilling a water bottle so they don't have to use single-use plastic bottles. For example; tap water or a water refill station"
        },
        { 
          id: "waste_organic", 
          text: "Do you reuse organic waste in your operations?", 
          tooltip: "Reuse organic waste on the terrain or in the community e.g. compost heap, manure as fertiliser etc."
        }
      ]
    },
    {
      title: "Water",
      questions: [
        { 
          id: "water_toilet", 
          text: "Does your nature house have (a) water-efficient toilet(s)?", 
          tooltip: "For example: a Water-efficient toilet with Dual flush option (large flush or small flush)"
        },
        { 
          id: "water_shower", 
          text: "Does your nature house have (a) water-efficient shower(s)?", 
          tooltip: "For example: a Water-saving shower head or a flow limiter"
        },
        { 
          id: "water_cleaning", 
          text: "Do you clean your nature house with 100% natural cleaning products?", 
          tooltip: "Also no bleach"
        },
        { 
          id: "water_rain", 
          text: "Do you collect rainwater for your garden, toilet, cleaning or more?", 
          tooltip: "For example: a rainwater well and / or a rainwater barrel"
        },
        { 
          id: "water_min", 
          text: "Do you stimulate guests to minimize water use?", 
          tooltip: "For example instructions how minimize the water use during the stay"
        },
        { 
          id: "water_filter", 
          text: "Does your nature house have a eco-friendly waste water filtering system (if not connected to sewage system)?", 
          tooltip: "Avoid use of wet septic tanks, e.g. by dry well septic tanks, helofytenfiltering, dry eco toilets etc."
        },
        { 
          id: "water_pond", 
          text: "Does your garden / grounds have a pond or other natural water facility?", 
          tooltip: "For example a pond or swimming pond"
        }
      ]
    },
    {
      title: "Biodiversity",
      questions: [
        { 
          id: "bio_grow", 
          text: "Do you grow (ecological / organic) food products that are available to guests?", 
          tooltip: "For example: Jam, herbs or vegetables"
        },
        { 
          id: "bio_garden", 
          text: "Do you have a biodiversity-friendly garden (flowers, trees, hedges,..)?", 
          tooltip: "No non-native species, variety of unsprayed trees, plants, flowers and hedges."
        },
        { 
          id: "bio_manage", 
          text: "Do you manage your garden in a sustainable way?", 
          tooltip: "Not using pesticides and/or other chemicals and no use of fertilisers"
        },
        { 
          id: "bio_local", 
          text: "Do you contribute to local biodiversity beyond your property? (for instance by planting, sowing indigenous plants, herbs)", 
          tooltip: "In some cases this is natural because your naturehouse is in the middle of nature, but for others using indigenous plants that are also present local nature increase the size and amount' of nature and the viability of the local ecosystem for specific species (e.g. birds)"
        },
        { 
          id: "bio_invest", 
          text: "Do you reinvest a % of your revenue in local biodiversity (e.g. donation to regional parc)?", 
          tooltip: "Including  donations, memberships and/or leasing / renting of terrain or grounds"
        },
        { 
          id: "bio_rules", 
          text: "Do you have a have specific house rules on darkness and silence after certain hours to stimulate guests to respect the biorhythm of local species?", 
          tooltip: "Many animals and some plants can be disturbed by light after dark or noise. This can affect their (nesting) behaviour). Guests can be stimulated to respect this natural rhythm"
        },
        { 
          id: "bio_home", 
          text: "Does your nature house also provide a home for birds, insects or bats?", 
          tooltip: "For example: green roof, nest tiles, nest stones, bat boxes"
        }
      ]
    },
    {
      title: "Destination",
      questions: [
        { 
          id: "dest_bike", 
          text: "Do you stimulate guests to use a bike by offering bicycle rental or bicycle rental nearby?", 
          tooltip: "Bicycle rental is possible"
        },
        { 
          id: "dest_sust", 
          text: "Do you stimulate guests to come to your nature house in a sustainable way?", 
          tooltip: "Stimulate guests to come with public transport or pick-up service at for example public transport stations"
        },
        { 
          id: "dest_tours", 
          text: "Do you offer guests tours and activities organised by local guides and businesses?", 
          tooltip: "Tours and activities organised by local guides and businesses are available"
        },
        { 
          id: "dest_info", 
          text: "Do you provide guests with information on local biodiversity and ecosystems and (seasonal) visitor etiquette?", 
          tooltip: "Offering information such as: what does the local environment look like and how do you deal with the sustainably as a visitor? "
        },
        { 
          id: "dest_food", 
          text: "Do you offer locally produced (organic) food & goods in your nature house?", 
          tooltip: "For example: Fruit or vegetables"
        },
        { 
          id: "dest_culture", 
          text: "Do you provide guests with information regarding local heritage and culture as well as visitor etiquette?", 
          tooltip: "Offering information such as: what does the local environment look like and how do you deal with the sustainably as a visitor?"
        },
        { 
          id: "dest_heritage", 
          text: "Is your nature house (protected) cultural heritage?", 
          tooltip: "The nature house is (protected) cultural heritage"
        },
        { 
          id: "dest_charge", 
          text: "Do you offer electric charging for cars and bikes or other types of mobility?", 
          tooltip: "Is it possible to charge an electric car and bike at the nature house?"
        }
      ]
    }
  ];

  const handleSustainabilityChange = (id: string, value: string) => {
    updateData({
      ...data,
      sustainability: { ...data.sustainability, [id]: value }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif text-[#1D331D]">Sustainability</h2>
        <p className="text-gray-600">Below you can indicate which sustainable aspects your nature house meets.</p>
      </div>

      <div className="space-y-8">
        {/* Energy Label */}
        <div className="space-y-4">
          <h3 className="font-bold text-[#1D331D] text-lg">Energy</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-bold text-[#1D331D]">What is your energy label?</label>
              <div className="relative group">
                <button
                  type="button"
                  className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    const tooltip = button.nextElementSibling as HTMLElement;
                    if (tooltip) {
                      const buttonRect = button.getBoundingClientRect();
                      const tooltipWidth = 288; // w-72 = 288px
                      const spaceOnRight = window.innerWidth - buttonRect.right - 8;
                      const spaceOnLeft = buttonRect.left - 8;
                      
                      if (spaceOnRight < tooltipWidth && spaceOnLeft > tooltipWidth) {
                        // Show on left side
                        tooltip.style.left = 'auto';
                        tooltip.style.right = '100%';
                        tooltip.style.marginLeft = '0';
                        tooltip.style.marginRight = '8px';
                      } else {
                        // Show on right side
                        tooltip.style.left = '100%';
                        tooltip.style.right = 'auto';
                        tooltip.style.marginLeft = '8px';
                        tooltip.style.marginRight = '0';
                      }
                    }
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="absolute top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-sm rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 w-72 max-w-xs border border-gray-700" style={{left: '100%', marginLeft: '8px'}}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"></div>
                    <div className="relative text-left leading-relaxed space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-blue-300 text-xs uppercase tracking-wide">Information</span>
                      </div>
                      <div className="text-gray-100 text-xs leading-relaxed font-light">
                        Since 2024 energy labels are mandatory for holiday homes, with certain exceptions. If you have an exception for this fill in the option 'excluded'
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <select 
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] cursor-pointer appearance-none"
              value={data.energyLabel}
              onChange={(e) => updateData({...data, energyLabel: e.target.value})}
            >
              <option value="">Select an energy label</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
            </select>
          </div>
        </div>

        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="font-bold text-[#1D331D] text-lg">{section.title}</h3>
            <div className="space-y-6">
              {section.questions.map((q) => (
                <div key={q.id} className="space-y-3 border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start gap-2">
                    <div className="text-gray-800 flex-1">
                      {q.text}
                      {q.tooltip && (
                        <span className="relative group inline-flex ml-2">
                          <button
                            type="button"
                            className="w-4 h-4 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={(e) => {
                              const button = e.currentTarget;
                              const tooltip = button.nextElementSibling as HTMLElement;
                              if (tooltip) {
                                const buttonRect = button.getBoundingClientRect();
                                const tooltipWidth = 288; // w-72 = 288px
                                const spaceOnRight = window.innerWidth - buttonRect.right - 8;
                                const spaceOnLeft = buttonRect.left - 8;
                                
                                if (spaceOnRight < tooltipWidth && spaceOnLeft > tooltipWidth) {
                                  // Show on left side
                                  tooltip.style.left = 'auto';
                                  tooltip.style.right = '100%';
                                  tooltip.style.marginLeft = '0';
                                  tooltip.style.marginRight = '8px';
                                } else {
                                  // Show on right side
                                  tooltip.style.left = '100%';
                                  tooltip.style.right = 'auto';
                                  tooltip.style.marginLeft = '8px';
                                  tooltip.style.marginRight = '0';
                                }
                              }
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <div className="absolute top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-br from-gray-900 to-gray-800 text-white text-sm rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 w-72 max-w-xs border border-gray-700" style={{left: '100%', marginLeft: '8px'}}>
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"></div>
                              <div className="relative text-left leading-relaxed space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                  <span className="font-semibold text-blue-300 text-xs uppercase tracking-wide">Information</span>
                                </div>
                                <div className="text-gray-100 text-xs leading-relaxed font-light">
                                  {q.tooltip}
                                </div>
                              </div>
                            </div>
                          </div>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`sust_${q.id}`}
                        className="w-5 h-5 text-[#59A559] focus:ring-[#59A559]"
                        checked={data.sustainability[q.id] === 'yes'}
                        onChange={() => handleSustainabilityChange(q.id, 'yes')}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={`sust_${q.id}`}
                        className="w-5 h-5 text-[#59A559] focus:ring-[#59A559]"
                        checked={data.sustainability[q.id] === 'no'}
                        onChange={() => handleSustainabilityChange(q.id, 'no')}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onNext}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function HouseRulesStep({ data, updateData, onNext, onPrevious, mode = 'create', existingListing = null, onSave }: any) {
  const [showMore, setShowMore] = useState(false);

  const updateRule = (field: string, value: any) => {
    updateData({
      ...data,
      houseRules: { ...(data.houseRules || {}), [field]: value }
    });
  };

  const addCustomRule = () => {
    updateRule('customRules', [...(data.houseRules?.customRules || []), '']);
  };

  const removeCustomRule = (idx: number) => {
    const newRules = (data.houseRules?.customRules || []).filter((_: string, i: number) => i !== idx);
    updateRule('customRules', newRules);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="space-y-4">
        <h2 className="text-3xl font-serif text-[#1D331D]">We would like to draw your attention to the following points.</h2>
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <p>1. We agree, and you hereby declare, that you will personally occupy the nature house. You also declare that you will occupy the house and the surrounding grounds in a neat and correct manner and that no inconvenience will be caused during your stay. If you cause unexpected damage to the grounds / cottage or if there is negligent use, then the costs may be claimed from you by the landlord.</p>
          
          {showMore && (
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <p>2. The nature house is rented furnished (unless otherwise stated) and is equipped with enough kitchen utensils, dishes, glassware, blankets and pillows for the entire group of guests. Upon arrival, all appliances are in working order. If this is not the case, please inform the landlord or case manager as soon as possible. They will then try to solve the problem as soon as possible. As a guest you are also required to notify the landlord of the nature house within 24 hours after arrival in case of damage in the building and outbuildings or associated buildings.</p>
              
              <p>3. Of course we assume that you will have a carefree stay, but should something unexpected happen, it is important that you as a guest are insured for the civil liability associated with the rental of a natural house (fire and water damage). If you are not insured, you can be held personally liable for these damage costs and for the interest on these costs. The landlord himself has also insured the rented nature house and outbuildings (building and contents insurance). There is an obligation to do so.</p>
              
              <p>4. Furthermore, it is important to know that as a guest you may never deny the landlord or his/her representative access to the nature house if asked.</p>
            </div>
          )}
          
          <button 
            onClick={() => setShowMore(!showMore)}
            className="text-[#5b2d8e] font-medium mt-2 flex items-center gap-1"
          >
            {showMore ? 'Show less' : 'Show more'} <span>{showMore ? '▲' : '▼'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-serif text-[#1D331D]">Compose your own house rules</h2>
        
        {/* Counters */}
        <div className="space-y-6">
          {[
            { label: "How many babies are allowed in your nature house?", field: "babies" },
            { label: "How many pets are allowed at your nature house?", field: "pets" },
            { label: "Minimum age for children at your nature house", field: "childAge" },
            { label: "Minimum age for the booking person", field: "bookingAge" }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="font-medium text-[#1D331D]">{item.label}</span>
              <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1">
                <button 
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-[#5b2d8e]"
                  onClick={() => updateRule(item.field, Math.max(0, data.houseRules[item.field] - 1))}
                >-</button>
                <span className="w-8 text-center font-medium">{data.houseRules[item.field]}</span>
                <button 
                  className="w-8 h-8 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#5b2d8e] hover:bg-[#e0d0f0]"
                  onClick={() => updateRule(item.field, data.houseRules[item.field] + 1)}
                >+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Yes/No Questions */}
        <div className="space-y-6 pt-4 border-t border-gray-100">
          {[
            { label: "Are parties and events allowed in your nature house?", field: "parties" },
            { label: "Is smoking allowed in your nature house?", field: "smoking" },
            { label: "Are fireworks allowed in your nature house?", field: "fireworks" },
            { label: "Are groups of young people, students or sports teams allowed in your nature house?", field: "groups" },
            { label: "Is it mandatory to separate waste at your nature house?", field: "waste" }
          ].map((item, idx) => (
            <div key={idx} className="space-y-3">
              <span className="font-medium text-[#1D331D]">{item.label}</span>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`rule_${item.field}`}
                    className="w-5 h-5 text-[#59A559] focus:ring-[#59A559]"
                    checked={data.houseRules[item.field] === true}
                    onChange={() => updateRule(item.field, true)}
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`rule_${item.field}`}
                    className="w-5 h-5 text-[#59A559] focus:ring-[#59A559]"
                    checked={data.houseRules[item.field] === false}
                    onChange={() => updateRule(item.field, false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-6">
        <h2 className="text-2xl font-serif text-[#1D331D]">Respect for nature</h2>
        <p className="text-gray-600">Out of respect for nature you can set times of the day where silence is required around your nature house.</p>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1D331D]">Start time</label>
            <div className="relative">
              <input 
                type="time" 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
                value={data.houseRules?.silenceStart || ''}
                onChange={(e) => updateRule('silenceStart', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1D331D]">End time</label>
            <div className="relative">
              <input 
                type="time" 
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] bg-white transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
                value={data.houseRules?.silenceEnd || ''}
                onChange={(e) => updateRule('silenceEnd', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-gray-100 pt-6">
        <h2 className="text-2xl font-serif text-[#1D331D]">Other house rules</h2>
        <p className="text-gray-600">State your specific house rules here.</p>
        
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Parties or events are not allowed in this nature house</li>
          <li>Smoking is not allowed in this nature house</li>
          <li>Fireworks are not allowed around this nature house</li>
          <li>Groups of young people, students and sports teams are not allowed in this nature house</li>
        </ul>

        {(data.houseRules?.customRules || []).map((rule: string, idx: number) => (
          <div key={idx} className="flex gap-2 mt-2">
            <input 
              type="text"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#59A559]/20 focus:border-[#59A559] transition-all duration-300 transform hover:border-gray-500 hover:shadow-md focus:shadow-lg focus:scale-[1.02] placeholder-gray-400"
              placeholder="Add a rule..."
              value={rule}
              onChange={(e) => {
                const newRules = [...(data.houseRules?.customRules || [])];
                newRules[idx] = e.target.value;
                updateRule('customRules', newRules);
              }}
            />
            <button 
              onClick={() => removeCustomRule(idx)}
              className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Remove rule"
            >
              ×
            </button>
          </div>
        ))}

        <button 
          onClick={addCustomRule}
          className="bg-[#EFEFEF] text-[#1D331D] px-6 py-3 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2 transition-colors mt-4"
        >
          <span className="text-xl">+</span> Add a house rule
        </button>
      </div>

      <div className="pt-8 flex justify-between border-t border-gray-100">
        <button 
          onClick={onPrevious}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Previous
        </button>
        <button 
          onClick={onSave}
          className="bg-[#5b2d8e] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#4a2475] transition-colors"
        >
          {mode === 'edit' ? 'Save Changes' : 'Create Listing'}
        </button>
      </div>
    </div>
  );
}
