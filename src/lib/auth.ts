import { createClient } from '@/lib/supabase/client' // Use client-side for middleware compatibility if needed, or server for server components. 
// For middleware, we usually need createServerClient but simpler to just use REST via standard fetch or just use the supabase js lib which works in edge.
// However, to keep it simple and consistent with middleware usage, let's use a specialized function that takes a client.

export type UserRole = 'ADMIN' | 'USER' | null

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
