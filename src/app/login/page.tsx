
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Local development bypass
      if (
        process.env.NODE_ENV === 'development' &&
        email === 'local@example.com' &&
        password === 'local123'
      ) {
        document.cookie = 'local-auth-bypass=true; path=/; max-age=3600'
        toast.success('Local Dev Login (Bypass)')
        router.refresh()
        router.push('/')
        return
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        toast.success('Check your email to confirm your account!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success('Successfully logged in!')
        router.refresh()
        router.push('/')
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignUp
              ? 'Enter your email to create a new account'
              : 'Enter your email to sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>

      {/* Debug Helper */}
      {(process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-xs space-y-2 z-50">
            <h4 className="font-bold flex items-center gap-2">Debug Login (Bypass)</h4>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
                onClick={() => { 
                    document.cookie = `local-auth-bypass=${encodeURIComponent('admin@example.com')}; path=/; max-age=3600`;
                    toast.success('Logged in as Admin (Bypass)');
                    router.refresh();
                    router.push('/');
                }}
            >
               Admin (admin@example.com)
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7"
                onClick={() => { 
                    document.cookie = `local-auth-bypass=${encodeURIComponent('user@example.com')}; path=/; max-age=3600`;
                    toast.success('Logged in as User (Bypass)');
                    router.refresh();
                    router.push('/');
                }}
            >
               User (user@example.com)
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-xs h-7 text-red-500"
                onClick={() => { 
                    document.cookie = `local-auth-bypass=; path=/; max-age=0`;
                    toast.success('Cleared Bypass Cookie');
                    router.refresh();
                }}
            >
               Clear Bypass
            </Button>
        </div>
      )}
    </div>
  )
}
