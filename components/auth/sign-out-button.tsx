'use client'

import { Slot as SlotPrimitive } from 'radix-ui'
import { forwardRef } from 'react'
import { cn } from '~/lib/utils'
import { signOut } from './actions'

export interface SignOutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const SignOutButton = forwardRef<HTMLButtonElement, SignOutButtonProps>(
  ({ asChild = false, className, children, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : 'button'
    return (
      /**
       * We use a form with a server action to handle the sign out.
       * It's a security best practice to avoid multiple vulnerabilities:
       * - CSRF attacks
       * - Caching issue
       * - URL exposure
       * - Unintended triggering
       */
      <form action={() => signOut()}>
        <Comp
          ref={ref}
          {...props}
          type='submit'
          className={cn(className)}
          onClick={(e) => {
            // Radix DropdownMenuItem prevents native form submission when using asChild.
            // Explicitly submit the form so it works before the dropdown closes.
            // See: https://github.com/radix-ui/primitives/issues/3789
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
            props.onClick?.(e)
          }}
        >
          {children}
        </Comp>
      </form>
    )
  }
)
SignOutButton.displayName = 'SignOutButton'
