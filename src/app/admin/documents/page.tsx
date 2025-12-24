
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Upload, RefreshCw, Trash2, X, Check, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

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
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDocuments = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadStatus('idle');
    setTotalCount(acceptedFiles.length);
    setProcessedCount(0);
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch("/api/admin/documents", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Failed");
            successCount++;
        
        } catch (e) {
            console.error(e);
            errorCount++;
        }
        
        setProcessedCount(prev => prev + 1);
    }

    if (errorCount === 0) {
        setUploadStatus('success');
        toast.success(`${successCount}件のファイルを登録しました`);
    } else if (successCount > 0) {
        setUploadStatus('success'); // Partially successful
        toast.warning(`${successCount}件成功、${errorCount}件失敗しました`);
    } else {
        setUploadStatus('error');
        toast.error("すべてのファイルの登録に失敗しました");
    }

    fetchDocuments();
    
    setTimeout(() => {
        setUploadStatus('idle');
        setUploading(false);
        setTotalCount(0);
    }, 2000);

  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt', '.md'],
      'application/pdf': ['.pdf']
    },
    // maxFiles removed 
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} を削除してもよろしいですか？`)) return;

    try {
        const res = await fetch(`/api/admin/documents?id=${id}`, {
            method: 'DELETE',
        });
        
        if (!res.ok) throw new Error("Failed");
        
        toast.success("削除しました");
        fetchDocuments();
    } catch(e) {
        toast.error("削除に失敗しました");
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
          <CardContent>
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                min-h-[300px] flex flex-col items-center justify-center gap-4
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
              `}
            >
              <input {...getInputProps()} />
              
              <AnimatePresence mode="wait">
                {uploading ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center gap-4"
                  >
                    {uploadStatus === 'idle' && (
                        <>
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <Loader2 className="w-16 h-16 text-blue-500" />
                            </motion.div>
                            <p className="text-sm font-medium">アップロード中... ({processedCount}/{totalCount})</p>
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 transition-all duration-300" 
                                    style={{ width: `${(processedCount / totalCount) * 100}%` }}
                                />
                            </div>
                        </>
                    )}
                    {uploadStatus === 'success' && (
                        <>
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-green-100 p-4 rounded-full"
                            >
                                <Check className="w-8 h-8 text-green-600" />
                            </motion.div>
                            <p className="text-sm font-medium text-green-600">登録完了！</p>
                        </>
                    )}
                    {uploadStatus === 'error' && (
                        <>
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-red-100 p-4 rounded-full"
                            >
                                <X className="w-8 h-8 text-red-600" />
                            </motion.div>
                            <p className="text-sm font-medium text-red-600">エラーが発生しました</p>
                        </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="bg-blue-50 p-4 rounded-full">
                        <Upload className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-medium">ファイルをドラッグ＆ドロップ</p>
                        <p className="text-xs text-gray-500">または クリックしてファイルを選択</p>
                        <p className="text-xs text-blue-500 font-medium">複数ファイル選択可能</p>
                    </div>
                    <p className="text-xs text-gray-400">
                        対応形式: .txt, .md, .pdf
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <div className="font-medium text-sm truncate">{doc.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => handleDelete(doc.id, doc.name)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
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
