import { Button } from 'components/ui/button'
import type { ActionFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useSearchParams } from '@remix-run/react'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { HeartPulseIcon } from 'lucide-react'

import { verifyLogin } from '~/lib/auth.server'
import { createUserSession } from '~/lib/session.server'
import { badRequest, safeRedirect } from '~/utils/misc.server'
import { type inferErrors, validateAction } from '~/utils/validation'
import { LoginSchema } from '~/utils/zod.schema'

interface ActionData {
  fieldErrors?: inferErrors<typeof LoginSchema>
}

export type SearchParams = {
  redirectTo?: string
}

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { fieldErrors, fields } = await validateAction(request, LoginSchema)

    if (fieldErrors) {
      console.log('Field validation errors:', fieldErrors)
      return badRequest<ActionData>({ fieldErrors })
    }

    const { email, password, redirectTo, remember } = fields

    const user = await verifyLogin(email, password)

    if (!user) {
      console.log('Invalid login attempt for email:', email)
      return badRequest<ActionData>({
        fieldErrors: {
          password: 'Invalid username or password',
        },
      })
    }

    const safeRedirectTo = safeRedirect(redirectTo, '/')

    return createUserSession({
      redirectTo: safeRedirectTo,
      remember: remember === 'on',
      request,
      role: user.role,
      userId: user.id,
    })
  } catch (error) {
    console.error('Login error:', error)
    return badRequest<ActionData>({
      fieldErrors: {
        email: 'An unexpected error occurred. Please try again.',
      },
    })
  }
}

export default function Login() {
  const fetcher = useFetcher<ActionData>()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'
  const isSubmitting = fetcher.state !== 'idle'

  return (
    <div className="rounded-lg bg-white p-8 shadow-xl">
      <div className="mb-8 text-center">
        <HeartPulseIcon className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Welcome to HealthLife
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your Personalized Health Companion
        </p>
      </div>

      <fetcher.Form method="post" className="space-y-6">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
          {fetcher.data?.fieldErrors?.email && (
            <p className="mt-2 text-sm text-red-600">
              {fetcher.data.fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
          />
          {fetcher.data?.fieldErrors?.password && (
            <p className="mt-2 text-sm text-red-600">
              {fetcher.data.fieldErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <Label
              htmlFor="remember"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me
            </Label>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full rounded-md bg-green-500 px-4 py-2 text-white transition duration-150 ease-in-out hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </fetcher.Form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Not a member?{' '}
        <Link
          to="/register"
          className="font-medium text-green-600 hover:text-green-500"
        >
          Start your health journey today
        </Link>
      </p>
    </div>
  )
}
