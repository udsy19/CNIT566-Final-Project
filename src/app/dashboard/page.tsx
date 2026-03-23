import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Ensure user row exists in our users table
  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userData) {
    // Create the user row on first visit
    await adminClient.from('users').upsert({
      id: user.id,
      email: user.email,
    }, { onConflict: 'id' });

    const { data: newUser } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return <DashboardContent user={newUser} />;
  }

  return <DashboardContent user={userData} />;
}
