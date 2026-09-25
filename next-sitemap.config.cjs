const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  'https://example.com'

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  // Account pages, dashboards and the admin panel are not for search engines
  exclude: ['/login', '/login/*', '/register/*', '/giaovien/*', '/hocsinh/*', '/admin', '/admin/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: ['/admin', '/giaovien', '/hocsinh'],
      },
    ],
  },
}
