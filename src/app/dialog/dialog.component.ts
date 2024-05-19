import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})


export class DialogComponent implements OnInit {

  user = { username: '', password: '', email: '', expert: false };
  loginData = { username: '', password: '', rememberMe: true};
  showFirstDiv = true;

  constructor(public dialogRef: MatDialogRef<DialogComponent>, private apiService: ApiService,) { }

  ngOnInit(): void {
  }

  closeDialog() {
    this.dialogRef.close();
  }

  createUser() {
    if (!this.user.username || !this.user.password || !this.user.email) {
      return;
    }
    if (!this.user.email.includes('@') || !this.user.email.includes('.')) {
      console.error('Invalid email');
      return;
    }
    this.apiService.createUser(this.user).subscribe(
      (data) => {
        console.log('User created successfully', data);
        this.closeDialog();
      },
      (error) => {
        console.error('Error creating user', error);
      }
    );
  }
  
  login() {
    this.apiService.login(this.loginData);
    this.closeDialog();
  }

  toggleDiv() {
    this.showFirstDiv = !this.showFirstDiv;
  }

}
