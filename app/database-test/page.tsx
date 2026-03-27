"use client";

import { useState, useEffect } from 'react';
import { testBookingsTable } from '@/lib/supabase-bookings';
import { testHousesTable } from '@/lib/test-houses-table';
import { createClient } from '@/utils/supabase/client';

export default function DatabaseTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const runTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const bookingsResult = await testBookingsTable();
      const housesResult = await testHousesTable();
      
      setTestResult({
        bookings: bookingsResult,
        houses: housesResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
        tableExists: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Database Connection Test
          </h1>
          
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-4">
              <strong>User Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}
            </div>
            
            <button
              onClick={runTest}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Database Tables'}
            </button>
          </div>

          {testResult && (
            <div className="space-y-4">
              {/* Houses Table Result */}
              {testResult.houses && (
                <div className={`p-4 rounded-lg border ${testResult.houses.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className={`font-semibold mb-2 ${testResult.houses.success ? 'text-green-800' : 'text-red-800'}`}>
                    🏠 Houses Table: {testResult.houses.success ? '✅ Working' : '❌ Error'}
                  </h3>
                  
                  <div className="text-sm space-y-1">
                    <div><strong>Table Exists:</strong> {testResult.houses.tableExists ? 'Yes' : 'No'}</div>
                    <div><strong>Needs Migration:</strong> {testResult.houses.needsMigration ? 'Yes' : 'No'}</div>
                    {testResult.houses.error && (
                      <div><strong>Error:</strong> {testResult.houses.error}</div>
                    )}
                    {testResult.houses.data && (
                      <div><strong>Data:</strong> {JSON.stringify(testResult.houses.data)}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Bookings Table Result */}
              {testResult.bookings && (
                <div className={`p-4 rounded-lg border ${testResult.bookings.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className={`font-semibold mb-2 ${testResult.bookings.success ? 'text-green-800' : 'text-red-800'}`}>
                    📅 Bookings Table: {testResult.bookings.success ? '✅ Working' : '❌ Error'}
                  </h3>
                  
                  <div className="text-sm space-y-1">
                    <div><strong>Table Exists:</strong> {testResult.bookings.tableExists ? 'Yes' : 'No'}</div>
                    <div><strong>Needs Migration:</strong> {testResult.bookings.needsMigration ? 'Yes' : 'No'}</div>
                    {testResult.bookings.error && (
                      <div><strong>Error:</strong> {testResult.bookings.error}</div>
                    )}
                    {testResult.bookings.data && (
                      <div><strong>Data:</strong> {JSON.stringify(testResult.bookings.data)}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Overall Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📊 Overall Status</h3>
                <div className="text-sm text-blue-800">
                  {testResult.houses?.success && testResult.bookings?.success ? (
                    <div>✅ All tables are working correctly!</div>
                  ) : (
                    <div>❌ Some tables need attention. Run database migrations to fix issues.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!testResult && (
            <div className="text-gray-600 text-sm">
              Click the test button to check if the database tables exist and are working properly.
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Next Steps</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• If test fails, run the database migration from DATABASE-MIGRATION.md</p>
              <p>• Go to Supabase dashboard → SQL Editor → Run the migration</p>
              <p>• After migration, test again to verify the table exists</p>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2 mt-4">Houses Table Migration</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• If houses table test fails, run CREATE-HOUSES-TABLE.sql</p>
              <p>• This creates the houses and house_images tables</p>
              <p>• Includes sample data for testing</p>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2 mt-4">Duplicate Booking Prevention</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Run PREVENT-DUPLICATE-BOOKINGS.sql to add unique constraints</p>
              <p>• This prevents users from booking the same house for the same dates twice</p>
              <p>• Both frontend and database-level protection is now active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
