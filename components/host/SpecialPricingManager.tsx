'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Edit2, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { SpecialPricing, CreateSpecialPricingData } from '@/types/special-pricing';
import type { Locale } from '@/i18n/config';

interface SpecialPricingManagerProps {
  houseId: number;
  regularPrice: number;
  lang?: Locale;
}

export default function SpecialPricingManager({ houseId, regularPrice, lang = 'nl' }: SpecialPricingManagerProps) {
  const [specialPricings, setSpecialPricings] = useState<SpecialPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<CreateSpecialPricingData>({
    house_id: houseId,
    start_date: '',
    end_date: '',
    price_per_night: regularPrice,
    occasion_name: '',
    description: ''
  });

  useEffect(() => {
    fetchSpecialPricing();
  }, [houseId]);

  const fetchSpecialPricing = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/special-pricing?house_id=${houseId}`);
      if (!response.ok) throw new Error('Failed to fetch special pricing');
      const data = await response.json();
      setSpecialPricings(data);
    } catch (err) {
      console.error('Error fetching special pricing:', err);
      setError('Failed to load special pricing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingId 
        ? `/api/special-pricing/${editingId}` 
        : '/api/special-pricing';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save special pricing');
      }

      await fetchSpecialPricing();
      resetForm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this special pricing period?')) {
      return;
    }

    try {
      const response = await fetch(`/api/special-pricing/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete special pricing');
      
      await fetchSpecialPricing();
    } catch (err) {
      console.error('Error deleting special pricing:', err);
      setError('Failed to delete special pricing');
    }
  };

  const handleEdit = (pricing: SpecialPricing) => {
    setEditingId(pricing.id);
    setFormData({
      house_id: pricing.house_id,
      start_date: pricing.start_date,
      end_date: pricing.end_date,
      price_per_night: pricing.price_per_night,
      occasion_name: pricing.occasion_name || '',
      description: pricing.description || '',
      status: pricing.status === 'expired' ? 'active' : pricing.status
    });
    setIsAdding(true);
  };

  const handleToggleStatus = async (pricing: SpecialPricing) => {
    try {
      const newStatus = pricing.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/special-pricing/${pricing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      await fetchSpecialPricing();
    } catch (err) {
      console.error('Error toggling status:', err);
      setError('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      house_id: houseId,
      start_date: '',
      end_date: '',
      price_per_night: regularPrice,
      occasion_name: '',
      description: ''
    });
    setIsAdding(false);
    setEditingId(null);
    setError(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriceDifference = (specialPrice: number) => {
    const diff = specialPrice - regularPrice;
    const percentage = ((diff / regularPrice) * 100).toFixed(0);
    return { diff, percentage };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Special Pricing Periods</h3>
          <p className="text-sm text-gray-600">
            Set different prices for holidays, weekends, or special occasions
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Special Pricing
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">
              {editingId ? 'Edit Special Pricing' : 'Add Special Pricing'}
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                min={today}
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                min={formData.start_date || today}
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Night (€)
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price_per_night || ''}
              onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value ? parseFloat(e.target.value) : 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Regular price: €{regularPrice}/night
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occasion Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Christmas, New Year, Summer Peak"
              value={formData.occasion_name}
              onChange={(e) => setFormData({ ...formData, occasion_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Add any notes about this pricing period"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              {editingId ? 'Update' : 'Add'} Special Pricing
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {specialPricings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No special pricing periods set</p>
          <p className="text-sm text-gray-500 mt-1">
            Add special pricing for holidays or peak seasons
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {specialPricings.map((pricing) => {
            const { diff, percentage } = getPriceDifference(pricing.price_per_night);
            
            return (
              <div
                key={pricing.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-gray-900">
                        {formatDate(pricing.start_date)} - {formatDate(pricing.end_date)}
                      </span>
                      {pricing.occasion_name && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {pricing.occasion_name}
                        </span>
                      )}
                      {pricing.status === 'expired' && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Expired
                        </span>
                      )}
                      {pricing.status === 'inactive' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                      {pricing.status === 'active' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Price: </span>
                        <span className="font-semibold text-gray-900">
                          €{pricing.price_per_night}/night
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {diff > 0 ? '+' : ''}{percentage}%
                        </span>
                        <span className="text-gray-500 text-xs ml-1">
                          ({diff > 0 ? '+' : ''}€{diff.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    
                    {pricing.description && (
                      <p className="text-sm text-gray-600 mt-2">{pricing.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {pricing.status !== 'expired' && (
                      <button
                        onClick={() => handleToggleStatus(pricing)}
                        className={`p-2 rounded-lg transition-colors ${
                          pricing.status === 'active'
                            ? 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50'
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={pricing.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {pricing.status === 'active' ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(pricing)}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pricing.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
