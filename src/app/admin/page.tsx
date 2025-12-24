
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileText, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your AI chatbot settings and members here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/members">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Manage Users</div>
                <p className="text-xs text-muted-foreground">
                Add, remove, and manage access roles
                </p>
                <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    Go to Members <ArrowRight className="ml-1 w-4 h-4" />
                </div>
            </CardContent>
            </Card>
        </Link>
        
        <Link href="/admin/documents">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                RAG Documents
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Knowledge Base</div>
                <p className="text-xs text-muted-foreground">
                Upload manuals and manage vectors
                </p>
                <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    Go to Documents <ArrowRight className="ml-1 w-4 h-4" />
                </div>
            </CardContent>
            </Card>
        </Link>
      </div>
    </div>
  );
}
