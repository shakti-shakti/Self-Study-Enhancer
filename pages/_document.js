// pages/_document.js

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Essential for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* ✅ Optional: Allow install as PWA if you add manifest later */}
        <meta name="theme-color" content="#ffffff" />

        {/* ✅ Optional: Apple mobile web app full screen */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Optional: Favicon or app icon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
