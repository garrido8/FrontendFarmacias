import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RouteResponse } from '../interfaces/ruta.interface';
import { apiKey, bikeRoute, carRoute, walkingRoute } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class RutasService {

  private walkingRoute: string = walkingRoute;
  private carRoute: string = carRoute;
  private bikeRoute: string = bikeRoute;

  private apiKey: string = apiKey;
  private http: HttpClient = inject(HttpClient);

  public getWalkingRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<RouteResponse> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('start', `${startLng},${startLat}`) // Longitud primero
      .set('end', `${endLng},${endLat}`);   // Longitud primero

    return this.http.get<RouteResponse>(this.walkingRoute, { params });
  }

  public getCarRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<RouteResponse> {
    const params = new HttpParams()
          .set('api_key', this.apiKey)
      .set('start', `${startLng},${startLat}`) // Longitud primero
      .set('end', `${endLng},${endLat}`);   // Longitud primero

    return this.http.get<RouteResponse>(this.carRoute, { params });
  }

  public getBikeRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<RouteResponse> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('start', `${startLng},${startLat}`) // Longitud primero
      .set('end', `${endLng},${endLat}`);   // Longitud primero
    return this.http.get<RouteResponse>(this.bikeRoute, { params });
  }

}
