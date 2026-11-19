import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/services/api'
import { apiErrorMessage } from '@/services/api'
import { useAuth } from '@/features/auth/AuthContext'
import { Button, Card, CardContent, CardHeader, Input, Select, Option, Alert, Table, TableRow, TableCell, TableHead } from '@/components/ui'

interface Task {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: string | null
  completedAt: string | null
  assignedTo: {
    id: string
    displayName: string | null
    email: string | null
  } | null
  createdAt: string
}

interface AssignTask {
  userId: string
}

export function TaskManagement() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW')
  const [dueDate, setDueDate] = useState<string | null>(null)
  const [assignedToId, setAssignedToId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('TODO')

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', user?.collegeId, statusFilter],
    queryFn: () => apiClient.get<Task[]>(`/tasks?collegeId=${user?.collegeId}&status=${statusFilter}`).then((res) => res.data),
    enabled: !!user?.collegeId,
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/tasks', {
      title,
      description,
      priority,
      dueDate,
      assignedToId: assignedToId || undefined,
    }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.collegeId] })
      setTitle('')
      setDescription('')
      setPriority('LOW')
      setDueDate(null)
      setAssignedToId('')
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Failed to create task')
      Alert({ title: 'Error', description: message })
    },
  })

  const statusOptions = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
  ]

  const assignMutation = useMutation({
    mutationFn: ({ taskId, userId }: { taskId: string; userId: string }) =>
      apiClient.post(`/tasks/${taskId}/assign`, { userId }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.collegeId] })
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Failed to assign task')
      Alert({ title: 'Error', description: message })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: string }) =>
      apiClient.post(`/tasks/${taskId}/status`, { newStatus }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.collegeId] })
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Failed to update task status')
      Alert({ title: 'Error', description: message })
    },
  })

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">Task Management</h3>
      </CardHeader>
      <CardContent>
        {!user?.collegeId && (
          <Alert>
            <p>You must be affiliated with a college to view tasks.</p>
          </Alert>
        )}

        {user?.collegeId && (
          <>
            {/* Create Task Form */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Create Task</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div>
                  <Select
                    value={priority || ''}
                    onValueChange={(val) => setPriority(val || '')}
                    placeholder="Priority"
                  >
                    <Option value="">Select</Option>
                    {priorityOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Input
                    placeholder="Due date (optional)"
                    onChange={(e) => setDueDate(e.target.value || null)}
                  />
                </div>
              </div>
              <div>
                <Input
                  value={assignedToId || ''}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  placeholder="Assign to user ID (optional)"
                />
                <small className="text-xs text-gray-500">Enter user ID to assign</small>
              </div>
              <div>
                <Select
                  value={statusFilter || 'TODO'}
                  onValueChange={(val) => setStatusFilter(val || 'TODO')}
                  placeholder="Filter by status"
                >
                  <Option value="">All</Option>
                  {statusOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
              </div>
              <Button onClick={createMutation.mutate} disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Creating...' : 'Create Task'}
              </Button>
              {createMutation.error && (
                <p className="text-sm text-red-600 mt-2">{createMutation.error.message}</p>
              )}
            </div>

            {/* Tasks Table */}
            {user?.collegeId && tasks?.length > 0 && (
              <div className="mt-8">
                <h4 className="font-medium mb-3">My Tasks</h4>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  {tasks.map((task) => (
                    <TableRow key={task.id} className="border-b">
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        <span className="capitalize capitalize">{task.priority}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`capitalize capitalize px-2 py-1 rounded text-sm ${task.status === 'TODO' ? 'bg-gray-100 text-gray-800' : task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {task.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.assignedTo?.displayName || 'Unassigned'}
                      </TableCell>
                      <TableCell>{task.dueDate || 'No due date'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => assignMutation.mutate({ taskId: task.id, userId: assignedToId || user?.id })}
                        >
                          Assign
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => statusMutation.mutate({ taskId: task.id, newStatus: task.status === 'TODO' ? 'IN_PROGRESS' : 'TODO' })}
                        >
                          {task.status === 'TODO' ? 'Start' : 'Complete'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </Table>
              </div>
            )}

            {user?.collegeId && tasks?.length === 0 && (
              <p className="mt-4 text-center text-gray-500">No tasks found.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}