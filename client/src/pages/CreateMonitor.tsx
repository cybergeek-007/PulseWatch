import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateMonitor } from '@/hooks/useMonitors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const INTERVALS = [
  { value: '60000', label: '1 minute' },
  { value: '300000', label: '5 minutes' },
  { value: '900000', label: '15 minutes' },
  { value: '1800000', label: '30 minutes' },
]

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

export default function CreateMonitor() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const createMonitor = useCreateMonitor()
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    interval: 300000,
    timeout: 30000,
    retries: 3,
    expected_status_code: 200,
    expected_response_content: '',
    follow_redirects: true,
    verify_ssl: true,
    headers: '{}',
    body: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate URL
    try {
      new URL(formData.url)
    } catch {
      setError('Please enter a valid URL with protocol (http:// or https://)')
      return
    }

    // Parse headers
    let headers = {}
    if (formData.headers.trim()) {
      try {
        headers = JSON.parse(formData.headers)
      } catch {
        setError('Headers must be valid JSON')
        return
      }
    }

    setError('')

    try {
      await createMonitor.mutateAsync({
        ...formData,
        headers,
        expected_status_code: formData.expected_status_code || undefined,
        expected_response_content: formData.expected_response_content || undefined,
        body: formData.body || undefined,
      })
      toast({
        title: 'Success',
        description: 'Monitor created successfully',
      })
      navigate('/monitors')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create monitor')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/monitors')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Monitor</h1>
          <p className="text-gray-600 mt-1">
            Set up a new endpoint to monitor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>Configure the basic monitor settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Monitor Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Production API"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.example.com/health"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Include the protocol (http:// or https://)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interval">Check Interval</Label>
                  <Select
                    value={formData.interval.toString()}
                    onValueChange={(value) => setFormData({ ...formData, interval: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVALS.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Fine-tune your monitor configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min={1000}
                    max={60000}
                    value={formData.timeout}
                    onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retries">Retries</Label>
                  <Input
                    id="retries"
                    type="number"
                    min={0}
                    max={10}
                    value={formData.retries}
                    onChange={(e) => setFormData({ ...formData, retries: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_status_code">Expected Status Code</Label>
                <Input
                  id="expected_status_code"
                  type="number"
                  placeholder="200"
                  value={formData.expected_status_code}
                  onChange={(e) => setFormData({ ...formData, expected_status_code: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_response_content">Expected Response Content</Label>
                <Input
                  id="expected_response_content"
                  placeholder="Text to search for in response"
                  value={formData.expected_response_content}
                  onChange={(e) => setFormData({ ...formData, expected_response_content: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Custom Headers (JSON)</Label>
                <textarea
                  id="headers"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder='{"Authorization": "Bearer token"}'
                  value={formData.headers}
                  onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                />
              </div>

              {formData.method !== 'GET' && formData.method !== 'HEAD' && (
                <div className="space-y-2">
                  <Label htmlFor="body">Request Body</Label>
                  <textarea
                    id="body"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Request body content"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="follow_redirects">Follow Redirects</Label>
                  <p className="text-xs text-gray-500">Follow HTTP redirects automatically</p>
                </div>
                <Switch
                  id="follow_redirects"
                  checked={formData.follow_redirects}
                  onCheckedChange={(checked) => setFormData({ ...formData, follow_redirects: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="verify_ssl">Verify SSL</Label>
                  <p className="text-xs text-gray-500">Verify SSL certificates</p>
                </div>
                <Switch
                  id="verify_ssl"
                  checked={formData.verify_ssl}
                  onCheckedChange={(checked) => setFormData({ ...formData, verify_ssl: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/monitors')}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMonitor.isPending}>
            {createMonitor.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Monitor'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
