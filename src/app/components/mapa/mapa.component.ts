import { Component, OnInit, AfterViewInit, OnDestroy, inject } from '@angular/core';
import * as L from 'leaflet';
import { FarmaciasService } from '../../services/farmacias.service';
import { RouteResponse } from '../../interfaces/ruta.interface';
import { RutasService } from '../../services/rutas.service';

interface RouteInfo {
  formattedText: string;
}

@Component({
  selector: 'app-mapa',
  standalone: false,
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | undefined;
  private userMarker: L.Marker | undefined;
  private userLocation: { latitude: number; longitude: number } | undefined;
  private farmaciasService = inject(FarmaciasService);
  private routingService = inject(RutasService);
  public walkingRouteInfo: RouteInfo | undefined;
  public carRouteInfo: RouteInfo | undefined;
  public bikeRouteInfo: RouteInfo | undefined;
  public walkingRouteLayer: L.Polyline | undefined;
  public carRouteLayer: L.Polyline | undefined;
  public bikeRouteLayer: L.Polyline | undefined;
  private farmaciaMarkers: L.Marker[] = [];
  public showRoute: boolean = false;
  public showRouteCar: boolean = false;
  public showRouteBike: boolean = false;
  public showRouteWalking: boolean = false;
  public radio: number = 2;


  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.clearRouteLayers();
      this.farmaciaMarkers.forEach(marker => this.map?.removeLayer(marker));
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

  public buscarTresFarmacias(): void {
    if (this.userLocation && this.map) {
      this.farmaciasService.getFarmaciasMasCercanas(this.userLocation.latitude, this.userLocation.longitude)
        .subscribe((farmacias) => {
          this.clearRouteLayers();
          this.farmaciaMarkers.forEach(marker => this.map?.removeLayer(marker));
          this.farmaciaMarkers = [];
          let bounds = L.latLngBounds([]);
          farmacias.forEach((cercana, index) => {
            const marker = this.addFarmaciaMarker(cercana.geo_lat, cercana.geo_long, cercana.schema_name);
            this.farmaciaMarkers.push(marker);
            bounds.extend([cercana.geo_lat, cercana.geo_long]);

            marker.on('click', () => {
              this.clearRouteLayers();
              this.showRoute = true;
              const startLat = this.userLocation!.latitude;
              const startLng = this.userLocation!.longitude;
              const endLat = cercana.geo_lat;
              const endLng = cercana.geo_long;
              this.getWalkingRoute(startLat, startLng, endLat, endLng, index);
              this.getCarRoute(startLat, startLng, endLat, endLng, index);
              this.getBikeRoute(startLat, startLng, endLat, endLng, index);
            });
            this.map?.addLayer(marker);
          });
          bounds.extend([this.userLocation!.latitude, this.userLocation!.longitude]);
          this.map!.fitBounds(bounds, { padding: [50, 50] });
        });
    }
  }

  public buscarFarmaciaMasCercana(): void {
    if (this.userLocation && this.map) {
      this.farmaciasService.getFarmaciaMasCercana(this.userLocation.latitude, this.userLocation.longitude)
        .subscribe((farmacia) => {
          this.map!.setView([farmacia.geo_lat, farmacia.geo_long], 16);
          this.clearRouteLayers();
          this.farmaciaMarkers.forEach(marker => this.map?.removeLayer(marker));
          this.farmaciaMarkers = [];
          const marker = this.addFarmaciaMarker(farmacia.geo_lat, farmacia.geo_long, farmacia.schema_name);
          this.farmaciaMarkers.push(marker);
          this.showRoute = true;

          const startLat = this.userLocation!.latitude;
          const startLng = this.userLocation!.longitude;
          const endLat = farmacia.geo_lat;
          const endLng = farmacia.geo_long;

          this.getWalkingRoute(startLat, startLng, endLat, endLng, 0);
          this.getCarRoute(startLat, startLng, endLat, endLng, 0);
          this.getBikeRoute(startLat, startLng, endLat, endLng, 0);
        });
    }
  }

  public buscarFarmaciasPorRadio(radio: number): void {
    if (this.userLocation && this.map) {
      this.farmaciasService.getFarmaciasPorRadio(this.userLocation.latitude, this.userLocation.longitude, radio)
        .subscribe((farmacias) => {
          this.clearRouteLayers();
          this.farmaciaMarkers.forEach(marker => this.map?.removeLayer(marker));
          this.farmaciaMarkers = [];
          let bounds = L.latLngBounds([]);
          farmacias.forEach((cercana, index) => {
            const marker = this.addFarmaciaMarker(cercana.geo_lat, cercana.geo_long, cercana.schema_name);
            this.farmaciaMarkers.push(marker);
            bounds.extend([cercana.geo_lat, cercana.geo_long]);

            marker.on('click', () => {
              this.clearRouteLayers();
              this.showRoute = true;
              const startLat = this.userLocation!.latitude;
              const startLng = this.userLocation!.longitude;
              const endLat = cercana.geo_lat;
              const endLng = cercana.geo_long;
              this.getWalkingRoute(startLat, startLng, endLat, endLng, index);
              this.getCarRoute(startLat, startLng, endLat, endLng, index);
              this.getBikeRoute(startLat, startLng, endLat, endLng, index);
            });
            this.map?.addLayer(marker);
          });
          bounds.extend([this.userLocation!.latitude, this.userLocation!.longitude]);
          this.map!.fitBounds(bounds, { padding: [50, 50] });
        });
    }
  }


  public getWalkingRoute(startLat: number, startLng: number, endLat: number, endLng: number, index: number): void {
    this.routingService.getWalkingRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.walkingRouteInfo = this.formatRouteInfo(routeData);
        this.showRouteOnMap(routeData, 'green', this.walkingRouteLayer);
        this.showRouteWalking = true;
      });
  }

  public getCarRoute(startLat: number, startLng: number, endLat: number, endLng: number, index: number): void {
    this.routingService.getCarRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.carRouteInfo = this.formatRouteInfo(routeData);
        this.showRouteOnMap(routeData, 'blue', this.carRouteLayer);
        this.showRouteCar = true;
      });
  }

  public getBikeRoute(startLat: number, startLng: number, endLat: number, endLng: number, index: number): void {
    this.routingService.getBikeRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.bikeRouteInfo = this.formatRouteInfo(routeData);
        this.showRouteOnMap(routeData, 'purple', this.bikeRouteLayer);
        this.showRouteBike = true;
      });
  }

  private formatRouteInfo(routeData: RouteResponse): RouteInfo {
    let distance = 0;
    let duration = 0;

    if (routeData.features && routeData.features.length > 0) {
      distance = routeData.features[0]?.properties?.summary?.distance || 0;
      duration = routeData.features[0]?.properties?.summary?.duration || 0;
    }

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);

    let durationString = '';
    if (hours > 0) {
      durationString += `${hours} hora${hours > 1 ? 's' : ''}, `;
    }
    if (minutes > 0) {
      durationString += `${minutes} minuto${minutes > 1 ? 's' : ''}, `;
    }
    durationString += `${seconds} segundo${seconds !== 1 ? 's' : ''}`;

    const distanceString = distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance.toFixed(2)} m`;

    const formattedText = `Distancia: ${distanceString}<br>Duración: ${durationString}`;
    return { formattedText };
  }

  private showRouteOnMap(routeData: RouteResponse, color: string, layer: L.Polyline | undefined): void {
    if (this.map && routeData.features && routeData.features.length > 0) {
      const geometry = routeData.features[0].geometry;
      if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
        const coordinates = geometry.coordinates;
        if (Array.isArray(coordinates)) {
          const latlngs = coordinates.map(coord => {
            if (Array.isArray(coord) && coord.length === 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number') {
              return [coord[1], coord[0]] as L.LatLngExpression;
            } else {
              console.warn(`Coordenada inválida (Ruta):`, coord);
              return null;
            }
          }).filter(coord => coord !== null) as L.LatLngExpression[];

          if (latlngs.length > 0) {
            let popupContent = '';
            if (color === 'green' && this.walkingRouteInfo) {
              popupContent = this.walkingRouteInfo.formattedText;
            } else if (color === 'blue' && this.carRouteInfo) {
              popupContent = this.carRouteInfo.formattedText;
            } else if (color === 'purple' && this.bikeRouteInfo) {
              popupContent = this.bikeRouteInfo.formattedText;
            }
            const polyline = L.polyline(latlngs, { color: color }).bindPopup(popupContent);
            polyline.addTo(this.map);

            if (color === 'green') {
              this.walkingRouteLayer = polyline;
            } else if (color === 'blue') {
              this.carRouteLayer = polyline;
            } else if (color === 'purple') {
              this.bikeRouteLayer = polyline;
            }
          } else {
            console.warn(`No hay coordenadas válidas para dibujar la ruta.`);
          }
        } else {
          console.warn(`Formato de coordenadas inesperado.`);
        }
      } else {
        console.warn(`No hay información de coordenadas en la respuesta de la ruta.`);
      }
    } else {
      console.warn(`No hay características de ruta en la respuesta.`);
    }
  }

  public focusWalkingRoute(): void {
    this.centerOnRoute(this.walkingRouteLayer, this.walkingRouteInfo?.formattedText);
  }

  public focusCarRoute(): void {
    this.centerOnRoute(this.carRouteLayer, this.carRouteInfo?.formattedText);
  }

  public focusBikeRoute(): void {
    this.centerOnRoute(this.bikeRouteLayer, this.bikeRouteInfo?.formattedText);
  }

  private centerOnRoute(layer: L.Polyline | undefined, popupContent: string | undefined): void {
    if (this.map && layer && popupContent) {
      this.map.fitBounds(layer.getBounds(), { padding: [80, 80] });
      layer.setPopupContent(popupContent).openPopup();
    } else if (this.map && layer) {
      this.map.fitBounds(layer.getBounds(), { padding: [80, 80] });
      layer.openPopup();
    }
  }

  private addFarmaciaMarker(lat: number, lng: number, name: string, ): L.Marker {
    const blueIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    const marker = L.marker([lat, lng], { icon: blueIcon }).addTo(this.map!).bindPopup(name);
    return marker;
  }

  private clearRouteLayers(): void {
    if (this.map) {
      if (this.walkingRouteLayer) this.map.removeLayer(this.walkingRouteLayer);
      if (this.carRouteLayer) this.map.removeLayer(this.carRouteLayer);
      if (this.bikeRouteLayer) this.map.removeLayer(this.bikeRouteLayer);
      this.walkingRouteLayer = undefined;
      this.carRouteLayer = undefined;
      this.bikeRouteLayer = undefined;
      this.walkingRouteInfo = undefined;
      this.carRouteInfo = undefined;
      this.bikeRouteInfo = undefined;
    }
  }
}
