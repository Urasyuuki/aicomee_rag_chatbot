"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import KnowledgeBase from "@/components/KnowledgeBase";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Message, Conversation } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "New Chat", messages: [] },
  ]);
  const [activeId, setActiveId] = useState("1");
  const [viewMode, setViewMode] = useState<"chat" | "knowledge">("chat");
  const [loading, setLoading] = useState(false);

  const [selectedModel, setSelectedModel] = useState<"cloud" | "local">("local"); // Default to Local
  const [useRag, setUseRag] = useState(true); // Default to RAG ON
  const [userEmail, setUserEmail] = useState<string>("");
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Check if we are already in an empty chat to avoid creating duplicates
  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  useEffect(() => {
    // Fetch User & Role
    const getUser = async () => {
        console.log("Fetching user...");
        const { user: currentUser, role } = await getCurrentUser(supabase);
        console.log("getCurrentUser result:", { currentUser, role });
        
        if (currentUser) {
            setUserEmail(currentUser.email || "");
            if (role === 'ADMIN') {
                console.log("User is ADMIN");
                setIsAdminUser(true);
            } else {
                console.log("User is NOT ADMIN");
                setIsAdminUser(false);
            }
        }
    };
    getUser();

    // Fetch conversations on load
    fetch("/api/conversations")
      .then((res) => {
          if (res.status === 401) {
              // Middleware should handle this, but just in case
              return null; 
          }
          return res.json();
      })
      .then((data) => {
        if (!data) return; 
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
          // Set active to the most recent one
          setActiveId(data.conversations[0].id);
        } else {
            // No conversations, keep default "New Chat" with generated ID?
            // Actually, if fresh login, conversation list is empty.
            // We should ensure we have at least one empty chat.
             const newId = crypto.randomUUID();
             setConversations([{ id: newId, title: "New Chat", messages: [] }]);
             setActiveId(newId);
        }
      })
      .catch((err) => console.error("Failed to load history", err));
  }, []);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
  };

  const handleNewChat = () => {
    setViewMode("chat");
    // If current conversation is empty, just stick with it (or find existing empty one)
    const existingEmpty = conversations.find(c => c.messages.length === 0);
    if (existingEmpty) {
        setActiveId(existingEmpty.id);
        setUseRag(true); // Reset to default on new chat
        return;
    }

    const newId = crypto.randomUUID();
    const newChat: Conversation = { id: newId, title: "New Chat", messages: [] };
    setConversations((prev) => [newChat, ...prev]); // Add to top
    setActiveId(newId);
    setUseRag(true); // Reset to default on new chat
  };

  const handleSelectConversation = (id: string) => {
    setViewMode("chat");
    setActiveId(id);
  };
  
  const handleOpenKnowledgeBase = () => {
      setViewMode("knowledge");
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Optimistic update
      setConversations(prev => {
          const filtered = prev.filter(c => c.id !== id);
          // If we deleted the active one, switch to the last one or create new
          if (activeId === id) {
             if (filtered.length > 0) {
                 setActiveId(filtered[0].id); // Go to top (most recent)
             } else {
                 // Always keep at least one (even if empty) or handle empty state
                 const newId = crypto.randomUUID();
                 return [{ id: newId, title: "New Chat", messages: [] }];
             }
          }
          return filtered;
      });

      try {
          await fetch("/api/conversations", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id })
          });
      } catch (err) {
          console.error("Failed to delete conversation", err);
          // Ideally revert optimistic update here, but for now just log
      }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
      // Optimistic
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      
      try {
          await fetch("/api/conversations", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, title: newTitle })
          });
      } catch (err) {
          console.error("Failed to rename", err);
      }
  };
  
  const handleSendMessage = async (content: string) => {
    // Optimistic update
    const userMsg: Message = { role: "user", content };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? content.slice(0, 30) : c.title }
          : c
      )
    );
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass conversationId to backend for persistence
        body: JSON.stringify({ 
            message: content, 
            conversationId: activeId,
            model: selectedModel, // Send selected model
            useRag: useRag // Send RAG flag
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
            toast.error("Session expired. Please sign in again.");
            router.push("/login"); // Redirect
            return;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || res.statusText);
      }

      // Handle Sources & Model from Header
      const sourcesHeader = res.headers.get("X-Sources");
      const sources = sourcesHeader ? JSON.parse(sourcesHeader) : [];
      const modelUsed = res.headers.get("X-Model-Used") || "unknown";

      // ... existing stream logic ...
      // Initialize empty bot message with metadata
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, { role: "model", content: "", sources, modelUsed }] }
            : c
        )
      );

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        setConversations((prev) =>
            prev.map((c) => {
                if (c.id !== activeId) return c;
                const lastMsg = c.messages[c.messages.length - 1];
                if (lastMsg.role !== 'model') return c; // Should be model msg

                const updatedMessages = [...c.messages];
                updatedMessages[updatedMessages.length - 1] = {
                    ...lastMsg,
                    content: lastMsg.content + chunk
                };
                return { ...c, messages: updatedMessages };
            })
        );
      }

    } catch (err) {
      console.error(err);
      const error = err as any;
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          
          const lastMsg = c.messages[c.messages.length - 1];
          // If the last message is a partial model response, invoke error state on it or append error
          if (lastMsg && lastMsg.role === 'model') {
             return {
                 ...c,
                 messages: c.messages.map((m, i) => 
                    i === c.messages.length - 1 
                    ? { ...m, content: m.content + `\n\n[System Error: ${error.message}]` } 
                    : m
                 )
             };
          }
          
          // Otherwise (failed before starting response), add new error message
          return { 
              ...c, 
              messages: [...c.messages, { role: "model", content: `Error: ${error.message || "Could not reach server."}` }] 
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };


  const handleClearConversations = async () => {
      if (!confirm("Are you sure you want to delete all conversations?")) return;
      
      // Optimistic
      const newId = crypto.randomUUID();
      setConversations([{ id: newId, title: "New Chat", messages: [] }]);
      setActiveId(newId);

      try {
          await fetch("/api/conversations", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "deleteAll" })
          });
      } catch (err) {
          console.error("Failed to clear history", err);
      }
  };

  return (
    <main className="flex h-screen w-full bg-background overflow-hidden relative">
      <Sidebar 
          conversations={conversations} 
          activeId={activeId} 
          onSelectConversation={setActiveId}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onOpenKnowledgeBase={() => setViewMode("knowledge")}
          onClearConversations={handleClearConversations}
          userEmail={userEmail}
          isAdminUser={isAdminUser}
          onSignOut={async () => {
            console.log("Signing out...");
            await supabase.auth.signOut();
            // Clear bypass cookie
            document.cookie = `local-auth-bypass=; path=/; max-age=0`;
            router.push('/login');
            router.refresh();
        }}
      />
      <div className="flex-1 h-full relative">
        {viewMode === "chat" ? (
            <ChatInterface 
                messages={activeConversation.messages}
                loading={loading}
                onSendMessage={handleSendMessage}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                useRag={useRag}
                onToggleRag={setUseRag}
            />
        ) : (
            <KnowledgeBase />
        )}
      </div>
    </main>
  );
}
