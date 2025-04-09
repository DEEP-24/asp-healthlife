import type { ActionFunctionArgs } from '@remix-run/node'
import { Link, json, redirect, useFetcher } from '@remix-run/react'
import { Button } from 'components/ui/button'
import { Label } from 'components/ui/label'
import { useState } from 'react'
import { z } from 'zod'
import { sendEmail } from '~/lib/mail.server'
import { db } from '~/lib/prisma.server'
import { generatePasswordResetToken } from '~/utils/misc.server'
import { type inferErrors, validateAction } from '~/utils/validation'

const Schema = z
  .object({
    intent: z
      .literal('send_code')
      .or(z.literal('verify_otp'))
      .or(z.literal('reset_password')),
    email: z.string().email('Invalid email address').optional(),
    otp: z.string().length(6, 'Code must be 6 digits').optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.intent) {
      case 'send_code':
        if (!data.email) {
          ctx.addIssue({
            code: 'custom',
            message: 'Email is required',
            path: ['email'],
          })
        }
        break
      case 'verify_otp':
        if (!data.otp) {
          ctx.addIssue({
            code: 'custom',
            message: 'Code is required',
            path: ['otp'],
          })
        }
        break
      case 'reset_password':
        if (!data.otp) {
          ctx.addIssue({
            code: 'custom',
            message: 'Code is required',
            path: ['otp'],
          })
        }
        if (!data.password) {
          ctx.addIssue({
            code: 'custom',
            message: 'Password is required',
            path: ['password'],
          })
        }
        if (!data.confirmPassword) {
          ctx.addIssue({
            code: 'custom',
            message: 'Confirm password is required',
            path: ['confirmPassword'],
          })
        }
        if (
          data.password &&
          data.confirmPassword &&
          data.password !== data.confirmPassword
        ) {
          ctx.addIssue({
            code: 'custom',
            message: "Passwords don't match",
            path: ['confirmPassword'],
          })
        }
        break
    }
  })

interface ActionData {
  fieldErrors?: inferErrors<typeof Schema>
  success?: boolean
  otpVerified?: boolean
  email?: string
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const submission = await validateAction(request, Schema)

  if (submission.fieldErrors) {
    return json({ fieldErrors: submission.fieldErrors })
  }

  const { intent, email, otp } = submission.fields

  if (intent === 'send_code') {
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return json(
        { fieldErrors: { email: 'No account found with this email' } },
        { status: 400 },
      )
    }

    const token = generatePasswordResetToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15) // 15 minutes

    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    await sendEmail({
      to: email,
      subject: 'Reset Password',
      text: `Your password reset code is ${token}. It expires in 15 minutes.`,
    })

    return json<ActionData>({
      success: true,
      email,
    })
  }

  if (intent === 'verify_otp') {
    try {
      const passwordReset = await db.passwordReset.findFirst({
        where: {
          token: otp,
          expiresAt: { gt: new Date() },
          used: false,
        },
        include: { user: true },
      })

      if (!passwordReset) {
        return json<ActionData>(
          {
            success: true,
            email,
            fieldErrors: {
              otp: 'Invalid verification code. Please try again.',
            },
          },
          { status: 400 },
        )
      }

      return redirect(`/reset-password?token=${otp}`)
    } catch (error) {
      console.error('OTP verification error:', error)
      return json<ActionData>({
        success: true,
        email,
        fieldErrors: { otp: 'Failed to verify code. Please try again.' },
      })
    }
  }

  return json({})
}

export default function ForgotPassword() {
  const fetcher = useFetcher<ActionData>()
  const isSubmitting = fetcher.state !== 'idle'
  const [currentOTP, setCurrentOTP] = useState('')

  return (
    <div className="rounded-lg bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-2xl font-bold">Reset Password</h2>
      {fetcher.data?.success ? (
        <fetcher.Form method="post" className="space-y-6">
          <input type="hidden" name="intent" value="verify_otp" />
          <input type="hidden" name="email" value={fetcher.data.email} />
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-emerald-600">
                We've sent a verification code to{' '}
                <span className="font-medium">{fetcher.data.email}</span>
              </p>
              <p className="text-xs text-gray-500">
                Please check your email and enter the code below.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={currentOTP}
                onChange={e => setCurrentOTP(e.target.value)}
                maxLength={6}
                className={`mt-2 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-emerald-500 ${
                  fetcher.data?.fieldErrors?.otp
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-emerald-500'
                }`}
                placeholder="Enter 6-digit code"
              />
              {fetcher.data?.fieldErrors?.otp && (
                <p className="mt-2 text-sm text-red-600">
                  {fetcher.data.fieldErrors.otp}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
              disabled={isSubmitting || currentOTP.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentOTP('')
                    fetcher.submit(
                      new URLSearchParams({
                        intent: 'send_code',
                        email: fetcher.data!.email!,
                      }),
                      { method: 'post' },
                    )
                  }}
                  className="font-medium text-emerald-600 hover:text-emerald-500"
                >
                  Send again
                </button>
              </p>
            </div>
          </div>
        </fetcher.Form>
      ) : (
        <fetcher.Form method="post" className="space-y-6">
          <input type="hidden" name="intent" value="send_code" />
          <div>
            <p className="mb-5 text-sm text-gray-600">
              Enter the email address associated with your account and we'll
              send you a code to reset your password.
            </p>
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {fetcher.data?.fieldErrors?.email && (
                <p className="mt-2 text-sm text-red-600">
                  {fetcher.data.fieldErrors.email}
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Code'}
          </Button>
        </fetcher.Form>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-gray-600 transition-colors hover:text-emerald-500"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
