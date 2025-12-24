
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Upload, RefreshCw } from "lucide-react";

interface Document {
  id: string;
  name: string;
  source: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/admin/documents");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDocuments(data.documents);
    } catch (e) {
      toast.error("マニュアル一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!title || !content) {
        toast.error("タイトルと本文は必須です");
        return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Failed");
      
      const data = await res.json();
      toast.success(`${data.count}件のチャンクを登録しました`);
      
      setTitle("");
      setContent("");
      fetchDocuments();
    } catch (e) {
      toast.error("マニュアルの登録に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">マニュアル管理</h2>
        <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>新規マニュアル登録</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">タイトル（ファイル名/出典）</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="例：2024年度 社員ハンドブック"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">本文</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ここにマニュアルのテキストを貼り付けてください..."
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <Button onClick={handleUpload} disabled={uploading} className="w-full gap-2">
              <Upload className="w-4 h-4" />
              {uploading ? "登録処理中..." : "登録して学習させる"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>登録済みマニュアル一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="p-4 text-center text-gray-500">読み込み中...</div>
              ) : documents.length === 0 ? (
                <div className="p-4 text-center text-gray-500">登録されたマニュアルはありません</div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-medium text-sm truncate">{doc.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
