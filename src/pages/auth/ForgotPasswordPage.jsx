import { MailCheck } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-orange/15 text-[#9a6100]">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Placeholder recovery flow for future auth integration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">Work email</Label>
            <Input id="recovery-email" type="email" placeholder="name@company.com" />
          </div>
          <Button type="button" className="w-full">Send reset link</Button>
        </CardContent>
      </Card>
    </div>
  )
}
