import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { CheckCircle, XCircle, Database, Server, Clock, Loader2 } from 'lucide-react'
import type { HealthResponse } from '@/types/auth'

export function HealthPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get<HealthResponse>('/health')
      return response.data
    },
    retry: false,
    refetchInterval: 30000,
  })

  const statusChecks = [
    {
      label: 'API Server',
      status: data?.status === 'UP' ? 'healthy' : 'unhealthy',
      details: data?.service || 'Unknown',
      icon: Server,
    },
    {
      label: 'Database',
      status: data?.database === 'CONNECTED' ? 'healthy' : 'unhealthy',
      details: data?.database || 'Unknown',
      icon: Database,
    },
    {
      label: 'Timestamp',
      status: 'info',
      details: data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown',
      icon: Clock,
    },
    {
      label: 'Version',
      status: 'info',
      details: data?.version || 'Development',
      icon: CheckCircle,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-1">Monitor backend service status and connectivity</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="btn-outline gap-2"
        >
          <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
          <p className="text-gray-600">Checking system health...</p>
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Health Check Failed</h2>
          <p className="text-gray-600 mb-4">Unable to connect to the backend service</p>
          <pre className="text-left text-sm bg-gray-100 p-4 rounded-lg overflow-auto text-red-600">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
          <button onClick={() => refetch()} className="btn-primary mt-4">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className={`p-4 border-b ${data?.status === 'UP' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {data?.status === 'UP' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {data?.status === 'UP' ? 'All Systems Operational' : 'System Degraded'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Last checked: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {statusChecks.map((check, index) => (
                <div key={index} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className={`p-2 rounded-lg ${
                    check.status === 'healthy' ? 'bg-green-100 text-green-600' :
                    check.status === 'unhealthy' ? 'bg-red-100 text-red-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <check.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{check.label}</p>
                    <p className="text-sm text-gray-500">{check.details}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    check.status === 'healthy' ? 'bg-green-500' :
                    check.status === 'unhealthy' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Raw Response</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}