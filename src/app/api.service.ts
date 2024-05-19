import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private url = environment.BACKEND_URI;

  constructor(private http: HttpClient, private cookieService: CookieService) { }

  createUser(data: { username: string; password: string; email: string; expert: boolean; }) {
    console.log("createUser called with data: ", data);
    const headers = this.getHeaders();
    return this.http.post(`${this.url}/createUser`, data, { headers });
  }

  login(data: { username: string; password: string; rememberMe: boolean; }) {
    console.log("login called with data: ", data);
    return this.http.post(`${this.url}/login`, data).subscribe({
      next: (response: any) => {
        console.log("Login Response:", response); // Log the response
        if (response && response.success && response.token) {
          if (data.rememberMe) {
            this.cookieService.set('token', response.token, { expires: 30 }); // Expire après 30 jours
          } else {
            localStorage.setItem('token', response.token);
          }
          window.location.reload();
        }
      },
      error: (error) => {
        console.error('Login failed', error);
      }
    });
  }

  createPost(data: { title: string; content: string; token: string; }) {
    const headers = this.getHeaders();
    return this.http.post(`${this.url}/create_post`, data, { headers });
}

archivePost(postId: string, token: string): Observable<any> {
  return this.http.post(`${this.url}/archive_post`, { postId, token });
}

  private getHeaders() {
    const token = this.cookieService.get('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getPosts(page: number, filterArchived: boolean, searchInput : string): Observable<{ posts: any[], pagesNeeded: number, searchInput : string}> {
    return this.http.get<{ posts: any[], pagesNeeded: number, searchInput : string}>(`${this.url}/posts/${page}/${filterArchived}/${searchInput}`);
  }

  createAnswer(postId: string, text: string, token: string) {
    const headers = this.getHeaders();
    return this.http.post(`${this.url}/create_answer`, { postId, text, token }, { headers });
  }

  createComment(postId: string, answerId: string, text: string, token: string) {
    const headers = this.getHeaders();
    return this.http.post(`${this.url}/create_comment`, { postId, answerId, text, token }, { headers });
  }

  getUserInfo(token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.url}/me`, { headers });
  }

  ratePost(postId: string, rating: number, token: string) {
    return this.http.post(`${this.url}/rate_post`, { postId, rating, token });
  }

  upvoteAnswer(postId: string, answerId: string, token: string, value: boolean): Observable<any> {
    return this.http.post<any>(`${this.url}/upvote_answer`, { postId, answerId, token, value });
  }

  validateAnswer(postId: string, answerId: string, token: string): Observable<any> {
    return this.http.post(`${this.url}/validate_answer`, { postId, answerId, token });
  }
}


@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = environment.BACKEND_URI;

  constructor(private http: HttpClient) { }

  getPost(id: string): Observable<any> {
    console.log("URL: ", this.apiUrl);
    return this.http.get(`${this.apiUrl}/post/${id}`);
  }
}
