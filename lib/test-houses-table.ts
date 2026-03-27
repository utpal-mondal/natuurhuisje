import { createClient } from '@/utils/supabase/client';

export async function testHousesTable() {
  const supabase = createClient();
  
  try {
    // Test if we can query the houses table
    const { data, error } = await supabase
      .from('houses')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Houses table test error:', error);
      
      // Check for specific error patterns that indicate table doesn't exist
      const errorMessage = error.message || '';
      const errorCode = error.code || '';
      
      // Common Supabase/PostgreSQL error codes for missing relation/table
      if (errorMessage.includes('relation "houses" does not exist') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('Could not find the table') ||
          errorMessage.includes('in the schema cache') ||
          errorCode === 'PGRST116' || // PostgreSQL relation does not exist
          errorCode === '42P01' || // PostgreSQL undefined_table
          errorMessage.includes('"houses"') && errorMessage.includes('doesn\'t exist')) {
        
        const specificError = 'The houses table does not exist in the database. Please run the database migration to create it.';
        console.error('Table does not exist error detected:', specificError);
        return { 
          success: false, 
          error: specificError, 
          tableExists: false,
          needsMigration: true
        };
      }
      
      // If error is empty or generic, it's likely the table doesn't exist
      if (!errorMessage || errorMessage === '{}' || Object.keys(error).length === 0) {
        console.log('Generic error detected - houses table likely doesn\'t exist');
        return {
          success: false,
          error: 'The houses table does not exist in the database. Please run the database migration to create it.\n\nTo fix this:\n1. Go to your Supabase dashboard\n2. Navigate to SQL Editor\n3. Run the houses table migration\n4. Try again',
          tableExists: false,
          needsMigration: true
        };
      }
      
      // For other errors, return the original error message
      const fallbackError = error.message || 'Unknown database error';
      console.error('Other database error:', fallbackError);
      return { 
        success: false, 
        error: fallbackError, 
        tableExists: false,
        needsMigration: false
      };
    }
    
    console.log('Houses table test successful:', data);
    return { success: true, tableExists: true, data };
  } catch (error) {
    console.error('Error testing houses table:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test houses table',
      tableExists: false,
      needsMigration: false
    };
  }
}
