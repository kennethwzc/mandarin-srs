import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface StatsWidgetProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

/**
 * Stats widget component for dashboard
 */
export function StatsWidget({ title, value, description, trend }: StatsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && (
          <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : ''}
            {trend.value} from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
