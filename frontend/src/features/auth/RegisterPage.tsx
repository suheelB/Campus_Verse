import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import type { ApiResponse } from '@/types/auth'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  collegeSlug: z.string().min(1, 'Please select your college'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

const colleges = [
  { slug: 'demo-college', name: 'Demo College (Development)' },
  { slug: 'state-university', name: 'State University' },
  { slug: 'tech-institute', name: 'Tech Institute' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      collegeSlug: 'demo-college',
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    setIsLoading(true)
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        collegeSlug: data.collegeSlug,
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: ApiResponse<unknown> | { message?: string; error?: string }; status?: number }
        message?: string
      }
      const respData = axiosError.response?.data as { message?: string; error?: string } | undefined
      const backendMessage = respData?.message || respData?.error
      if (backendMessage) {
        setError(backendMessage)
      } else if (!axiosError.response || axiosError.response.status === 500 || axiosError.response.status === 502 || axiosError.response.status === 503 || axiosError.response.status === 504) {
        setError('Backend server is not running on port 8080. Please start Docker/backend first.')
      } else if (axiosError.response.status === 409) {
        setError('An account with this email already exists.')
      } else {
        setError('Registration failed. Please check your details and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-gray-900 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span>CampusVerse</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-2">Join your campus community today</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="displayName" className="label block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('displayName')}
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  className="input pl-10"
                  placeholder="Alex Johnson"
                  disabled={isLoading}
                />
              </div>
              {errors.displayName && (
                <p className="mt-1.5 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input pl-10"
                  placeholder="you@college.edu"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="collegeSlug" className="label block mb-1.5">
                College
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  {...register('collegeSlug')}
                  id="collegeSlug"
                  className="input pl-10 pr-10 appearance-none bg-white"
                  disabled={isLoading}
                >
                  <option value="">Select your college</option>
                  {colleges.map((college) => (
                    <option key={college.slug} value={college.slug}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.collegeSlug && (
                <p className="mt-1.5 text-sm text-red-600">{errors.collegeSlug.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label block mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="input pl-10"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}