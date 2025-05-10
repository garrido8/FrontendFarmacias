import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { FarmaciasService } from '../../services/farmacias.service';

@Component({
  selector: 'app-mapa',
  standalone: false,
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  private userMarker: L.Marker | undefined;
  private userLocation: { latitude: number; longitude: number } | undefined;
  private farmaciasService = inject( FarmaciasService );


  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove(); // Limpiar el mapa al destruir el componente
    }
  }

  private initMap(): void {
    this.map = L.map('map').setView([39.47, -6.37], 13); // Centramos en Cáceres inicialmente

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/%22%3EOpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.getLocation();
  }

  private getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.centerMapOnUser(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Error al obtener la ubicación', error);
          // Aquí podrías mostrar un mensaje al usuario indicando que no se pudo obtener la ubicación
        }
      );
    } else {
      console.error('La geolocalización no es compatible con este navegador.');
      // Aquí podrías mostrar un mensaje al usuario indicando la falta de soporte
    }
  }

  private centerMapOnUser(latitude: number, longitude: number): void {

    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    if (this.map) {
      this.map.setView([latitude, longitude], 16); // Centramos y ajustamos el zoom

      if (this.userMarker) {
        this.map.removeLayer(this.userMarker); // Removemos el marcador anterior si existe
      }

      this.userMarker = L.marker([latitude, longitude], { icon: redIcon }).addTo(this.map)
        .bindPopup('Ubicación actual')
    }
  }

  public buscarFarmaciaMasCercana(): void {
    if( this.userLocation ) {
      this.farmaciasService.getFarmaciaMasCercana( this.userLocation.latitude, this.userLocation.longitude )
        .subscribe( (cercana) => {

          if (this.map) {
            this.map.setView([cercana.farmacia.geo_lat, cercana.farmacia.geo_long], 16); // Centramos y ajustamos el zoom
          }

          const blueIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          const marker = L.marker([cercana.farmacia.geo_lat, cercana.farmacia.geo_long], { icon: blueIcon }).addTo(this.map!)
        } )
    }
  }
}
