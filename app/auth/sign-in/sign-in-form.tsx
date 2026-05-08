'use client'

import { useActionState } from 'react'

import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field'
import { Input } from '~/components/ui/input'
import { signInWithEmail, type SignInWithEmailResult } from './action'

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const [state, formAction, isPending] = useActionState<
    SignInWithEmailResult | null,
    FormData
  >(async (_prevState, formData) => signInWithEmail(formData), null)

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      {...props}
      action={formAction}
    >
      <FieldGroup>
        <div className='flex flex-col items-center gap-1 text-center'>
          <h1 className='text-2xl font-bold'>Login to your account</h1>
          <p className='text-sm text-balance text-muted-foreground'>
            Enter your email below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input
            id='email'
            name='email'
            type='email'
            placeholder='john@doe.com'
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='password'>Password</FieldLabel>
          <Input id='password' name='password' type='password' required />
          <FieldDescription>
            Must be at least 8 characters long.
          </FieldDescription>
        </Field>
        {state?.error && state.error.code === 'SIGN_IN_FAILEd' ? (
          <div className='rounded-md px-3 py-2 text-sm text-red-500'>
            {/* 👉🏻 `as string` is bad DX - should be handled by default in Anzen */}
            {(state.error.ctx.message as string) ?? 'Failed to sign in'}
          </div>
        ) : null}

        <Field>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </Field>
        <Field>
          <FieldDescription className='px-6 text-center'>
            Already have an account? <a href='/auth/sign-up'>Sign up</a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
