import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { FarmaciasService } from '../../services/farmacias.service';
import { RouteResponse } from '../../interfaces/ruta.interface';
import { RutasService } from '../../services/rutas.service';

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
  private farmaciasService = inject(FarmaciasService);
  private routingService = inject(RutasService); // Inyecta el servicio de enrutamiento
  private walkingRouteLayer: L.Polyline | undefined;
  private carRouteLayer: L.Polyline | undefined;
  private bikeRouteLayer: L.Polyline | undefined;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      if (this.walkingRouteLayer) this.map.removeLayer(this.walkingRouteLayer);
      if (this.carRouteLayer) this.map.removeLayer(this.carRouteLayer);
      if (this.bikeRouteLayer) this.map.removeLayer(this.bikeRouteLayer);
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('map').setView([39.47, -6.37], 13);

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
        }
      );
    } else {
      console.error('La geolocalización no es compatible con este navegador.');
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
      this.map.setView([latitude, longitude], 16);

      if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
      }

      this.userMarker = L.marker([latitude, longitude], { icon: redIcon }).addTo(this.map)
        .bindPopup('Ubicación actual');
    }
  }

  public buscarFarmaciaMasCercana(): void {
    if (this.userLocation && this.map) {
      this.farmaciasService.getFarmaciaMasCercana(this.userLocation.latitude, this.userLocation.longitude)
        .subscribe((cercana) => {
          this.map!.setView([cercana.farmacia.geo_lat, cercana.farmacia.geo_long], 16);

          const blueIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          L.marker([cercana.farmacia.geo_lat, cercana.farmacia.geo_long], { icon: blueIcon }).addTo(this.map!)
            .bindPopup(cercana.farmacia.schema_name);

          const startLat = this.userLocation!.latitude;
          const startLng = this.userLocation!.longitude;
          const endLat = cercana.farmacia.geo_lat;
          const endLng = cercana.farmacia.geo_long;

          // Obtener y mostrar la ruta a pie
          this.routingService.getWalkingRoute(startLat, startLng, endLat, endLng)
            .subscribe(routeData => {
              this.showRouteOnMap(routeData, 'green', 'Ruta a pie');
            });

          // Obtener y mostrar la ruta en coche
          this.routingService.getCarRoute(startLat, startLng, endLat, endLng)
            .subscribe(routeData => {
              this.showRouteOnMap(routeData, 'blue', 'Ruta en coche');
            });

          // Obtener y mostrar la ruta en bicicleta
          this.routingService.getBikeRoute(startLat, startLng, endLat, endLng)
            .subscribe(routeData => {
              this.showRouteOnMap(routeData, 'purple', 'Ruta en bicicleta');
            });
        });
    }
  }

  private showRouteOnMap(routeData: RouteResponse, color: string, popupText: string): void {
    if (this.map && routeData.features && routeData.features.length > 0) {
      const geometry = routeData.features[0].geometry;
      if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
        const coordinates = geometry.coordinates;
        if (Array.isArray(coordinates)) {
          const latlngs = coordinates.map(coord => {
            if (Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
              return [coord[1], coord[0]] as L.LatLngExpression;
            } else {
              console.warn('Coordenada inválida:', coord);
              return null;
            }
          }).filter(coord => coord !== null) as L.LatLngExpression[]; // Filtrar coordenadas inválidas

          if (latlngs.length > 0) {
            const polylineLayer = L.polyline(latlngs, { color: color });
            polylineLayer.bindPopup(popupText).openPopup();

            if (color === 'green') this.walkingRouteLayer = polylineLayer;
            if (color === 'blue') this.carRouteLayer = polylineLayer;
            if (color === 'purple') this.bikeRouteLayer = polylineLayer;

            polylineLayer.addTo(this.map);
            this.map.fitBounds(polylineLayer.getBounds(), { padding: [50, 50] }); // Ajustar bounds para la última ruta
          } else {
            console.warn(`No hay coordenadas válidas para dibujar la ruta (${popupText}).`);
          }
        } else {
          console.warn(`Formato de coordenadas inesperado (${popupText}).`);
        }
      } else {
        console.warn(`No hay información de coordenadas en la respuesta (${popupText}).`);
      }
    } else {
      console.warn(`No hay características de ruta en la respuesta (${popupText}).`);
    }
  }
}
