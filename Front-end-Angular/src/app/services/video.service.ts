import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private baseUrl = environment.apiUrl + '/api';

  constructor(private http: HttpClient) {}

  async searchVideos(query: string, maxResults: number = 20, pageToken?: string) {
    const params = new URLSearchParams({
      query,
      maxResults: String(maxResults),
      ...(pageToken ? { pageToken } : {}),
    });
    const res: any = await firstValueFrom(
      this.http.get(`${this.baseUrl}/videos/search?${params.toString()}`)
    );
    const rawItems = res?.data?.videos || res?.items || [];
    const items: Video[] = Array.isArray(rawItems)
      ? rawItems.map((v: any) => ({
          id: v.id ?? v.videoId,
          title: v.title,
          description: v.description,
          thumbnail: v.thumbnail,
          channelTitle: v.channelTitle,
          publishedAt: v.publishedAt,
        }))
      : [];
    const pageInfo = res?.data?.total
      ? { totalResults: res.data.total, resultsPerPage: items.length }
      : res?.pageInfo || { totalResults: items.length, resultsPerPage: items.length };
    return {
      items,
      pageInfo,
      nextPageToken: res.nextPageToken,
      prevPageToken: res.prevPageToken,
    };
  }

  async getSuggestions(query: string, maxResults: number = 8) {
    const params = new URLSearchParams({ query, maxResults: String(maxResults) });
    const res: any = await firstValueFrom(
      this.http.get(`${this.baseUrl}/videos/suggestions?${params.toString()}`)
    );
    return res?.data?.suggestions || res?.suggestions || [];
  }

  async getFavorites() {
    const res: any = await firstValueFrom(this.http.get(`${this.baseUrl}/videos/favorites`));
    return res?.data?.favorites || res?.favorites || [];
  }

  async addToFavorite(videoData: {
    videoId: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
    description?: string;
    publishedAt?: string;
  }) {
    return await firstValueFrom(this.http.post(`${this.baseUrl}/videos/favorites`, videoData));
  }

  async removeFromFavorite(videoId: string) {
    return await firstValueFrom(this.http.delete(`${this.baseUrl}/videos/favorites/${videoId}`));
  }
}