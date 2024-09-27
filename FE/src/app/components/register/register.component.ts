import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { UserDto } from 'src/app/interface/userDto';
import { UserService } from 'src/app/services/user.service';
import { RegistrationOutcome, defaultOutcome} from 'src/app/interface/registrationOutcome';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registrationForm!: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  outcome: RegistrationOutcome = defaultOutcome;
  message!: String;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private router: Router
  ) {}

  // CODE HERE
  //
  // I want to be able to create a new user for the application. Implement a reactive form that I can submit
  //
  // Form:
  // - username (required, min 3, max 24 characters)
  // - email (required, valid email address)
  // - type (required, select dropdown with either 'user' or 'admin')
  // - password (required, min 5, max 24 characters, upper and lower case, at least one special character)
  //
  // Requirements:
  // The form should submit a valid UserDto object (call createUser() function)
  // The submit button should be disabled if the form is invalid
  // The submit button should be disabled while the submit request is pending
  // If the request fails the button must become submittable again (error message must not be displayed)
  // Errors should be displayed under each input if not valid
  //
  // Futher Notes:
  // Styling is not important, use default HTML elements (no angular material or bootstrap)

  ngOnInit() {
    this.registrationForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(24),
          this.usernameValidator(),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, this.emailValidator()],
      ],
      type: ['user', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(24),
          this.passwordValidator,
        ],
      ],
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

  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value;
      const validEmailPattern =
        /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = validEmailPattern.test(email);
      return isValid ? null : { invalidEmail: true };
    };
  }

  async onSubmit() {
    if (this.registrationForm.valid) {
      const userDto: UserDto = this.registrationForm.value;
      await this.createUser(userDto); 
    }
  }

  public async createUser(user: UserDto) {
    this.isSubmitting = true; 
    this.errorMessage = null; 
    user.username = user.username.toLowerCase();

    this.userService.createUser(user).subscribe({
      next: (response: any) => {
        console.log('User created successfully:', response);
        this.message = response.message;
        setTimeout(() => {
          this.message = '';
          this.isSubmitting = false;
          this.router.navigate(['/login']);
        }, 2000);
        this.registrationForm.reset();
        this.registrationForm.get('type')?.setValue('user');
      },
      error: (error: any) => {
        this.message = error.error?.message;
          setTimeout(() => {
            this.message = '';
            this.isSubmitting = false;
          }, 2000)
      },
      complete: () => {
        console.log('User creation request completed.');
        this.isSubmitting = false; 
      },
    });
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
}
