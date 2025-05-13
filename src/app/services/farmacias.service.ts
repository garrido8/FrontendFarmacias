import { inject, Injectable } from '@angular/core';
import { Farmacia } from '../interfaces/farmacia.interface';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Cercana } from '../interfaces/cercana.interface';

@Injectable({
  providedIn: 'root'
})
export class FarmaciasService {

  private farmaciasUrl: string = 'http://localhost:3000'
  private http: HttpClient = inject( HttpClient )

  public getFarmacias(): Observable<Farmacia[]> {
    return this.http.get<Farmacia[]>(`${this.farmaciasUrl}/farmacias`);
  }

  public getFarmaciaMasCercana( lat: number, lon: number ): Observable<Cercana> {
    return this.http.get<Cercana>(`${this.farmaciasUrl}/farmacia-mas-cercana?lat=${lat}&long=${lon}`);
  }

  public getFarmaciasMasCercanas( lat: number, lon: number ): Observable<Farmacia[]> {
    return this.http.get<Farmacia[]>(`${this.farmaciasUrl}/farmacias-cercanas/top3?lat=${lat}&long=${lon}`);
  }

  public getFarmaciasPorRadio( lat: number, lon: number, radio: number ): Observable<Farmacia[]> {
    return this.http.get<Farmacia[]>(`${this.farmaciasUrl}/farmacias-en-radio?lat=${lat}&long=${lon}&radio=${radio}`);
  }
}

