import { Command } from 'lucide-react'

import { Globe } from '../_components/globe'
import { SignInForm } from './sign-in-form'

export default function SignUpPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2'>
      <div className='flex flex-col gap-4 p-6 md:p-10'>
        <div className='flex justify-center gap-2 md:justify-start'>
          <div className='flex items-center gap-2 font-medium'>
            <div className='flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground'>
              <Command className='size-4' />
            </div>
            Tomodochi Inc.
          </div>
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs'>
            <SignInForm />
          </div>
        </div>
      </div>
      <div className='relative hidden bg-muted lg:flex flex-1 overflow-hidden'>
        <Globe />
      </div>
    </div>
  )
}
