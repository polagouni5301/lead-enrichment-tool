import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-coral/10 text-brand-coral">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Sign in to EnrichIQ</CardTitle>
          <CardDescription>Placeholder authentication screen with role-ready access patterns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
              <Input id="email" type="email" placeholder="ava@company.com" className="pl-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
              <Input id="password" type="password" placeholder="••••••••" className="pl-9" />
            </div>
          </div>
          <Button type="button" className="w-full">Login</Button>
          <button type="button" className="w-full text-center text-sm font-bold text-brand-coral">
            Forgot password?
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
