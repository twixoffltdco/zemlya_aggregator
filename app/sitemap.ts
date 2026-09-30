import type {MetadataRoute} from 'next';
import {siteUrl} from '@/lib/config';
import {getChannels, getThreads, getVideos} from '@/lib/fetcher';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tv, radio, video, forum] = await Promise.all([
    getChannels('tv'),
    getChannels('radio'),
    getVideos(),
    getThreads(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {url: siteUrl, changeFrequency: 'daily', priority: 1},
    {url: `${siteUrl}/tv`, changeFrequency: 'hourly', priority: 0.9},
    {url: `${siteUrl}/radio`, changeFrequency: 'hourly', priority: 0.8},
    {url: `${siteUrl}/video`, changeFrequency: 'hourly', priority: 0.9},
    {url: `${siteUrl}/forum`, changeFrequency: 'hourly', priority: 0.8},
    ...tv.map((x: any): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/tv/${x.slug}`,
      changeFrequency: 'daily',
      priority: 0.7,
    })),
    ...radio.map((x: any): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/radio/${x.slug}`,
      changeFrequency: 'daily',
      priority: 0.7,
    })),
    ...video.map((x: any): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/video/${x.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    ...forum.map((x: any): MetadataRoute.Sitemap[number] => ({
      url: `${siteUrl}/forum/${x.id}`,
      changeFrequency: 'daily',
      priority: 0.6,
    })),
  ];

  return entries;
}
