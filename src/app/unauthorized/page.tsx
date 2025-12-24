
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
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
            <Link href="/login" className="w-full block">
                <Button variant="outline" className="w-full">
                ログイン画面に戻る
                </Button>
            </Link>
        </div>
      </div>
    </div>
  )
}
