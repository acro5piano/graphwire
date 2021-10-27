import { useScroll } from 'ahooks'
import clsx from 'clsx'
import dedent from 'dedent'
import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'

const DESCRIPTION = "GraphQL subscription proxy - A GraphQL proxy server which turns your query into real-time live query." // prettier-ignore
const COPY = "GraphQL subscription proxy - Turn query into live query" // prettier-ignore

const Home: NextPage = () => {
  const scrolled = useScroll()

  return (
    <div className="space-y-20 sm:space-y-32 md:space-y-40 lg:space-y-44 overflow-hidden">
      <Head>
        <meta key="twitter:title" name="twitter:title" content={DESCRIPTION} />
        <meta key="og:title" property="og:title" content={COPY} />
        <meta name="descrpition" content={DESCRIPTION} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          key="og:image"
          property="og:image"
          content="https://user-images.githubusercontent.com/10719495/132133995-134cd804-bda4-4ae2-8135-04d1e8425606.png"
        />
        <title>{COPY}</title>
      </Head>
      <header
        className={clsx(
          'fixed top-0 left-0 w-full bg-white transition-all',
          scrolled.top > 10 && 'border-gray-100 border-b shadow-md',
        )}
      >
        <div className="max-w-screen-lg px-4 m-auto h-16 flex items-center justify-between">
          <Link passHref href="/">
            <a className="flex items-center text-base font-medium p-3 rounded">
              <img src="/logo.svg" alt="logo" width="32" height="32" />
            </a>
          </Link>
          <Link passHref href="https://github.com/acro5piano/graphwire">
            <a className="text-base leading-6 font-medium text-gray-900 transition-all py-2 hover:bg-gray-100 p-3 rounded">
              GitHub
            </a>
          </Link>
        </div>
      </header>

      <section className="max-w-screen-lg m-auto min-h-screen-2/3 pt-8 md:pt-0">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mt-4 mb-8 sm:mt-14 sm:mb-10 text-center">
          Turn query into live query
        </h1>
        <h2 className="w-2/3 m-auto text-base text-xl sm:text-2xl lg:text-2xl font-bold text-gray-600 mt-10 mb-8 sm:mt-14 sm:mb-10 text-center">
          A GraphQL proxy server which turns your query into <br />
          <span className="font-extrabold text-gray-900">
            {' '}
            real-time live query.
          </span>
        </h2>
        <div className="max-w-screen-md m-auto hidden md:block ">
          <div className="bg-gray-200 border-3 border-gray-200  h-6 rounded-tr rounded-tl flex items-center px-3">
            <div className="h-3 w-3 bg-red-500 rounded-full" />
            <div className="h-3 w-3 mx-1 bg-yellow-400 rounded-full" />
            <div className="h-3 w-3 bg-green-500 rounded-full" />
          </div>
          <div className="text-sm bg-gray-800 text-white px-6 py-3 rounded-br rounded-bl overflow-x-scroll hide-scrollbar font-mono whitespace-pre">
            <p className="text-white font-bold shell-cmd">
              {dedent`
            npx graphwire --upstream-url https://api.graphql.jobs
              `}
            </p>
            <p className="mt-3 text-gray-400">{dedent`
            INFO: Fetching the original schema...
            INFO: Done fetching the original schema.
            INFO: Server listening at http://0.0.0.0:1989
            `}</p>
            <p className="mt-3 text-white">{dedent`

            ┌─────────────────────────────────────────────────────────────────────────────────┐
            │  GraphQL Subscription Proxy v0.0.10                                             │
            │                                                                                 │
            │  - Subscribe: http://0.0.0.0:1989/altair                                        │
            │  - Publish:   curl -XPOST http://0.0.0.0:1989/v1/publish -d topic=<type>:<id>   │
            └─────────────────────────────────────────────────────────────────────────────────┘

          `}</p>
          </div>
        </div>
        <div className="justify-center md:flex space-y-4 sm:space-y-0 sm:space-x-4 text-center mt-12">
          <Link passHref href="https://github.com/acro5piano/graphwire">
            <a className="bg-indigo-600 text-white w-full sm:w-auto flex-none text-lg leading-6 font-semibold py-3 px-6 rounded-xl">
              Get started
            </a>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
