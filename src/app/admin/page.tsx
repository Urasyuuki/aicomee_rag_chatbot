
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Users, FileText, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">ダッシュボード</h2>
        <p className="text-muted-foreground">
          AIチャットボットの設定とメンバー管理を行います。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/members">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                メンバー管理
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">ユーザー設定</div>
                <p className="text-xs text-muted-foreground">
                アカウントの追加・削除・権限変更
                </p>
                <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    メンバー管理へ <ArrowRight className="ml-1 w-4 h-4" />
                </div>
            </CardContent>
            </Card>
        </Link>
        
        <Link href="/admin/documents">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                マニュアル管理
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">ナレッジベース</div>
                <p className="text-xs text-muted-foreground">
                RAG用マニュアルの登録・更新
                </p>
                <div className="mt-4 flex items-center text-sm text-primary font-medium">
                    マニュアル管理へ <ArrowRight className="ml-1 w-4 h-4" />
                </div>
            </CardContent>
            </Card>
        </Link>
      </div>
    </div>
  );
}
