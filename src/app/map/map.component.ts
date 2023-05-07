import { Component, AfterViewInit, OnInit, signal } from '@angular/core';
import * as L from 'leaflet';
import { Map } from 'leaflet';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { WritableSignal } from '@angular/core';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  private map!: Map;
  center: { lat: number; lng: number } = { lat: 40.73221, lng: -73.91902 };
  zoom: number = 11;
  isLoading: WritableSignal<boolean> = signal<boolean>(false);
  message: WritableSignal<string> = signal<string>('');
  markers: any[] = [];

  form: FormGroup = new FormGroup({
    lat: new FormControl(''),
    lng: new FormControl(''),
  })

  constructor() {
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(debounceTime(500)).subscribe((res) => {
      if(res?.lat && res?.lng) {
        this.setMarker(Number(res?.lat), Number(res?.lng));
      }
    })
    this.initMap();

    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      this.getLocation(result?.state !== 'granted');
      if(result?.state !== 'granted') {
        this.message.set('Please allow location permission or enter it manually');
      }
    })

  }

  private initMap(): void {
    this.map = L.map('map', {
      zoom: 11,
      center: L.latLng([40.745067, -73.972576])
    });

    // https://leaflet-extras.github.io/leaflet-providers/preview/
    const tiles = L.tileLayer('https://api.maptiler.com/maps/basic/256/{z}/{x}/{y}@2x.png?key=LrAFyqwBnT6GtgneBw6X', {
      // maxZoom: 18,
      // minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });

    tiles.addTo(this.map);
  }

  getLocation(silent: boolean = false): void {
    if (navigator.geolocation) {
      if(!silent) this.isLoading.set(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const longitude = position.coords.longitude;
        const latitude = position.coords.latitude;
        this.form.patchValue({
          lat: latitude,
          lng: longitude
        }, {emitEvent: false});
        this.setMarker(Number(latitude), Number(longitude));
        this.isLoading.set(false);
      });
    } else {
      this.isLoading.set(false);
      console.log("No support for geolocation")
    }
  }

  polyline: any;
  setMarker (latitude: number, longitude: number) {

    // clear markers 
     this.markers.forEach(item => {
      this.map.removeLayer(item);
     })

     if(this.polyline){
      this.map.removeLayer(this.polyline);
     }
     this.markers = [];

    this.markers.push(
      L.marker([latitude, longitude], {
        title: 'You', icon: L.icon({
          iconUrl: '/assets/images/person_pin.svg',
          iconSize: [25, 41], // size of the icon
          iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
          popupAnchor: [0, -35] // point from which the popup should open relative to the iconAnchor
        })
      }).addTo(this.map).bindPopup('You are here')
    );

     // Antipode
     this.markers.push(
      L.marker(this.getAntipode(latitude, longitude), {
        title: 'Antipode', icon: L.icon({
          iconUrl: '/assets/images/pin.svg',
          iconSize: [25, 41], // size of the icon
          iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
          popupAnchor: [0, -35] // point from which the popup should open relative to the iconAnchor
        })
      }).addTo(this.map).bindPopup('Your antipode is here')
    )


    this.polyline = L.polyline([[latitude, longitude], this.getAntipode(latitude, longitude)], {color: 'black'}).addTo(this.map);
    this.map.fitBounds(this.polyline.getBounds());

    // this.map.fitBounds([
    //   [latitude, longitude],
    //   this.getAntipode(latitude, longitude)
    // ])

  }

  private getAntipode(lat: number, lng: number): [number, number] {
    /*
     * Returns the antipode (diametrically opposite point) of the given latitude and longitude.
     * Assumes that longitude is expressed in degrees West or degrees East.
     */
    const antipodeLat = -1 * lat;
    const antipodeLng = lng < 0 ? lng + 180 : lng - 180;
    return [antipodeLat, antipodeLng];
  }
}