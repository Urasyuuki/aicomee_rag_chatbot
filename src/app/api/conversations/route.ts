import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
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
        const { id, action } = await req.json();
        
        if (action === 'deleteAll') {
            await prisma.conversation.deleteMany({});
            return NextResponse.json({ success: true });
        }

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.conversation.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { id, title } = await req.json();
        await prisma.conversation.update({
            where: { id },
            data: { title }
        });
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
