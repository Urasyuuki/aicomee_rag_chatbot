"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import KnowledgeBase from "@/components/KnowledgeBase";

interface Message {
  role: "user" | "model";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "New Chat", messages: [] },
  ]);
  const [activeId, setActiveId] = useState("1");
  const [viewMode, setViewMode] = useState<"chat" | "knowledge">("chat");
  const [loading, setLoading] = useState(false);

  // Check if we are already in an empty chat to avoid creating duplicates
  const activeConversation = conversations.find((c) => c.id === activeId) || conversations[0];

  useEffect(() => {
    // Fetch conversations on load
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
          // Set active to the most recent one
          setActiveId(data.conversations[0].id);
        } else {
            // No conversations, keep default "New Chat"
        }
      })
      .catch((err) => console.error("Failed to load history", err));
  }, []);

  const handleNewChat = () => {
    setViewMode("chat");
    // If current conversation is empty, just stick with it (or find existing empty one)
    const existingEmpty = conversations.find(c => c.messages.length === 0);
    if (existingEmpty) {
        setActiveId(existingEmpty.id);
        return;
    }

    const newId = crypto.randomUUID();
    const newChat: Conversation = { id: newId, title: "New Chat", messages: [] };
    setConversations((prev) => [newChat, ...prev]); // Add to top
    setActiveId(newId);
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
        body: JSON.stringify({ message: content, conversationId: activeId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || res.statusText);
      }

      // Handle Sources from Header
      const sourcesHeader = res.headers.get("X-Sources");
      const sources = sourcesHeader ? JSON.parse(sourcesHeader) : [];

      // ... existing stream logic ...
      // Initialize empty bot message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, { role: "model", content: "" }] }
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

    } catch (err: any) {
      console.error(err);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, { role: "model", content: `Error: ${err.message || "Could not reach server."}` }] }
            : c
        )
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
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onOpenKnowledgeBase={handleOpenKnowledgeBase}
          onClearConversations={handleClearConversations}
      />
      <div className="flex-1 h-full relative">
        {viewMode === "chat" ? (
            <ChatInterface 
                messages={activeConversation.messages}
                loading={loading}
                onSendMessage={handleSendMessage}
            />
        ) : (
            <KnowledgeBase />
        )}
      </div>
    </main>
  );
}
