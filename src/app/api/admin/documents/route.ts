import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { vectorStore } from '@/lib/vector-store';
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import * as pdfLib from 'pdf-parse';

// Handle potential default export wrapping
// @ts-ignore
const pdf = pdfLib.default || pdfLib;

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

        const buffer = Buffer.from(await file.arrayBuffer());
        let content = '';

        if (file.type === 'application/pdf') {
            const data = await pdf(buffer);
            content = data.text;
        } else {
            // Assume text/plain or markdown
            content = buffer.toString('utf-8');
        }

        if (!content.trim()) {
             return NextResponse.json({ error: 'No text content found in file' }, { status: 400 });
        }

        const title = file.name;

        // 1. Create Document Record in Prisma (for metadata listing)
        const doc = await prisma.document.create({
            data: {
                name: title,
                source: title, // Simplified source ID
            }
        });

        // 2. Chunking (Simple implementation)
        // Split by double newline or chunks of N chars
        const chunks = content.split(/\n\s*\n/).filter((c: string) => c.trim().length > 0);
        
        // 3. Add to Vector Store
        // vectorStore.addDocuments expects list of texts and metadata
        const metadata = chunks.map(() => ({ source: title, docId: doc.id }));
        
        await vectorStore.addDocuments(chunks, metadata);
        
        return NextResponse.json({ success: true, count: chunks.length });

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
