import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RouteResponse } from '../interfaces/ruta.interface';
import { apiKey, orsUrl } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class RutasService {

  private orsUrl: string = orsUrl;
  private apiKey: string = apiKey;
  private http: HttpClient = inject(HttpClient);

  getWalkingRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<RouteResponse> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('start', `${startLng},${startLat}`) // Longitud primero
      .set('end', `${endLng},${endLat}`);   // Longitud primero

    return this.http.get<RouteResponse>(this.orsUrl, { params });
  }
}
