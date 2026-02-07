import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMonitors, useDeleteMonitor, usePauseMonitor, useResumeMonitor } from '@/hooks/useMonitors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  Play,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { getStatusColor, getStatusTextColor, formatRelativeTime, truncate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Monitors() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedMonitor, setSelectedMonitor] = useState<any>(null)

  const { data: monitorsData, isLoading } = useMonitors({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const deleteMonitor = useDeleteMonitor()
  const pauseMonitor = usePauseMonitor()
  const resumeMonitor = useResumeMonitor()

  const monitors = monitorsData?.monitors || []
  const pagination = monitorsData?.pagination

  const handleDelete = async () => {
    if (!selectedMonitor) return

    try {
      await deleteMonitor.mutateAsync(selectedMonitor.id)
      toast({
        title: 'Success',
        description: 'Monitor deleted successfully',
      })
      setDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete monitor',
        variant: 'destructive',
      })
    }
  }

  const handlePauseResume = async (monitor: any) => {
    try {
      if (monitor.status === 'paused') {
        await resumeMonitor.mutateAsync(monitor.id)
        toast({
          title: 'Success',
          description: 'Monitor resumed',
        })
      } else {
        await pauseMonitor.mutateAsync(monitor.id)
        toast({
          title: 'Success',
          description: 'Monitor paused',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update monitor',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitors</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your API endpoints
          </p>
        </div>
        <Button onClick={() => navigate('/monitors/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Monitor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search monitors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="up">Up</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Monitors List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Monitors</CardTitle>
          <CardDescription>
            {pagination?.total || 0} total monitor{pagination?.total !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : monitors.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No monitors found</h3>
              <p className="text-gray-500 mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first monitor to get started'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button
                  className="mt-4"
                  onClick={() => navigate('/monitors/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Monitor
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {monitors.map((monitor) => (
                <div
                  key={monitor.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(monitor.status)} ${monitor.status === 'up' ? 'status-up' : monitor.status === 'down' ? 'status-down' : ''}`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{monitor.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{monitor.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stats - Hidden on mobile */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{Number(monitor.uptime_percentage_24h || 100).toFixed(1)}%</p>
                        <p className="text-gray-500 text-xs">Uptime (24h)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Math.round(monitor.avg_response_time || 0)}ms</p>
                        <p className="text-gray-500 text-xs">Avg Response</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={monitor.status === 'up' ? 'success' : monitor.status === 'down' ? 'destructive' : 'warning'}>
                          {monitor.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/monitors/${monitor.id}`)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/monitors/${monitor.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePauseResume(monitor)}>
                          {monitor.status === 'paused' ? (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </>
                          ) : (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedMonitor(monitor)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Monitor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMonitor?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
