import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import EngagementProvider from "@/components/engagement/EngagementProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header email={user.email || ""} />
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <EngagementProvider userId={user.id}>
            {children}
          </EngagementProvider>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
