import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VideoService, Video } from '../../services/video.service';
import { AuthService, User } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../material.module';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  searchQuery = '';
  favoritesQuery = '';
  videos: Video[] = [];
  favorites: any[] = [];
  filteredFavorites: any[] = [];
  loading = false;
  favoritesLoading = false;
  activeTab: 'search' | 'favorites' | 'playlists' = 'search';
  nextPageToken?: string;
  prevPageToken?: string;
  suggestions: string[] = [];
  showSuggestions = false;
  suggestLoading = false;
  favoriteLoadingIds: string[] = [];
  previewVideo: Video | null = null;
  currentUser$!: Observable<User | null>;
  playlists: { id: string; name: string; videos: { videoId: string; title: string; thumbnail: string; channelTitle: string; }[] }[] = [];
  playlistName = '';
  selectedPlaylistId: string | null = null;
  loggingOut = false;

  private suggestDebounce?: any;

  constructor(private videoService: VideoService, private auth: AuthService, private router: Router, private sanitizer: DomSanitizer, private snackBar: MatSnackBar) {}

  async ngOnInit(): Promise<void> {
    this.currentUser$ = this.auth.currentUser$;
    await this.loadFavorites();
    this.loadPlaylists();
  }

  async loadFavorites(): Promise<void> {
    this.favoritesLoading = true;
    try {
      this.favorites = await this.videoService.getFavorites();
      this.filteredFavorites = this.favorites;
    } catch {}
    finally {
      this.favoritesLoading = false;
    }
  }

  async performSearch(query: string, token?: string): Promise<void> {
    if (!query.trim()) return;
    this.loading = true;
    try {
      const data = await this.videoService.searchVideos(query, 20, token);
      this.videos = data.items || [];
      this.nextPageToken = data.nextPageToken;
      this.prevPageToken = data.prevPageToken;
      this.activeTab = 'search';
    } catch (e) {
    } finally {
      this.loading = false;
      this.showSuggestions = false;
    }
  }

  async changePage(token?: string): Promise<void> {
    await this.performSearch(this.searchQuery, token);
  }

  onTabChange(event: any): void {
    if (event.index === 0) this.activeTab = 'search';
    else if (event.index === 1) this.activeTab = 'favorites';
    else this.activeTab = 'playlists';
  }

  onQueryChange(): void {
    if (this.suggestDebounce) clearTimeout(this.suggestDebounce);
    if (!this.searchQuery.trim()) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    this.suggestLoading = true;
    this.suggestDebounce = setTimeout(async () => {
      try {
        this.suggestions = await this.videoService.getSuggestions(this.searchQuery, 8);
        this.showSuggestions = this.suggestions.length > 0;
      } catch {
        this.suggestions = [];
        this.showSuggestions = false;
      } finally {
        this.suggestLoading = false;
      }
    }, 250);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions = [];
    this.showSuggestions = false;
  }

  async addFavorite(v: Video): Promise<void> {
    if (this.favoriteLoadingIds.includes(v.id)) return;
    this.favoriteLoadingIds.push(v.id);
    try {
      await this.videoService.addToFavorite({
        videoId: v.id,
        title: v.title,
        thumbnail: v.thumbnail,
        channelTitle: v.channelTitle,
        description: v.description,
        publishedAt: v.publishedAt,
      });
      await this.loadFavorites();
      this.snackBar.open('Añadido a favoritos', 'Cerrar', { duration: 2000 });
    } finally {
      this.favoriteLoadingIds = this.favoriteLoadingIds.filter((id) => id !== v.id);
    }
  }

  async removeFavorite(videoId: string): Promise<void> {
    if (this.favoriteLoadingIds.includes(videoId)) return;
    this.favoriteLoadingIds.push(videoId);
    try {
      await this.videoService.removeFromFavorite(videoId);
      await this.loadFavorites();
      this.snackBar.open('Eliminado de favoritos', 'Cerrar', { duration: 2000 });
    } finally {
      this.favoriteLoadingIds = this.favoriteLoadingIds.filter((id) => id !== videoId);
    }
  }

  isFavorite(videoId: string): boolean {
    return this.favorites.some((f) => (f.videoId ?? f.id) === videoId);
  }

  async logout(): Promise<void> {
    if (this.loggingOut) return;
    this.loggingOut = true;
    await new Promise((r) => setTimeout(r, 600));
    await this.auth.logout();
    this.loggingOut = false;
    this.router.navigate(['/login']);
  }

  openPreview(v: Video): void {
    this.previewVideo = v;
  }

  openPreviewFavorite(f: any): void {
    this.previewVideo = {
      id: f.videoId,
      title: f.title,
      description: f.description,
      thumbnail: f.thumbnail,
      channelTitle: f.channelTitle,
      publishedAt: f.publishedAt,
    };
  }

  closePreview(): void {
    this.previewVideo = null;
  }

  videoEmbedUrl(videoId?: string | null): SafeResourceUrl {
    const id = videoId || '';
    const url = `https://www.youtube.com/embed/${id}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  onFavoritesQueryChange(): void {
    const q = this.favoritesQuery.trim().toLowerCase();
    if (!q) { this.filteredFavorites = this.favorites; return; }
    this.filteredFavorites = this.favorites.filter((f) => {
      const title = (f.title || f.videoTitle || '').toLowerCase();
      const channel = (f.channelTitle || '').toLowerCase();
      return title.includes(q) || channel.includes(q);
    });
  }

  loadPlaylists(): void {
    const raw = localStorage.getItem('playlists');
    this.playlists = raw ? JSON.parse(raw) : [];
  }

  savePlaylists(): void {
    localStorage.setItem('playlists', JSON.stringify(this.playlists));
  }

  createPlaylist(): void {
    const name = this.playlistName.trim();
    if (!name) return;
    const id = Math.random().toString(36).slice(2);
    this.playlists.push({ id, name, videos: [] });
    this.playlistName = '';
    this.savePlaylists();
    this.snackBar.open('Playlist creada', 'Cerrar', { duration: 2000 });
  }

  addToPlaylist(playlistId: string, v: any): void {
    const p = this.playlists.find(pl => pl.id === playlistId);
    if (!p) return;
    const videoId = (v.id ?? v.videoId) as string;
    if (p.videos.some(x => x.videoId === videoId)) {
      this.snackBar.open('El video ya está en la playlist', 'Cerrar', { duration: 2000 });
      return;
    }
    p.videos.push({
      videoId,
      title: v.title,
      thumbnail: v.thumbnail,
      channelTitle: v.channelTitle,
    });
    this.savePlaylists();
    this.snackBar.open('Añadido a playlist', 'Cerrar', { duration: 2000 });
  }

  selectPlaylist(id: string): void {
    this.selectedPlaylistId = id;
  }

  selectedPlaylistVideos(): { videoId: string; title: string; thumbnail: string; channelTitle: string; }[] {
    const p = this.playlists.find(pl => pl.id === this.selectedPlaylistId);
    return p?.videos || [];
  }

  openPreviewPlaylistVideo(pv: { videoId: string; title: string; thumbnail: string; channelTitle: string; }): void {
    this.previewVideo = {
      id: pv.videoId,
      title: pv.title,
      description: '',
      thumbnail: pv.thumbnail,
      channelTitle: pv.channelTitle,
      publishedAt: '',
    } as Video;
  }
}