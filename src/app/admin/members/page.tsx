
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, UserPlus, Shield } from "lucide-react";

interface Member {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  createdAt: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "USER">("USER");

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/admin/members");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMembers(data.members);
    } catch (e) {
      toast.error("メンバー一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("メンバーを追加しました");
      setNewEmail("");
      fetchMembers();
    } catch (e) {
      toast.error("メンバー追加に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除してもよろしいですか？")) return;
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("メンバーを削除しました");
      fetchMembers();
    } catch (e) {
      toast.error("メンバー削除に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">メンバー管理</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>登録済みユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="p-4 text-center text-gray-500">読み込み中...</div>
              ) : members.length === 0 ? (
                <div className="p-4 text-center text-gray-500">登録メンバーはいません</div>
              ) : (
                members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                        {member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{member.email}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {member.role === 'ADMIN' && <Shield className="w-3 h-3 text-amber-500" />}
                          {member.role === 'ADMIN' ? '管理者' : '一般ユーザー'}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>新規メンバー追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">メールアドレス</label>
              <Input 
                value={newEmail} 
                onChange={(e) => setNewEmail(e.target.value)} 
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">権限</label>
              <select 
                value={newRole} 
                onChange={(e) => setNewRole(e.target.value as "ADMIN" | "USER")}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                  <option value="USER">一般ユーザー</option>
                  <option value="ADMIN">管理者</option>
              </select>
            </div>
            <Button onClick={handleAdd} className="w-full gap-2">
              <UserPlus className="w-4 h-4" />
              追加する
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
