import clsx from 'clsx'

export const Button = ({
  onClick = () => {},
  children,
  loading = false,
  variant = 'primary',
  className,
  ...props
}: {
  onClick?: () => any
  children: string
  variant?: 'primary' | 'secondary'
  loading?: boolean
} & React.ButtonHTMLAttributes<any>) => {
  return (
    <button
      className={clsx(
        'text-base rounded-full transition-all p-2 px-6 top-0 right-0',
        variant === 'primary' &&
          'bg-indigo-600 hover:bg-indigo-800 text-white ',
        variant === 'secondary' &&
          'bg-white border border-indigo-600 hover:border-indigo-800 hover:bg-indigo-100 text-indigo-600 ',
        className,
      )}
      onClick={onClick}
      disabled={loading}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  )
}
