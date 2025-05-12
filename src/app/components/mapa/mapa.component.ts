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
  private routingService = inject(RutasService);
  public walkingRouteLayer: L.Polyline | undefined;
  public carRouteLayer: L.Polyline | undefined;
  public bikeRouteLayer: L.Polyline | undefined;
  private farmaciaMarker: L.Marker | undefined;
  public showRoute: boolean = false;
  public showRouteCar: boolean = false;
  public showRouteBike: boolean = false;
  public showRouteWalking: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.clearRouteLayers();
      if (this.farmaciaMarker) this.map.removeLayer(this.farmaciaMarker);
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
          this.addFarmaciaMarker(cercana.farmacia.geo_lat, cercana.farmacia.geo_long, cercana.farmacia.schema_name);
          this.clearRouteLayers();
          this.showRoute = true;

          const startLat = this.userLocation!.latitude;
          const startLng = this.userLocation!.longitude;
          const endLat = cercana.farmacia.geo_lat;
          const endLng = cercana.farmacia.geo_long;

          this.getWalkingRoute(startLat, startLng, endLat, endLng);
          this.getCarRoute(startLat, startLng, endLat, endLng);
          this.getBikeRoute(startLat, startLng, endLat, endLng);
        });
    }
  }


  public getWalkingRoute(startLat: number, startLng: number, endLat: number, endLng: number): void {
    this.routingService.getWalkingRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.showRouteOnMap(routeData, 'green', 'Ruta a pie', this.walkingRouteLayer);
        this.showRouteWalking = true;
      });
  }

  public getCarRoute(startLat: number, startLng: number, endLat: number, endLng: number): void {
    this.routingService.getCarRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.showRouteOnMap(routeData, 'blue', 'Ruta en coche', this.carRouteLayer);
        this.showRouteCar = true;
      });
  }

  public getBikeRoute(startLat: number, startLng: number, endLat: number, endLng: number): void {
    this.routingService.getBikeRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.showRouteOnMap(routeData, 'purple', 'Ruta en bicicleta', this.bikeRouteLayer);
        this.showRouteBike = true;
      });
  }

  private showRouteOnMap(routeData: RouteResponse, color: string, popupText: string, layer: L.Polyline | undefined): void {
    if (this.map && routeData.features && routeData.features.length > 0) {
      const geometry = routeData.features[0].geometry;
      if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
        const coordinates = geometry.coordinates;
        if (Array.isArray(coordinates)) {
          const latlngs = coordinates.map(coord => {
            if (Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
              return [coord[1], coord[0]] as L.LatLngExpression;
            } else {
              console.warn(`Coordenada inválida (${popupText}):`, coord);
              return null;
            }
          }).filter(coord => coord !== null) as L.LatLngExpression[];

          if (latlngs.length > 0) {
            // Create a new polyline or update the existing one
            if (layer) {
              layer.setLatLngs(latlngs); // Update the existing layer
            } else {
              const polyline = L.polyline(latlngs, { color: color }).bindPopup(popupText);
              polyline.addTo(this.map);
               if (color === 'green') {
                this.walkingRouteLayer = polyline;
              } else if (color === 'blue') {
                this.carRouteLayer = polyline;
              } else if (color === 'purple') {
                this.bikeRouteLayer = polyline;
              }
            }
          } else {
            console.warn(`No valid coordinates to draw route (${popupText})`);
          }
        } else {
          console.warn(`Unexpected coordinate format (${popupText})`);
        }
      } else {
        console.warn(`No coordinate information in response (${popupText})`);
      }
    } else {
      console.warn(`No route features in response (${popupText})`);
    }
  }

  public focusWalkingRoute(): void {
    this.centerOnRoute(this.walkingRouteLayer);
  }

  public focusCarRoute(): void {
    this.centerOnRoute(this.carRouteLayer);
  }

  public focusBikeRoute(): void {
    this.centerOnRoute(this.bikeRouteLayer);
  }

  private centerOnRoute(layer: L.Polyline | undefined): void {
    if (this.map && layer) {
      this.map.fitBounds(layer.getBounds(), { padding: [80, 80] });
      layer.openPopup();
    }
  }

  private addFarmaciaMarker(lat: number, lng: number, name: string): void {
    const blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    if (this.farmaciaMarker) {
      this.map?.removeLayer(this.farmaciaMarker);
    }
    this.farmaciaMarker = L.marker([lat, lng], { icon: blueIcon }).addTo(this.map!).bindPopup(name);
  }

  private clearRouteLayers(): void {
    if (this.map) {
      if (this.walkingRouteLayer) this.map.removeLayer(this.walkingRouteLayer);
      if (this.carRouteLayer) this.map.removeLayer(this.carRouteLayer);
      if (this.bikeRouteLayer) this.map.removeLayer(this.bikeRouteLayer);
      this.walkingRouteLayer = undefined;
      this.carRouteLayer = undefined;
      this.bikeRouteLayer = undefined;
    }
  }

  public checkClick( event: MouseEvent): void {
    const target = event.target as HTMLElement;
    console.log(target);
    if( target.classList.contains( 'walk' ) ) {
      this.focusWalkingRoute();
    }
  }
}
