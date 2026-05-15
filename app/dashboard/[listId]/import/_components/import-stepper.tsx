'use client'

import { CheckCircle } from 'lucide-react'

import { cn } from '~/lib/utils'

const StepItem = ({
  active = false,
  completed = false,
  title,
}: {
  active?: boolean
  completed?: boolean
  title: string
}) => {
  return (
    <div className='flex flex-col gap-2 w-full max-w-md'>
      <div
        className={cn(
          'flex w-full h-1 border-background relative rounded-full flex-none bg-muted-foreground/20',
          active && 'bg-foreground',
          completed && 'bg-green-400/80'
        )}
      />
      <div className='flex items-center gap-0.5'>
        <span
          className={cn(
            'text-sm font-medium',
            completed && 'text-green-500/80'
          )}
        >
          {title}
        </span>
        {completed ? (
          <CheckCircle className='size-4 text-green-500/80' />
        ) : null}
      </div>
    </div>
  )
}

export function ImportStepper({
  step,
}: {
  step: 'upload' | 'mapping' | 'import'
}) {
  return (
    <div className='flex flex-row items-center justify-center gap-3.5'>
      <StepItem
        active={step === 'upload'}
        completed={step === 'mapping' || step === 'import'}
        title='Upload'
      />
      <StepItem
        active={step === 'mapping'}
        completed={step === 'import'}
        title='Map & Review'
      />
      <StepItem active={step === 'import'} title='Import' />
    </div>
  )
}
