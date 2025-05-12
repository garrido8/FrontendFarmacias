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
  public walkingRouteLayer: L.Polyline | undefined;
  public carRouteLayer: L.Polyline | undefined;
  public bikeRouteLayer: L.Polyline | undefined;
  private farmaciaMarker: L.Marker | undefined; // Para el marcador de la farmacia
  public showRoute: boolean = false; // Bandera para mostrar la sección de rutas
  public showRouteCar: boolean = false; // Bandera para mostrar la información de la ruta en coche
  public showRouteBike: boolean = false; // Bandera para mostrar la información de la ruta en bicicleta
  public showRouteWalking: boolean = false; // Bandera para mostrar la información de la ruta a pie

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * Inicializa el mapa después de que la vista del componente esté completamente inicializada.
   */
  ngAfterViewInit(): void {
    this.initMap();
  }

  /**
   * Limpia las capas y remueve el mapa al destruir el componente.
   */
  ngOnDestroy(): void {
    if (this.map) {
      this.clearRouteLayers();
      if (this.farmaciaMarker) this.map.removeLayer(this.farmaciaMarker);
      this.map.remove();
    }
  }

  /**
   * Inicializa el mapa de Leaflet con una vista centrada y añade la capa de tiles.
   */
  private initMap(): void {
    this.map = L.map('map').setView([39.47, -6.37], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/%22%3EOpenStreetMap</a> contributors'
    }).addTo(this.map);

    this.getLocation();
  }

  /**
   * Obtiene la ubicación del usuario utilizando la API de geolocalización del navegador.
   */
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

  /**
   * Centra el mapa en la ubicación del usuario y añade un marcador.
   * @param latitude La latitud de la ubicación del usuario.
   * @param longitude La longitud de la ubicación del usuario.
   */
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

  /**
   * Busca la farmacia más cercana a la ubicación del usuario y solicita las rutas.
   */
  public buscarFarmaciaMasCercana(): void {
    if (this.userLocation && this.map) {
      this.farmaciasService.getFarmaciaMasCercana(this.userLocation.latitude, this.userLocation.longitude)
        .subscribe((cercana) => {
          this.map!.setView([cercana.farmacia.geo_lat, cercana.farmacia.geo_long], 16);
          this.addFarmaciaMarker(cercana.farmacia.geo_lat, cercana.farmacia.geo_long, cercana.farmacia.schema_name);
          this.clearRouteLayers();
          this.showRoute = true; // Mostrar la sección de rutas

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

  /**
   * Obtiene y muestra la ruta a pie entre dos puntos.
   * @param startLat La latitud del punto de inicio.
   * @param startLng La longitud del punto de inicio.
   * @param endLat La latitud del punto de destino.
   * @param endLng La longitud del punto de destino.
   */
  public getWalkingRoute(startLat: number, startLng: number, endLat: number, endLng: number): void {
    this.routingService.getWalkingRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.showRouteOnMap(routeData, 'green', 'Ruta a pie', this.walkingRouteLayer);
        this.showRouteWalking = true;
      });
  }

  /**
   * Obtiene y muestra la ruta en coche entre dos puntos.
   * @param startLat La latitud del punto de inicio.
   * @param startLng La longitud del punto de inicio.
   * @param endLat La latitud del punto de destino.
   * @param endLng La longitud del punto de destino.
   */
  public getCarRoute(startLat: number, startLng: number, endLat: number, endLng: number): void {
    this.routingService.getCarRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.showRouteOnMap(routeData, 'blue', 'Ruta en coche', this.carRouteLayer);
        this.showRouteCar = true;
      });
  }

  /**
   * Obtiene y muestra la ruta en bicicleta entre dos puntos.
   * @param startLat La latitud del punto de inicio.
   * @param startLng La longitud del punto de inicio.
   * @param endLat La latitud del punto de destino.
   * @param endLng La longitud del punto de destino.
   */
  public getBikeRoute(startLat: number, startLng: number, endLat: number, endLng: number): void {
    this.routingService.getBikeRoute(startLat, startLng, endLat, endLng)
      .subscribe(routeData => {
        this.showRouteOnMap(routeData, 'purple', 'Ruta en bicicleta', this.bikeRouteLayer);
        this.showRouteBike = true;
      });
  }

  /**
   * Muestra la ruta en el mapa creando una polilínea y añadiéndola a la capa correspondiente.
   * @param routeData Los datos de la ruta obtenidos del servicio.
   * @param color El color de la polilínea.
   * @param popupText El texto para el popup de la polilínea.
   * @param layer La capa de la polilínea a actualizar.
   */
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
          }).filter(coord => coord !== null) as L.LatLngExpression[]; // Filtrar coordenadas inválidas

          if (latlngs.length > 0) {
            const polylineLayer = L.polyline(latlngs, { color: color }).bindPopup(popupText);

            if (layer) {
              this.map.removeLayer(layer); // Remover la capa anterior si existe
            }

            polylineLayer.addTo(this.map);

            if (color === 'green') this.walkingRouteLayer = polylineLayer;
            if (color === 'blue') this.carRouteLayer = polylineLayer;
            if (color === 'purple') this.bikeRouteLayer = polylineLayer;

            // No ajustar el centro aquí, se hará al hacer clic en el texto de la ruta
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

  /**
   * Centra el mapa en una capa y abre su popup, ajustando los límites con un padding.
   * @param layer La capa de Leaflet (Polyline) a centrar.
   */
  private centerOnRoute(layer: L.Polyline | undefined): void {
    if (this.map && layer) {
      this.map.fitBounds(layer.getBounds(), { padding: [80, 80] }); // Ajusta el padding aquí
      layer.openPopup();
    }
  }

  /**
   * Centra el mapa en la ruta a pie.
   */
  public focusWalkingRoute(): void {
    this.centerOnRoute(this.walkingRouteLayer);
  }

  /**
   * Centra el mapa en la ruta en coche.
   */
  public focusCarRoute(): void {
    this.centerOnRoute(this.carRouteLayer);
  }

  /**
   * Centra el mapa en la ruta en bicicleta.
   */
  public focusBikeRoute(): void {
    this.centerOnRoute(this.bikeRouteLayer);
  }

  /**
   * Añade un marcador para la farmacia en el mapa.
   * @param lat La latitud de la farmacia.
   * @param lng La longitud de la farmacia.
   * @param name El nombre de la farmacia para el popup.
   */
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

  /**
   * Limpia todas las capas de ruta del mapa.
   */
  public clearRouteLayers(): void {
    if (this.map) {
      if (this.walkingRouteLayer) this.map.removeLayer(this.walkingRouteLayer);
      if (this.carRouteLayer) this.map.removeLayer(this.carRouteLayer);
      if (this.bikeRouteLayer) this.map.removeLayer(this.bikeRouteLayer);
      this.walkingRouteLayer = undefined;
      this.carRouteLayer = undefined;
      this.bikeRouteLayer = undefined;
    }
  }
}
