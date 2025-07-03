import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  constructor(private http: HttpClient) {}

  getQuestions(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/questions`);
  }

  createQuestion(question: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/questions`, question);
  }

  updateQuestion(id: string, question: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/questions/${id}`, question);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/questions/${id}`);
  }

  submitResponse(response: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/responses`, response);
  }

  getResponses(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/responses`);
  }

  getResponsesByMobile(mobile: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/responses/mobile/${mobile}`);
  }
  
  getResponsesByName(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/responses/name/${name}`);
  }
  
  getResponsesByFieldValue(field: string, value: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/responses/field/${field}/${value}`);
  }
  
  updateResponse(id: string, response: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/responses/${id}`, response);
  }
}