import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { vectorStore } from '@/lib/vector-store';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const supabase = await createClient(); 
    const { user } = await getCurrentUser(supabase);

    if (!user || !(await isAdmin(supabase, user.email || ''))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { title, content } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

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
