import { createClient } from "@/lib/supabase/server";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, FileText, LayoutDashboard, LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);

  if (!user || !(await isAdmin(supabase, user.email || ''))) {
    redirect("/"); // Or unauthorized
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            管理パネル
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin/members">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Users className="w-4 h-4" />
              メンバー管理
            </Button>
          </Link>
          <Link href="/admin/documents">
            <Button variant="ghost" className="w-full justify-start gap-3">
              <FileText className="w-4 h-4" />
              マニュアル管理
            </Button>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <Link href="/">
            <Button variant="outline" className="w-full justify-start gap-3 text-gray-600">
              <LogOut className="w-4 h-4" />
              チャットに戻る
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
