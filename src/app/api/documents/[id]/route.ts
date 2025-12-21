import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { vectorStore } from "@/lib/vector-store";

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const id = params.id;

        // 1. Find document to get the name/source
        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // 2. Remove from Vector Store
        // The store is synchronous/in-memory+file based in this implementation
        vectorStore.deleteDocumentsBySource(document.name);

        // 3. Remove from Database
        await prisma.document.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete document error:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
