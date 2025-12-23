"use client";

import { useState } from "react";
import { 
    Plus, 
    MessageSquare, 
    Settings, 
    Search,
    FileText,
    MoreHorizontal,
    Trash2,
    Database,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

import { Message } from "@/types";

interface SidebarProps {
    conversations: { id: string; title: string; messages: Message[] }[]; // Update to include messages for filtering
    activeId: string;
    onSelectConversation: (id: string) => void;
    onNewChat: () => void;
    onDeleteConversation: (id: string, e: React.MouseEvent) => void;
    onRenameConversation: (id: string, newTitle: string) => void;
    onOpenKnowledgeBase: () => void;
    onClearConversations: () => void;
}

export default function Sidebar({ 
    conversations, 
    activeId, 
    onSelectConversation, 
    onNewChat, 
    onDeleteConversation,
    onRenameConversation,
    onOpenKnowledgeBase,
    onClearConversations,
    userEmail = "guest@example.com",
    onSignOut
}: SidebarProps & { userEmail?: string; onSignOut?: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(id);
      setEditTitle(currentTitle);
  };

  const saveTitle = (id: string) => {
      onRenameConversation(id, editTitle);
      setEditingId(null);
  };

  // Theme Selector Component
  function ThemeSelector() {
    const { setTheme, theme } = useTheme();

    return (
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-full">
        {["light", "dark", "system"].map((mode) => (
          <button
            key={mode}
            onClick={() => setTheme(mode)}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
              theme === mode 
                ? "bg-white text-primary shadow-sm" 
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {mode === "system" ? "端末設定" : mode === "light" ? "ライト" : "ダーク"}
          </button>
        ))}
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter') {
          saveTitle(id);
      }
  };

  return (
    <Dialog>
      <div className="h-screen py-4 pl-4 pr-2 flex flex-col shrink-0 w-[280px]">
        {/* Floating Sidebar Card */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="p-6 pb-2">
              <h1 className="text-xl font-bold tracking-tight mb-6">Aicomee.chat</h1>
              
               <div className="mb-6">
                  <Button onClick={onNewChat} className="w-full rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-10">
                      <Plus className="w-4 h-4 mr-2" />
                      新しいチャット
                  </Button>
              </div>
  
              <div className="flex items-center justify-between text-xs font-medium text-gray-400 px-1 mb-2">
                  <span>履歴</span>
                  <button className="text-primary hover:underline cursor-pointer" onClick={onClearConversations}>履歴を削除</button>
              </div>
          </div>
  
          {/* List */}
          <ScrollArea className="flex-1 px-4">
              <div className="space-y-1">
                  {conversations
                    .filter(chat => chat.messages.length > 0) // Hide empty chats from history
                    .map((chat) => (
                      <button
                          key={chat.id}
                          onClick={() => onSelectConversation(chat.id)}
                          className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 group relative",
                              activeId === chat.id 
                                  ? "bg-primary/5 text-primary font-medium" 
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                      >
                          <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                          
                          {editingId === chat.id ? (
                              <input 
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onBlur={() => saveTitle(chat.id)}
                                  onKeyDown={(e) => handleKeyDown(e, chat.id)}
                                  autoFocus
                                  className="bg-transparent outline-none min-w-0 flex-1 border-b border-primary/20"
                                  onClick={(e) => e.stopPropagation()}
                              />
                          ) : (
                              <span className="truncate text-left flex-1">{chat.title}</span>
                          )}
                          
                          {(activeId === chat.id || true) && ( // Always show on hover via group
                               <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm rounded-lg p-0.5">
                                  <span className="p-1 hover:text-red-500 cursor-pointer" onClick={(e) => onDeleteConversation(chat.id, e)}>
                                      <Trash2 className="w-3 h-3"/>
                                  </span>
                                  <span className="p-1 hover:text-black cursor-pointer" onClick={(e) => startEditing(chat.id, chat.title, e)}>
                                      <MoreHorizontal className="w-3 h-3"/>
                                  </span>
                               </div>
                          )}
                      </button>
                  ))}
              </div>
              
              {/* Upload Area styled as a menu item */}
              <div className="mt-6 px-1">
                  <div className="text-xs font-medium text-gray-400 mb-2">管理者メニュー</div>
                  <button 
                    onClick={onOpenKnowledgeBase}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 cursor-pointer border border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 text-gray-600"
                  )}>
                      <Database className="w-4 h-4 text-gray-400"/>
                      <span>マニュアル管理</span>
                  </button>
              </div>
  
          </ScrollArea>
  
          {/* Footer */}
          <div className="p-4 mt-auto space-y-2">
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 rounded-2xl h-12 px-4 hover:bg-gray-50 text-gray-600">
                    <Settings className="w-5 h-5" />
                    設定
                </Button>
              </DialogTrigger>
              
              <div className="group relative">
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-gray-100 bg-white shadow-sm mt-2 hover:shadow-md transition-shadow">
                    <Avatar className="h-8 w-8">
                        {/* Use email initial */}
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                          {userEmail?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-semibold truncate" title={userEmail}>{userEmail}</div>
                        <div className="text-xs text-gray-400">User</div>
                    </div>
                </div>
                
                {onSignOut && (
                  <button 
                    onClick={onSignOut}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full shadow-sm hover:bg-red-100"
                  >
                    Logout
                  </button>
                )}
              </div>
          </div>
        </div>
      </div>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>
            アプリケーションの設定を変更します。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">テーマ</h3>
            <ThemeSelector />
          </div>
          <div className="pt-4 border-t">
              <Button variant="destructive" onClick={onSignOut} className="w-full">
                  ログアウト
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
