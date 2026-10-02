import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dm/',
          '/onboarding/',
          '/dashboard/',
          '/friends/',
          '/notifications/',
          '/profile/',
          '/settings/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dm/'],
      },
    ],
    sitemap: 'https://anonlink.online/sitemap.xml',
  };
}
