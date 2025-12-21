"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Pencil, ThumbsUp, ThumbsDown, Copy, FileText, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface Message {
  role: "user" | "model";
  content: string;
  sources?: string[];
}

interface ChatInterfaceProps {
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string) => void;
}

export default function ChatInterface({ messages, loading, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sourceContent, setSourceContent] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative selection:bg-primary/20">
      
      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-40">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-8">
                    <div className="space-y-4">
                        <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100 mx-auto">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Aicomee.chat へようこそ！</h2>
                            <p className="text-gray-500 mt-2">質問の例を選ぶか、下の入力欄から自由に聞いてください。</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
                        {/* Manual / RAG Examples */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left pl-1">
                                📘 社内マニュアル・ルール
                            </h3>
                            <div className="flex flex-col gap-2">
                                {[
                                    "勤務時間と休憩について教えて",
                                    "リモートワークの申請方法は？",
                                    "有給休暇の取得ルールは？"
                                ].map((q, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => onSendMessage(q)}
                                        className="text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-sm font-medium text-gray-700 shadow-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* General AI Examples */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left pl-1">
                                🤖 業務サポート・相談
                            </h3>
                            <div className="flex flex-col gap-2">
                                {[
                                    "良いメールの書き出しを考えて",
                                    "PythonでCSVを読み込むコード書いて",
                                    "会議のアジェンダを作成して"
                                ].map((q, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => onSendMessage(q)}
                                        className="text-left p-3 rounded-xl bg-white border border-gray-200 hover:border-blue-400/50 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-medium text-gray-700 shadow-sm"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {messages.map((msg, idx) => (
            <div key={idx} className="group mb-10 last:mb-0">
                <div className={cn("flex gap-4", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0 border border-gray-100 shadow-sm bg-white">
                        {msg.role === "model" ? (
                             <AvatarImage src="/bot-avatar.png" className="p-2" /> // Fallback if no image
                        ) : (
                             <AvatarImage src="/user-avatar.png" />
                        )}
                         <AvatarFallback className={cn(
                             "text-sm font-bold", 
                             msg.role === "model" ? "text-primary bg-primary/5" : "text-gray-600 bg-gray-100"
                         )}>
                             {msg.role === "model" ? <Sparkles className="w-5 h-5"/> : "U"}
                         </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1">
                             <span className="text-sm font-semibold text-gray-900">
                                 {msg.role === "model" ? "AI アシスタント" : "あなた"}
                             </span>
                             {msg.role === "model" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">BOT</span>}
                        </div>

                        <div className="text-[15px] leading-7 text-gray-700">
                            {msg.role === "user" ? (
                                <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-md shadow-primary/20 font-medium">
                                    {msg.content}
                                </div>
                            ) : (
                                <div className="prose prose-slate max-w-none prose-p:leading-7 prose-headings:font-bold prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 rounded-lg">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            )}
                            
                            {/* Sources Display */}
                            {msg.role === "model" && msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {msg.sources.map((source, i) => (
                                        <Button 
                                            key={i} 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 text-xs gap-1.5 text-gray-500 bg-white border-gray-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                            onClick={() => handleViewSource(source)}
                                        >
                                            <FileText className="w-3 h-3" />
                                            {source}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions (Model Only) */}
                        {msg.role === "model" && (
                            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-lg"><ThumbsUp className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-lg"><ThumbsDown className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-lg"><Copy className="w-4 h-4" /></Button>
                                <div className="flex-1" />
                                <Button variant="ghost" size="sm" className="h-8 gap-2 text-gray-400 hover:text-gray-600 rounded-lg text-xs">
                                     再生成
                                </Button>
                            </div>
                        )}
                        {/* Edit Icon (User Only) */}
                        {msg.role === "user" && (
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-gray-500 rounded-full absolute -left-8 top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Pencil className="w-3 h-3" />
                             </Button>
                        )}
                    </div>
                </div>
            </div>
            ))}
            
            {loading && (
                 <div className="flex gap-4 mb-10">
                    <Avatar className="h-10 w-10 shrink-0 border border-gray-100 shadow-sm bg-white">
                         <AvatarFallback className="text-primary bg-primary/5">
                             <Sparkles className="w-5 h-5 animate-pulse"/>
                         </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 mt-2">
                        <div className="h-2 w-24 bg-gray-200 rounded-full animate-pulse"/>
                        <div className="h-2 w-16 bg-gray-200 rounded-full animate-pulse"/>
                    </div>
                 </div>
            )}
            <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Floating Input Area */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <div className="max-w-3xl mx-auto">
             <div className="relative flex items-center gap-2 p-2 bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
                <div className="pl-4 pr-2">
                    <div className="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                        <Sparkles className="w-4 h-4" />
                    </div>
                </div>
                
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="ここにメッセージを入力..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 font-medium h-12"
                />
                
                <Button 
                    onClick={handleSend}
                    size="icon"
                    disabled={!input.trim() || loading}
                    className={cn(
                        "h-10 w-10 rounded-full shrink-0 transition-all duration-300 shadow-md",
                        input.trim() ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-100 text-gray-400"
                    )}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </Button>
             </div>
             
             <div className="text-center text-[10px] text-gray-300 mt-3 font-medium tracking-wide pb-1">
                 AIは間違いを犯す可能性があります。重要な情報は必ず確認してください。
             </div>
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
