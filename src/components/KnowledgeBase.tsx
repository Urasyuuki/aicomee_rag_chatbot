"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Loader2, RefreshCw, CheckCircle, XCircle, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Document {
    id: string;
    name: string;
    createdAt: string;
    status: 'success' | 'uploading' | 'error'; // local status extension
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // View Content State
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sourceContent, setSourceContent] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  const fetchDocuments = async () => {
    // specific loading state for refresh button to avoid full flicker if desired, 
    // but simple setLoading(true) is fine for now
    try {
      const res = await fetch("/api/documents", { cache: "no-store" });
      const data = await res.json();
      if (data.documents) {
        // Map API response to Document interface with 'success' status
        setDocuments(data.documents.map((d: any) => ({
            ...d,
            status: 'success'
        })));
      }
    } catch (err) {
      console.error(err);
      toast.error("ドキュメントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const file = e.target.files[0];
    setUploading(true);
    
    // Add optimistic document
    const optimisticId = "temp-" + Date.now();
    const optimisticDoc: Document = {
        id: optimisticId,
        name: file.name,
        createdAt: new Date().toISOString(),
        status: 'uploading'
    };
    
    setDocuments(prev => [optimisticDoc, ...prev]);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("/api/ingest", {
            method: "POST",
            body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");
        
        // Success
        toast.success(`ファイル '${file.name}' をアップロードしました`);
        // Refresh to get real ID and data
        await fetchDocuments();
    } catch (err) {
        console.error(err);
        // Update optimistic doc to error
        setDocuments(prev => prev.map(d => d.id === optimisticId ? { ...d, status: 'error' } : d));
        toast.error("アップロードに失敗しました");
    } finally {
        setUploading(false);
        e.target.value = "";
    }
  };


  const handleViewSource = async (source: string) => {
      setSelectedSource(source);
      setLoadingSource(true);
      setSourceContent(null);
      try {
          const res = await fetch("/api/documents/content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ source })
          });
          if (res.ok) {
              const data = await res.json();
              setSourceContent(data.content);
          } else {
              setSourceContent("Failed to load content.");
          }
      } catch (e) {
          setSourceContent("Error loading content.");
      } finally {
          setLoadingSource(false);
      }
  };

  const openDeleteModal = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(doc.id);
    setDeleteName(doc.name);
  }

  const confirmDelete = async () => {
    if (!deleteId) return;

    const id = deleteId;
    setDeleteId(null); // Close modal immediately

    // Optimistic delete
    const previousDocs = [...documents];
    setDocuments(prev => prev.filter(d => d.id !== id)); 

    try {
        const res = await fetch(`/api/documents/${id}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Delete failed");
        toast.success("ドキュメントを削除しました");
    } catch (err) {
        console.error(err);
        toast.error("削除に失敗しました");
        setDocuments(previousDocs); // Revert
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background p-8 relative">
      
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">本当に削除しますか？</h3>
                    <p className="text-gray-500">
                        「{deleteName}」を完全に削除します。<br/>
                        この操作は取り消せません。
                    </p>
                    <div className="flex gap-3 w-full mt-4">
                        <Button 
                            variant="outline" 
                            className="flex-1 rounded-xl h-11"
                            onClick={() => setDeleteId(null)}
                        >
                            キャンセル
                        </Button>
                        <Button 
                            variant="destructive" 
                            className="flex-1 rounded-xl h-11 bg-red-500 hover:bg-red-600"
                            onClick={confirmDelete}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            削除する
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">ナレッジ登録</h2>
                <p className="text-gray-500 mt-2">チャットボットの学習データを管理します。</p>
            </div>
            
            <label className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors shadow-md",
                uploading ? "bg-gray-100 text-gray-400 pointer-events-none" : "bg-primary text-white hover:bg-primary/90"
            )}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>}
                <span className="font-medium">{uploading ? "アップロード中..." : "ファイルをアップロード"}</span>
                <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleFileUpload} />
            </label>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary"/>
                    登録済みデータ ({documents.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={fetchDocuments} disabled={loading}>
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-100/50 text-sm font-medium text-gray-500">
                <div className="col-span-1 text-center">結果</div>
                <div className="col-span-6">データタイトル</div>
                <div className="col-span-3">登録日</div>
                <div className="col-span-2 text-center">削除</div>
            </div>

            <ScrollArea className="h-[600px]">
                {loading && documents.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2"/>
                        データを読み込み中...
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-400 space-y-3">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-300"/>
                        </div>
                        <p>データが登録されていません。</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {documents.map((doc) => (
                            <div key={doc.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                {/* Result / Status */}
                                <div className="col-span-1 flex justify-center">
                                    {doc.status === 'uploading' && <Loader2 className="w-5 h-5 text-primary animate-spin"/>}
                                    {doc.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500"/>}
                                    {doc.status === 'error' && <XCircle className="w-5 h-5 text-red-500"/>}
                                </div>
                                
                                {/* Title */}
                                <div 
                                    className="col-span-6 font-medium text-gray-700 truncate cursor-pointer hover:text-primary hover:underline transition-colors" 
                                    title={doc.name}
                                    onClick={() => handleViewSource(doc.name)}
                                >
                                    {doc.name}
                                </div>

                                {/* Date */}
                                <div className="col-span-3 text-sm text-gray-500">
                                    {doc.createdAt ? new Date(doc.createdAt).toLocaleString('ja-JP') : '-'}
                                </div>

                                {/* Delete */}
                                <div className="col-span-2 flex justify-center">
                                    <Button 
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => openDeleteModal(doc, e)}
                                        className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        disabled={doc.status === 'uploading'}
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                    
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
      </div>
      
      {/* Source Viewer Modal */}
      <Dialog open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary"/>
                {selectedSource}
            </DialogTitle>
            <DialogDescription>
                Document Content Viewer
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-gray-50 p-4 rounded-md border text-sm font-mono whitespace-pre-wrap">
              {loadingSource ? (
                  <div className="flex items-center justify-center h-full text-gray-400">Loading content...</div>
              ) : (
                  sourceContent
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
