import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, surname } = await request.json();

    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: surname,
          role: 'landlord'
        }
      }
    });

    if (authError?.message.includes('rate limit')) {
      return NextResponse.json({ 
        error: 'Rate limit reached. This is a Supabase limitation. Please wait 1 hour or try a different email/IP.' 
      }, { status: 429 });
    }

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create user profile in database with correct role
    if (authData.user) {
      const userData = {
        auth_user_id: authData.user.id,
        email,
        first_name: firstName || '',
        last_name: surname || '',
        display_name: `${firstName || ''} ${surname || ''}`.trim(),
        role: 'landlord',
        role_id: 2,
        status: 'pending_verification',
        is_verified: false
      };

      const { error: profileError } = await supabase
        .from('users')
        .upsert(userData as any, { onConflict: 'auth_user_id' });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        return NextResponse.json({
          error: `Account created but profile failed: ${profileError.message}`
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Registration successful! Please check your email for verification.',
        user: authData.user,
        profileCreated: !profileError
      });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
}
