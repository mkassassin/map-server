import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-weather',
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent implements OnInit {
  WeatherData:any;
  weather =[]
  constructor() { }

  ngOnInit(){
    this.getWeatherData();
  }
  getWeatherData(){
    fetch('https://api.openweathermap.org/data/2.5/group?id=3038334,6454924,2995469,3006787,2981280,3033123,3026467,3030300,2990363,2972315,2992166,2983990,3032213,2997856,2976866,6434156,3032212,3034569,3003361,2984487&units=metric&appid=39f7af91a4b080cd1fdef1f8e81062e7')
    .then(response=>response.json)
    .then(data=>{this.setWeatherData(data);}) 
    fetch('https://api.openweathermap.org/data/2.5/group?id=2979898,2978758,3034911,3034910,3034910,3034910,3034910,3034910,3034910,3027501,2990474,6438069,6617179,2998324,3024635,2988358,2987914,2973783,3024297,6455254&units=metric&appid=39f7af91a4b080cd1fdef1f8e81062e7')
    .then(response=>response.json)
    .then(data=>{this.setWeatherData(data);})
    fetch('https://api.openweathermap.org/data/2.5/group?id=2988507,2982652,2990969,3031582,2986495,2998286,3037656,2970777,3003603,3029241,3037854,3020686,2984114,2971549,6454365,2996944,6448591,6454307&units=metric&appid=39f7af91a4b080cd1fdef1f8e81062e7')
  }
  setWeatherData(data){
    this.WeatherData = data;
    for (let item of (this.WeatherData.list)){
      this.weather.push(item.main.temp);
    }
      
  }
    

}
