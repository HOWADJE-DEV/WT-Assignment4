import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent {
  postData = { title: '', content: '', token: '' };

  constructor(public dialogRef: MatDialogRef<CreatePostComponent>, private apiService: ApiService, private cookieService: CookieService) { }

  ngOnInit(): void {
  }

  closeDialog() {
    this.dialogRef.close();
  }

  createPost() {
    if (!this.postData.title || !this.postData.content) {
        return;
    }
    this.postData.token = this.cookieService.get('token'); // Update the token in the class property
    console.log("Token Angular side = : ", this.postData.token);
    this.apiService.createPost(this.postData).subscribe({
        next: (response: any) => {
            console.log("Post created:", response);
            window.location.reload();
            this.dialogRef.close();
            // Handle success response
        },
        error: (error) => {
            console.error('Error creating post', error);
            // Handle error response
        }
    });
}
}
