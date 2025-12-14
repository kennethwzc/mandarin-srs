import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold">Pricing</h1>
          <p className="text-lg text-muted-foreground">Choose the plan that works for you</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">$0</div>
              <ul className="space-y-2">
                <li>✓ 50 characters per day</li>
                <li>✓ Basic progress tracking</li>
                <li>✓ Spaced repetition</li>
              </ul>
              <Button className="w-full">Get Started</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For serious learners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold">
                $9.99<span className="text-sm font-normal">/month</span>
              </div>
              <ul className="space-y-2">
                <li>✓ Unlimited characters</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ Export progress</li>
              </ul>
              <Button className="w-full">Upgrade</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
