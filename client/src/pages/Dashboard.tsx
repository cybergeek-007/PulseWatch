import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useMonitors } from '@/hooks/useMonitors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Monitor,
  CheckCircle,
  XCircle,
  PauseCircle,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { getStatusColor, getStatusTextColor, formatRelativeTime } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: monitorsData, isLoading } = useMonitors({ limit: 5 })

  const monitors = monitorsData?.monitors || []
  const totalMonitors = monitorsData?.pagination?.total || 0

  // Calculate stats
  const upMonitors = monitors.filter(m => m.status === 'up').length
  const downMonitors = monitors.filter(m => m.status === 'down').length
  const pausedMonitors = monitors.filter(m => m.status === 'paused').length

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.first_name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your monitoring status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitors</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonitors}</div>
            <p className="text-xs text-muted-foreground">
              Active monitoring endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Up</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{upMonitors}</div>
            <p className="text-xs text-muted-foreground">
              Services running normally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Down</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{downMonitors}</div>
            <p className="text-xs text-muted-foreground">
              Services experiencing issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pausedMonitors}</div>
            <p className="text-xs text-muted-foreground">
              Temporarily disabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Monitors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Monitors</CardTitle>
            <CardDescription>Your most recently added monitors</CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/monitors')}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : monitors.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No monitors yet</h3>
              <p className="text-gray-500 mt-1">
                Create your first monitor to start tracking your APIs
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/monitors/new')}
              >
                Create Monitor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {monitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/monitors/${monitor.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(monitor.status)} ${monitor.status === 'up' ? 'status-up' : monitor.status === 'down' ? 'status-down' : ''}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{monitor.name}</h4>
                      <p className="text-sm text-gray-500">{monitor.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={monitor.status === 'up' ? 'success' : monitor.status === 'down' ? 'destructive' : 'warning'}>
                        {monitor.status}
                      </Badge>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-500">
                        {Number(monitor.uptime_percentage_24h || 100).toFixed(1)}% uptime
                      </p>
                      <p className="text-xs text-gray-400">
                        {monitor.last_checked_at
                          ? `Checked ${formatRelativeTime(monitor.last_checked_at)}`
                          : 'Never checked'
                        }
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/monitors/new')}
            >
              <Monitor className="mr-2 h-4 w-4" />
              Create New Monitor
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/settings')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Configure Alert Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Tips for using PulseWatch</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Create monitors for your critical API endpoints
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Set up alert notifications in settings
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Create a public status page for your users
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                Monitor response times and uptime trends
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
