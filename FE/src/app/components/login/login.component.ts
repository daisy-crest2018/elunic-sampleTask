import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting:  boolean = false;
  errorMessage: string | null = null;
  message!: string;

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(24), this.usernameValidator()]],
      password: ['', [Validators.required, Validators.minLength(5), this.passwordValidator]],
    });
   }

   passwordValidator(control: any) {
    const value = control.value;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const valid = hasUpperCase && hasLowerCase && hasSpecialChar;
    return valid ? null : { invalidPassword: true };
  }

  usernameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const username = control.value;

      const validUsernamePattern =
        /^(?!.*[_.]{2})[a-zA-Z0-9][a-zA-Z0-9._]*[a-zA-Z0-9]$/;

      const isValid = validUsernamePattern.test(username);
      return isValid ? null : { invalidUsername: true };
    };
  }

  ngOnInit(): void {}

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = null;

      const loginDto = this.loginForm.value; 

      if (loginDto.username) {
        loginDto.username = loginDto.username.toLowerCase();
      }

      this.userService.loginUser(loginDto).subscribe({
        next: (response: any) => {
          console.log('Login successful:', response);
          this.message = response.message;
          setTimeout(() => {
            this.message = '';
            this.isSubmitting = false;
          }, 2000);
        },
        error: (error: any) => {
          this.message = error.error?.message || 'Login failed. Please try again.';
          setTimeout(() => {
            this.message = '';
            this.isSubmitting = false;
          }, 2000);
          console.error('Error occurred during login:', error);
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
    }
  }
}
