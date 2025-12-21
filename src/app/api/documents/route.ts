import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
        orderBy: { createdAt: 'desc' }
    });
    // Return just names to match frontend expectation for now, or objects
    // Frontend expects { documents: string[] } currently
    return NextResponse.json({ 
        documents: documents.map(d => ({
            id: d.id,
            name: d.name,
            createdAt: d.createdAt
        })) 
    });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
