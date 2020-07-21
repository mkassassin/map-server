import { AfterViewInit, Component} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as cities from '../assets/commune.json';

@Component({
   selector: 'app-root',
   templateUrl: './app.component.html',
   styleUrls: ['./app.component.css'],
})
export class AppComponent {

   // component values
   public mapLat = 45;
   public mapLng = 5;
   public mapZoom = 6;
   public search = '';
   public marker: any = []; // [{ text: "Lanion", content:"", img: "../assets/partly_cloudy.png", lat: 48.7333, lng: -3.4667 }, { text: "Rennes", img: "../assets/cloudy.png", lat: 48.11, lng: -1.6833 }];
   public weatherData: any = [];

   constructor(public httpClient: HttpClient) {}

   onMapSelect(selected: any) {
      console.log(selected);
   }

   onMapChange(event: any) {
      this.displayCities(event);
   }

   displayCities(event: any) {
      this.httpClient.get('http://localhost:8000/weatherData').subscribe((res) => {
         this.weatherData = res;
         const weatherMarkers = [];
         this.weatherData.map(obj => {
            weatherMarkers.push({
               text: obj.name,
               content:  '<span style="color:blue">' + obj.main.temp_min + '°c</span> - <span style="color:green">' + obj.main.temp_max + '°c</span>',
               img: '../assets/' + (obj.main.temp > 20 ? 'partly_cloudy.png' : 'cloudy.png'),
               lat: obj.coord.lat,
               lng: obj.coord.lon
            });
         });
         this.marker = weatherMarkers;
      });

      // const tab = [];
      // cities['cities'].forEach(element => {
      //    if (element.zoom <= event.zoom && element.latitude < event.view.top && element.latitude > event.view.bottom && element.longitude < event.view.right && element.longitude > event.view.left) {
      //       tab.push({ text: element.city, content: '<span style="color:blue">12°c</span> - <span style="color:green">28°c</span>', img: '../assets/partly_cloudy.png', lat: element.latitude, lng: element.longitude });
      //    }
      // });
      // this.marker = tab;
   }

}
