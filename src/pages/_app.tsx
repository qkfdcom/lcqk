import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="transition-opacity duration-300 ease-in-out">
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
