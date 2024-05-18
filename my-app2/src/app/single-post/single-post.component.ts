// single-post.component.ts
import { Component, OnInit, Inject } from '@angular/core'; // Import Inject
import { ActivatedRoute } from '@angular/router';
import { PostService, ApiService } from '../api.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog'; // Import MAT_DIALOG_DATA
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-single-post',
  templateUrl: './single-post.component.html',
  styleUrls: ['./single-post.component.css']
})
export class SinglePostComponent implements OnInit {
  userInfo: any;
  post: any;
  answerText = '';
  commentText: string[] = [];
  token: string | null = null;
 
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, // Inject the dialog data here
    private postService: PostService, private route: ActivatedRoute,
    private apiService: ApiService, private cookieService: CookieService
  ) {
    this.userInfo = data.userInfo;
  }

  ngOnInit(): void {
     this.postService.getPost(this.data.postId).subscribe(post => {
       this.post = post;
     });
   }

   loadPost() {
    this.postService.getPost(this.post._id).subscribe(post => {
      this.post = post;
    });
   }

  submitAnswer() {
    if (!this.answerText) {
      return;
    }
    this.apiService.createAnswer(this.post._id, this.answerText, this.token = this.cookieService.get('token')).subscribe(
      (res) => {
        // Reload the post to display the new answer
        this.loadPost();
        this.answerText = '';
      },
      (error) => {
        console.error('Error creating answer', error);
      }
    );
  }

  validateAnswer(answerId: string): void {
    this.apiService.validateAnswer(this.post._id, answerId, this.token = this.cookieService.get('token')).subscribe(
      response => this.loadPost(),
      error => console.error('Error validating answer', error)
    );
    
  }

  submitComment(answerId: string, index: number) {
    if (!this.commentText[index]) {
      return;
    }
    this.apiService.createComment(this.post._id, answerId, this.commentText[index], this.token = this.cookieService.get('token')).subscribe(
      (res) => {
        // Clear the comment text
        this.commentText[index] = '';
        // Reload the post to display the new comment
        this.loadPost();
      },
      (error) => {
        console.error('Error creating comment', error);
      }
    );
  }

  upvoteDownvote(answerId: string, value: boolean) {
    const token = this.cookieService.get('token');
    this.apiService.upvoteAnswer(this.post._id, answerId, token, value).subscribe(
      res => {
        // Reload the post to display the new score
        this.loadPost();
      },
      err => {
        console.error(err);
      }
    );
  }
}