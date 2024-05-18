import { Component, OnInit } from '@angular/core';
import { ApiService, PostService } from './api.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogComponent } from './dialog/dialog.component';
import { CreatePostComponent } from './create-post/create-post.component';
import { SinglePostComponent } from './single-post/single-post.component';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'my-app2';
  message: any;
  posts: any[] = [];
  token: string | null = null;
  hideArchivePost: boolean = false;
  page: number = 1;
  pagesNeeded: number = 1;
  userInfo: any;
  searchInput: string = '';

  constructor(private apiService: ApiService, public dialog: MatDialog, private cookieService: CookieService, private postService: PostService) { };

  ngOnInit() {
    this.token = this.cookieService.get('token');
    this.getUserInfo();
    this.getPosts();
  }

  getUserInfo() {
    if (this.token) {
      this.apiService.getUserInfo(this.token).subscribe(
        (userInfo) => {
          this.userInfo = userInfo;
        },
        (error) => console.error('Error getting user info', error
      ));
    }
  }

  getPosts() {
    if (this.searchInput == null) {
      this.searchInput = '';
    }
    this.apiService.getPosts(this.page, this.hideArchivePost, this.searchInput).subscribe(response => {
      this.posts = response.posts;
      this.pagesNeeded = response.pagesNeeded;
      this.searchInput = response.searchInput;
    });
  }

  openDialog() {
    this.dialog.open(DialogComponent);
  }

  openCreatePost() {
    const dialogRef = this.dialog.open(CreatePostComponent, {
      width: '50%',
      height: '50%'
    });
  }

  toggleArchivePosts() {
    this.hideArchivePost = !this.hideArchivePost;
    this.getPosts();
  }

  archivePost(postId: string) {
    if (this.token) {
      this.apiService.archivePost(postId, this.token).subscribe(
        (res) => {
          console.log('Post archived', res);
          // You might want to refresh the posts or do something else here
        },
        (error) => {
          console.error('Error archiving post', error);
        }
      );
    } else {
      console.error('Token is not available');
      // Redirect the user to the login page or show an error message
    }
  }

  ratePost(postId: string, value: number) {
    const token = this.token; // Assuming this.token contains the current user's token
  
    this.apiService.ratePost(postId, value, this.cookieService.get('token')).subscribe(
      response => {
        this.getPosts();
      },
      error => {
        console.error('Error rating post', error);
      }
    );
  }

  openSinglePost(postId: string) {
    const dialogConfig = new MatDialogConfig();
  
    dialogConfig.data = {
      postId: postId,
      userInfo: this.userInfo
    };
  
    dialogConfig.width = '70%';
    dialogConfig.height = '70%';
  
    this.dialog.open(SinglePostComponent, dialogConfig);
  }

  logout() {
    this.cookieService.delete('token');
    this.token = null;
    window.location.reload();
  }

  previousPage() {
    if (this.page > 1) {
      this.page--;
      this.getPosts();
    }
  }
  
  nextPage() {
    if (this.page < this.pagesNeeded) {
      this.page++;
      this.getPosts();
    }
  }

  canArchivePost(post: any) {
    console.log('User info:', this.userInfo.id);
    console.log('Post:', post.user);
    return this.userInfo == post.user && !post.archived;
  }
 
}

