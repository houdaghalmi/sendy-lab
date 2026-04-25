import { Fredoka_One, Nunito } from 'next/font/google'
import './globals.css'

const fredoka = Fredoka_One({ weight: '400', subsets: ['latin'], variable: '--font-fredoka' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

export const metadata = {
  title: "Sandy's Treedome Lab",
  description: 'AI-Powered Lab Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable}`}>{children}</body>
    </html>
  )
}