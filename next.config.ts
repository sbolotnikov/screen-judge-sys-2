import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  allowedDevOrigins: [
    'ais-dev-scqqvmxt66wz6q5gfsdxzm-46140847385.us-west1.run.app',
    'ais-pre-scqqvmxt66wz6q5gfsdxzm-46140847385.us-west1.run.app',
    'localhost:3000'
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'https://ais-dev-scqqvmxt66wz6q5gfsdxzm-46140847385.us-west1.run.app',
        'https://ais-pre-scqqvmxt66wz6q5gfsdxzm-46140847385.us-west1.run.app',
        'http://localhost:3000'
      ]
    }
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.leparidancenter.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dance-at-le-pari.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i3.ytimg.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'http',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
