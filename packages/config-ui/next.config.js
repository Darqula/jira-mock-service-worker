/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @faker-js/faker 10 is ESM-only; next/jest only transforms packages listed
  // here, and its CJS mode cannot require() an untransformed ESM module.
  transpilePackages: ['@jira-mock/core', '@faker-js/faker'],
};

module.exports = nextConfig;
