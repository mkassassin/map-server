import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { MapLibraryModule } from '../../projects/map-library/src/lib/map-library.module';

import { AppComponent } from './app.component';
import { WeatherComponent } from './weather/weather.component';

@NgModule({
  declarations: [
    AppComponent,
    WeatherComponent,
  ],
  imports: [
	 BrowserModule,
	 HttpClientModule,
    MapLibraryModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
