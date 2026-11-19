import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardContent, CardHeader, Input, Label, Select, Option, Alert } from '@/components/ui'
import { apiClient } from '@/services/api'
import { apiErrorMessage } from '@/services/api'
import { useAuth } from '@/features/auth/AuthContext'

interface VolunteerOpportunity {
  id: string
  title: string
  description: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  role: string
  requiredSkills: string
  hoursCommitted: number
  createdAt: string
}

export function VolunteerOpportunityBoard() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState('')
  const [clubId, setClubId] = useState<string>('')
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['volunteer-opportunities', user?.collegeId],
    queryFn: () => apiClient.get<VolunteerOpportunity[]>(`/volunteer/pending/${user?.collegeId}`).then((res) => res.data),
    enabled: !!user?.collegeId,
  })

  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/volunteer', {
      title,
      description,
      skills,
      clubId: clubId || undefined,
    }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-opportunities', user?.collegeId] })
      setTitle('')
      setDescription('')
      setSkills('')
      setClubId('')
    },
    onError: (error) => {
      const message = apiErrorMessage(error, 'Failed to create volunteer opportunity')
      Alert({ title: 'Error', description: message })
    },
  })

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-medium">Volunteer Opportunity Board</h3>
      </CardHeader>
      <CardContent>
        {!user?.collegeId && (
          <Alert>
            <p>You must be affiliated with a college to view opportunities.</p>
          </Alert>
        )}

        {user?.collegeId && (
          <>
            <div className="mb-4">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter opportunity title"
                required
              />
            </div>

            <div className="mb-4">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                multiline
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <Label>Required Skills (comma-separated)</Label>
              <Input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g., Event planning, Marketing, Design"
              />
            </div>

            {user?.role === 'COLLEGE_ADMIN' && (
              <div className="mb-4">
                <Label>Club (optional)</Label>
                <Select
                  value={clubId || ''}
                  onValueChange={(val) => setClubId(val || '')}
                  placeholder="Select club"
                >
                  <Option value="">None</Option>
                  {/* Club options would be populated dynamically */}
                </Select>
              </div>
            )}

            <Button onClick={createMutation.mutate} disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating...' : 'Post Opportunity'}
            </Button>

            {createMutation.error && (
              <p className="text-sm text-red-600 mt-2">{createMutation.error.message}</p>
            )}

            {user?.role === 'COLLEGE_ADMIN' && opportunities?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium">Pending Opportunities</h4>
                <ul>
                  {opportunities.map((opp) => (
                    <li key={opp.id} className="mb-2">
                      <strong>{opp.title}</strong>{' '}
                      <span className="text-sm text-gray-500">Status: {opp.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {user?.role === 'STUDENT' && opportunities?.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium">Your Applications</h4>
                <p>You have not applied for any opportunities yet.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}