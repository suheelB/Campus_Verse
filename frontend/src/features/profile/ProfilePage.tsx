/*
 * Copyright 2024 CampusVerse Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Building2, Mail, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { studentApi } from '@/services/studentApi'
import type { UpdateStudentProfileRequest } from '@/types/student'

const profileSchema = z.object({
  program: z.string().max(255).optional(),
  department: z.string().max(255).optional(),
  academicYear: z.string().max(50).optional(),
  bio: z.string().max(2000).optional(),
  profileVisibility: z.enum(['PUBLIC', 'CLUB_MEMBERS', 'PRIVATE']).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const visibilityOptions = [
  { value: 'PUBLIC', label: 'Public', description: 'Visible to all students' },
  { value: 'CLUB_MEMBERS', label: 'Club Members Only', description: 'Visible to members of your clubs' },
  { value: 'PRIVATE', label: 'Private', description: 'Visible only to you' },
] as const

export function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: studentApi.getMyProfile,
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStudentProfileRequest) => studentApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    },
    onError: (err: Error) => {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      program: '',
      department: '',
      academicYear: '',
      bio: '',
      profileVisibility: 'PUBLIC',
    },
  })

  const onSubmit = (data: ProfileForm) => {
    setMessage(null)
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Failed to load profile</h3>
        <p className="text-gray-600 mt-2">{error.message}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">No profile found</h3>
        <p className="text-gray-600 mt-2">Profile data could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

        {message && (
          <div className={`mb-6 flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label block mb-1">Email</label>
            <div className="input bg-gray-50" style={{ cursor: 'not-allowed' }}>
              {user?.email}
            </div>
          </div>
          <div>
            <label className="label block mb-1">College</label>
            <div className="input bg-gray-50 flex items-center gap-2" style={{ cursor: 'not-allowed' }}>
              <Building2 className="h-4 w-4 text-gray-400" />
              {user?.collegeSlug}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Academic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="program" className="label block mb-1.5">
                  Program / Major
                </label>
                <input
                  {...register('program')}
                  id="program"
                  type="text"
                  className="input"
                  placeholder="e.g., Computer Science"
                  defaultValue={profile.program ?? ''}
                />
                {errors.program && <p className="mt-1.5 text-sm text-red-600">{errors.program.message}</p>}
              </div>

              <div>
                <label htmlFor="department" className="label block mb-1.5">
                  Department
                </label>
                <input
                  {...register('department')}
                  id="department"
                  type="text"
                  className="input"
                  placeholder="e.g., Engineering"
                  defaultValue={profile.department ?? ''}
                />
                {errors.department && <p className="mt-1.5 text-sm text-red-600">{errors.department.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="academicYear" className="label block mb-1.5">
                Academic Year
              </label>
              <input
                {...register('academicYear')}
                id="academicYear"
                type="text"
                className="input"
                placeholder="e.g., Junior, 2024-2025"
                defaultValue={profile.academicYear ?? ''}
              />
              {errors.academicYear && <p className="mt-1.5 text-sm text-red-600">{errors.academicYear.message}</p>}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              About You
            </h2>

            <div>
              <label htmlFor="bio" className="label block mb-1.5">
                Bio
              </label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={4}
                className="input resize-y min-h-[100px]"
                placeholder="Tell others about yourself, your interests, and what you're looking for..."
                defaultValue={profile.bio ?? ''}
              />
              {errors.bio && <p className="mt-1.5 text-sm text-red-600">{errors.bio.message}</p>}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Visibility
            </h2>

            <div className="space-y-3">
              {visibilityOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    profile.profileVisibility === option.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('profileVisibility')}
                    value={option.value}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
            {errors.profileVisibility && <p className="mt-1.5 text-sm text-red-600">{errors.profileVisibility.message}</p>}
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {isSubmitting || updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}