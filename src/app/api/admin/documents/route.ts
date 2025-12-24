import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { vectorStore } from '@/lib/vector-store';
import { PrismaClient } from '@prisma/client';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const supabase = await createClient(); 
    const { user } = await getCurrentUser(supabase);

    if (!user || !(await isAdmin(supabase, user.email || ''))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        let content = '';

        if (file.type === 'application/pdf') {
            try {
                const loader = new WebPDFLoader(file);
                const docs = await loader.load();
                content = docs.map(d => d.pageContent).join('\n\n');
            } catch (pdfError) {
                console.error("PDF Parsing Error:", pdfError);
                return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 400 });
            }
        } else {
            // Assume text/plain or markdown
            const buffer = Buffer.from(await file.arrayBuffer());
            content = buffer.toString('utf-8');
        }

        if (!content.trim()) {
             return NextResponse.json({ error: 'No text content found in file' }, { status: 400 });
        }

        const title = file.name;

        // 1. Clean up existing Document records (Idempotency)
        const existingDocs = await prisma.document.findMany({ where: { name: title } });
        for (const d of existingDocs) {
             await prisma.document.delete({ where: { id: d.id } });
        }

        // 2. Create Document Record in Prisma
        const doc = await prisma.document.create({
            data: {
                name: title,
                source: title, 
            }
        });

        // 3. Chunking (Standardized)
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        
        const splitDocs = await splitter.createDocuments([content]);
        const texts = splitDocs.map(d => d.pageContent);
        
        // 4. Delete old vectors (Idempotency)
        await vectorStore.deleteDocumentsBySource(title);
        
        // 5. Add to Vector Store
        const metadata = texts.map(() => ({ source: title, docId: doc.id }));
        await vectorStore.addDocuments(texts, metadata);
        
        return NextResponse.json({ success: true, count: texts.length });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to ingest document' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient(); 
    const { user } = await getCurrentUser(supabase);

    if (!user || !(await isAdmin(supabase, user.email || ''))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        // 1. Delete from Vector Store
        await vectorStore.deleteDocumentsByDocId(id);

        // 2. Delete from Prisma
        await prisma.document.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const supabase = await createClient(); 
    const { user } = await getCurrentUser(supabase);

    if (!user || !(await isAdmin(supabase, user.email || ''))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const docs = await prisma.document.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ documents: docs });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}
