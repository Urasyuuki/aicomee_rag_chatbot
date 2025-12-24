
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin, getCurrentUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

export async function GET(req: NextRequest) {
    const supabase = await createClient(); 
    const { user } = await getCurrentUser(supabase);

    if (!user || !(await isAdmin(supabase, user.email || ''))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    try {
        const members = await prisma.allowedUser.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ members });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const supabase = await createClient(); 
    const { user } = await getCurrentUser(supabase);

    if (!user || !(await isAdmin(supabase, user.email || ''))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { email, role } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

        const newMember = await prisma.allowedUser.create({
            data: {
                email,
                role: role || 'USER',
                isActive: true
            }
        });
        return NextResponse.json({ member: newMember });

    } catch (e) {
        return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
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
        
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await prisma.allowedUser.delete({ where: { id } });
        return NextResponse.json({ success: true });

    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
    }
}
