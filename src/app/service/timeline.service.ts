import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {

  http: HttpClient = inject(HttpClient);

  // Endpoints
  apiUrl = `${environment.API_URL}`;
  notificationUrl = `${this.apiUrl}/eventos/notificar`;

  notifyLastEvent(solicitationId: number): Observable<boolean> {
    return this.http.get<boolean>(this.notificationUrl + "/" + solicitationId);
  }
}
