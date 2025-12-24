'use client'

import { Button } from '@/components/ui/button'
import { ShieldAlert, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function UnauthorizedPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    // 1. Clear Supabase Session
    await supabase.auth.signOut()

    // 2. Clear Mock Auth Cookie (if any)
    document.cookie = `local-auth-bypass=; path=/; max-age=0`

    toast.success('ログアウトしました')
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-red-100">
        <div className="flex justify-center mb-6">
          <div className="bg-red-50 p-4 rounded-full">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">アクセス権限がありません</h1>
        <p className="text-gray-600 mb-8">
          このアプリケーションを利用するには、管理者による承認（登録）が必要です。
          心当たりがある場合は、管理者に連絡してください。
        </p>
        <div className="space-y-3">
            <Button onClick={handleLogout} variant="outline" className="w-full gap-2">
                <LogOut className="w-4 h-4" />
                ログアウトして戻る
            </Button>
        </div>
      </div>
    </div>
  )
}
