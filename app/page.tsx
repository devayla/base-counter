import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}


export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const imageUrl = searchParams.imageUrl as string || `${APP_URL}/images/feed.jpg`
  const frame = {
    version: 'next',
    imageUrl,
    button: {
      title: 'Pull the Lever 🎰',
      action: {
        type: 'launch_frame',
        name: 'Base Counter',
        url: APP_URL,
        splashImageUrl: `${APP_URL}/images/splash.jpg`,
        splashBackgroundColor: '#ffffff',
      },
    },
  }
  return {
    title: 'Base Counter | Global On-Chain Clicker',
    openGraph: {
      title: 'Base Counter | Global On-Chain Clicker',
      description: 'Join the community! Increment the global counter, compete on the leaderboard, and earn rewards on Base.',
      images: [{ url: imageUrl }],
    },
    other: {
      'fc:frame': JSON.stringify(frame),
      'base:app_id': '695fdef93ee38216e9af4df2',
    },
  }
}

export default function Home() {
  return <App />
}
