import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import * as cities from '../assets/commune.json';

import { HttpClient } from '@angular/common/http';

declare var EXIF: any;

@Component({
  selector: 'app-root',

  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  title = 'map-application';

  // component values
  public mapLat = 45;
  public mapLng = 5;
  public mapZoom = 6;
  public search = '';
  public marker: any = [];
  public focused = true;

  private imageTab: any = [];
  public weatherData: any = [];
  private infobox;

  constructor(private elem: ElementRef, public httpClient: HttpClient) { }

  ngAfterViewInit(): void {

    this.infobox = this.elem.nativeElement.querySelector('#infobox');

    setTimeout(() => {
      // get gps metadata and display infos of paris
      for (let i = 1; i < 7; i++) {
        this.getExif('../assets/' + i + '.jpg');
      }
    }, 200);
    /*setTimeout(()=>{
      this.displayInfos({text: "Paris", content: "<span style='color:blue'>12°c</span> - <span style='color:green'>28°c</span>", img: "../assets/partly_cloudy.png", lat: 48.86, lng: 2.34445});
    },2200)*/
  }

  /******************************* map component's events *******************/
  onMapSelect(selected) {
    console.log(selected);
    this.displayInfos(selected);
  }

  onMapChange(event) {
    // console.log(event);
    this.displayCities(event);

  }

  /******************************* display images and infos *******************/
  displayInfos(element) {
    this.focused = false;
    this.infobox.style.display = 'block';
    const weatherData = element.weatherData;
    const windDir = -135 + weatherData.wind.deg;
    let images = '';
    this.imageTab.forEach(el => {
      if (element.lat > el.lat - 0.5 && element.lat < el.lat + 0.5 && element.lng > el.lng - 0.5 && element.lng < el.lng + 0.5) {
        images += `
        <div class="imgContainer">
          <div>
            <img src="${el.img}">
          </div>
        </div>
        `;
      }
    });

    this.infobox.innerHTML = `
    <div class="col wheather">
      <h2>${element.text}</h2>
      <div class="wheatherInfo">
        <img src="${element.img}"/>
        <div class="content">${weatherData.main.temp}°c</div>
      </div>
      <div class="wheatherDetailes">
        <h3> ${weatherData.weather[0].description} </h3>
        <div class="dataList">
            <p class="dataLable">Min Temparature </p>
            <p class="dataValue">${weatherData.main.temp_min}°c</p>
        </div>
        <div class="dataList">
            <p class="dataLable">Max Temparature </p>
            <p class="dataValue">${weatherData.main.temp_max}°c</p>
        </div>
        <div class="dataList">
            <p class="dataLable">Feels like</p>
            <p class="dataValue">${weatherData.main.feels_like}°c</p>
        </div>
        <div class="dataList">
            <p class="dataLable">Humidity</p>
            <p class="dataValue">${weatherData.main.humidity} %</p>
        </div><div class="dataList">
            <p class="dataLable">Wind Speed</p>
            <p class="dataValue">${weatherData.wind.speed}m/s</p>
        </div><div class="dataList">
            <p class="dataLable">Wind Direction</p>
            <p class="dataValue">${weatherData.wind.deg}°  <img class="windDir" style="transform: rotate(${windDir}deg);" src="../assets/direction-icon.png"/> </p>
        </div>
      </div>
    </div>
    <div class="col thumb">${images}</div>
    `;
  }
  hideInfos() {
    this.infobox.style.display = 'none';
    setTimeout(() => { this.focused = true; }, 10);
  }

  /******************************* keyboard event *******************/
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (!this.focused) {
      this.handlingNavigation(event.key);
    }
  }

  private handlingNavigation(key): void {
    console.log(key);
    switch (key) {
      case 'ArrowUp':
        break;
      case 'ArrowDown':
        break;
      case 'ArrowRight':
        break;
      case 'ArrowLeft':
        break;
      case 'Enter':
        break;
      case 'Escape':
        this.hideInfos();
        break;
    }
  }

  /******************************* display cities weather *******************/
  displayCities(event) {

  //  let tab=[]
  //  cities['cities'].forEach(element => {
  //    if(element.zoom <= event.zoom && element.latitude < event.view.top && element.latitude > event.view.bottom && element.longitude < event.view.right && element.longitude > event.view.left){
  //      tab.push({ text: element.city, content:"<span style='color:blue'>12°c</span> - <span style='color:green'>28°c</span>", img: "../assets/partly_cloudy.png", lat: element.latitude, lng: element.longitude })
  //    }
  //  });
  //  this.marker = tab;

  this.httpClient.get('https://oblics.ddns.net:8046/weatherData').subscribe((res) => { // https://oblics.ddns.net:8046/weatherData
    this.weatherData = res;
    const weatherMarkers = [];
    this.weatherData.map(obj => {
      obj.zoom = 6;
      if (obj.zoom <= event.zoom && obj.coord.lat < event.view.top && obj.coord.lat > event.view.bottom && obj.coord.lon < event.view.right && obj.coord.lon > event.view.left) {
        weatherMarkers.push({
          text: obj.name,
          content:  '<span style="color:green">' + obj.main.temp + '°c</span>',
          weatherData:  obj,
          img: '../assets/' + (obj.main.temp > 25 ? 'partly_cloudy.png' : 'cloudy.png'),
          lat: obj.coord.lat,
          lng: obj.coord.lon,
        });
      }
    });
    this.marker = weatherMarkers;
  });
  }

  /******************************* get image gps data *******************/
  getExif(imgUrl) {
    const self = this;
    this.getImageFromImageUrl(imgUrl, (image) => {
      EXIF.getData(image, function() {
        const imgLat = EXIF.getTag(this, 'GPSLatitude');
        const imgLng = EXIF.getTag(this, 'GPSLongitude');
        // convert from deg/min/sec to decimal for Google
        const strLatRef = EXIF.getTag(this, 'GPSLatitudeRef') || 'N';
        const strLongRef = EXIF.getTag(this, 'GPSLongitudeRef') || 'W';
        const fLat = (imgLat[0] + imgLat[1] / 60 + imgLat[2] / 3600) * (strLatRef === 'N' ? 1 : -1);
        const fLng = (imgLng[0] + imgLng[1] / 60 + imgLng[2] / 3600) * (strLongRef === 'W' ? -1 : 1);
        // add image to markers
        // self.addMarker({ img: imgUrl, lat: fLat, lng: fLng });
        self.imageTab.push({ img: imgUrl, lat: fLat, lng: fLng });
        console.log(self.imageTab);
      });
    });
  }

  // display image directly
  addMarker(element) {
    const tab = [];
    this.marker.forEach(el => { tab.push(el); });
    tab.push(element);
    this.marker = tab;
  }

  getImageFromImageUrl(url, callback) {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
        callback(img);
    };
    img.src = url;
  }

  toDataURL(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const fr = new FileReader();
      fr.onload = function() {
        callback(this.result);
      };
      fr.readAsDataURL(xhr.response); // async call
    };
    xhr.send();
  }

}
