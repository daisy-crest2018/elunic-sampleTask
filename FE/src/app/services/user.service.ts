import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserDto } from '../interface/userDto';
import { BehaviorSubject, Observable } from 'rxjs';
import { RegistrationOutcome } from '../interface/registrationOutcome';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private outcomeSubject = new BehaviorSubject<RegistrationOutcome | null>(null);
  outcome$ = this.outcomeSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(){
    this.apiUrl = environment.apiUrl;
  }
  setOutcome(outcome: RegistrationOutcome) {
    this.outcomeSubject.next(outcome);
  }

  createUser(user: UserDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  loginUser(user: UserDto): Observable<any>{
    return this.http.post(`${this.apiUrl}/login`, user);
  }
}
