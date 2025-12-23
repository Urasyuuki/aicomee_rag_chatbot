import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: { messages: true },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, action } = await req.json();
        
        if (action === 'deleteAll') {
            await prisma.conversation.deleteMany({
                where: { userId: user.id }
            });
            return NextResponse.json({ success: true });
        }

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Ensure user owns the conversation
        const count = await prisma.conversation.count({
            where: { id, userId: user.id }
        });

        if (count === 0) {
            return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 404 });
        }

        await prisma.conversation.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, title } = await req.json();

        // Check ownership
        const count = await prisma.conversation.count({
             where: { id, userId: user.id }
        });

        if (count === 0) {
             return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 404 });
        }

        await prisma.conversation.update({
            where: { id },
            data: { title }
        });
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
