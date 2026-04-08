import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useSearch } from '@/hooks/useYouTube'
import { getThumbnail } from '@/services/youtube'
import SearchBar from '@/components/ui/SearchBar'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { data, isLoading, isError } = useSearch(query)

  const results = data?.items ?? []

  return (
    <>
      <Helmet><title>{query ? `"${query}" — Search` : 'Search'} — ZC OCW</title></Helmet>

      <div className="bg-zc-navy text-white py-12">
        <div className="section">
          <h1 className="font-display text-3xl md:text-4xl mb-6">Search</h1>
          <SearchBar size="lg" className="max-w-2xl" />
        </div>
      </div>

      <div className="section py-10">
        {!query && (
          <p className="text-center text-zc-gray py-20">Enter a search term above.</p>
        )}

        {query && isLoading && <PageLoader />}

        {query && isError && <ErrorMessage title="Search failed" />}

        {query && !isLoading && !isError && (
          <>
            <p className="text-sm text-zc-gray mb-6">
              {results.length} result{results.length !== 1 ? 's' : ''} for <strong>"{query}"</strong>
            </p>

            {results.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zc-gray text-lg">No results found.</p>
                <p className="text-sm text-zc-gray mt-2">Try a different keyword or browse by department.</p>
                <Link to="/departments" className="btn-outline mt-6 inline-flex">Browse departments</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(item => {
                  const isPlaylist = item.id.kind === 'youtube#playlist'
                  const id = item.id.playlistId || item.id.videoId
                  const to = isPlaylist ? `/courses/${id}` : `/courses/search/watch/${id}`

                  return (
                    <Link key={id} to={to} className="card group flex flex-col">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={getThumbnail(item.snippet, 'medium')}
                          alt={item.snippet.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <span className="badge text-[10px] mb-2 bg-gray-100 text-zc-gray">
                          {isPlaylist ? 'Course' : 'Video'}
                        </span>
                        <h3 className="font-display font-semibold text-zc-navy text-sm leading-snug line-clamp-2
                                       group-hover:text-zc-sky transition-colors">
                          {item.snippet.title}
                        </h3>
                        <p className="text-xs text-zc-gray mt-1 line-clamp-2">{item.snippet.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
