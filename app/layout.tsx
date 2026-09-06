import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/store';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FoodRescue AI - Reducing Food Waste with AI',
  description:
    'Connect restaurants, NGOs, and volunteers to rescue surplus food. AI-powered matching, demand forecasting, and delivery optimization to reduce food waste.',
  keywords: 'food rescue, food waste, NGO, donations, AI, food bank, volunteer',
  openGraph: {
    title: 'FoodRescue AI',
    description: 'AI-powered platform to rescue surplus food and feed those in need.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
