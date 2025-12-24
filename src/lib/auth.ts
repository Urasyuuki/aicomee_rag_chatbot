
import { createClient } from '@/lib/supabase/client' 

export type UserRole = 'ADMIN' | 'USER' | null

// Local Development Mock User
export interface MockUser {
    id: string;
    email: string;
    role?: string;
}

export async function getCurrentUser(supabase: any): Promise<{ user: MockUser | null, role: UserRole }> {
    // 1. Try Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        const role = await getUserRole(supabase, user.email || '');
        return { user: { id: user.id, email: user.email || '' }, role };
    }

    // 2. Try Local Bypass (Only in Development)
    if (process.env.NODE_ENV === 'development') {
        // Access cookies via document (client) or request headers (server) is tricky here 
        // because this function is shared.
        // Assuming this is called in Contexts where we can't easily access cookies directly without helpers.
        // HOWEVER, for Client Components, we can check document.cookie.
        // For Server Components/Routes, we usually pass supabase client which might contain cookies if configured,
        // but Supabase client won't automatically parse our custom cookie.
        
        // Simpler approach: relying on the caller to handle bypass if Supabase auth fails?
        // No, we want a unified accessor.
        
        // Let's rely on a helper that attempts to read the cookie if we are in environment that supports it.
        let bypassEmail: string | null = null;

        if (typeof document !== 'undefined') {
            // Client-side
            const match = document.cookie.match(/local-auth-bypass=([^;]+)/);
            if (match) bypassEmail = decodeURIComponent(match[1]);
        } else {
             // Server-side: 'supabase' client created with cookies() usually has internal access,
             // but strictly speaking we can't get custom cookies easily from the supabase client instance itself.
             // We might need to pass the cookie value or use `cookies()` from next/headers if on server.
             try {
                 const { cookies } = require('next/headers');
                 const cookieStore = await cookies();
                 const bypassCookie = cookieStore.get('local-auth-bypass');
                 if (bypassCookie) bypassEmail = bypassCookie.value;
             } catch (e) {
                 // Ignore error if not in server context or cookies() not available
             }
        }

        if (bypassEmail) {
            const role = await getUserRole(supabase, bypassEmail);
            // Only return if valid allowed user
            if (role) {
                return { 
                    user: { id: 'mock-id-' + bypassEmail, email: bypassEmail }, 
                    role 
                };
            }
        }
    }

    return { user: null, role: null };
}

// This function needs to work in Middleware (Edge) and Server Components.
// In Middleware, we already have a supabase client instance.
export async function getUserRole(supabase: any, email: string): Promise<UserRole> {
  if (!email) return null;
  
  try {
    // Direct Query to 'AllowedUser' table via Supabase
    const { data, error } = await supabase
      .from('AllowedUser')
      .select('role, isActive')
      .eq('email', email)
      .single();

    if (error || !data || !data.isActive) {
      if(error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
          console.error('Error fetching user role:', error);
      }
      return null;
    }

    return data.role as UserRole;
  } catch (error) {
    console.error('Unexpected error fetching user role:', error);
    return null;
  }
}

export async function isAllowedUser(supabase: any, email: string): Promise<boolean> {
  const role = await getUserRole(supabase, email);
  return role !== null;
}

export async function isAdmin(supabase: any, email: string): Promise<boolean> {
  const role = await getUserRole(supabase, email);
  return role === 'ADMIN';
}
