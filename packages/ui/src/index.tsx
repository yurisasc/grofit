import React from 'react'

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = '', ...rest } = props
  return (
    <button
      className={
        'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white ' +
        className
      }
      {...rest}
    />
  )
}
