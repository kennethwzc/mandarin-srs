import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PreferencesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">Customize your learning experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Preferences</CardTitle>
          <CardDescription>Adjust how you learn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="daily-goal">Daily Review Goal</Label>
            <Select>
              <SelectTrigger id="daily-goal">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 reviews</SelectItem>
                <SelectItem value="20">20 reviews</SelectItem>
                <SelectItem value="50">50 reviews</SelectItem>
                <SelectItem value="100">100 reviews</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  )
}
