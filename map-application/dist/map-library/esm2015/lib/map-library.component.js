import { Component, HostListener, Output, EventEmitter } from "@angular/core";
import * as L from "leaflet";
import "leaflet-control-geocoder";
import * as i0 from "@angular/core";
export var CONST;
(function (CONST) {
    CONST[CONST["ZOOM_MAX"] = 18] = "ZOOM_MAX";
    CONST[CONST["ZOOM_MIN"] = 2] = "ZOOM_MIN";
    CONST[CONST["LAT_MAX"] = 85] = "LAT_MAX";
})(CONST || (CONST = {}));
export class MapLibraryComponent {
    constructor(elem) {
        this.elem = elem;
        // input values
        this.mapLat = 45;
        this.mapLng = 5;
        this.mapZoom = 5;
        this.onchange = new EventEmitter();
        this.onselect = new EventEmitter();
        this.searchInputFocused = false;
        this.moveMode = true;
        this.handleIcon = "move";
        this.handleMenuIcon = "zoom";
        this.displayMenu = "";
        this.choiseMenu = 1;
        this.navigate = false;
        this.navigateId = 0;
        // display markers
        this.mapMarkers = [];
    }
    ngAfterViewInit() {
        // init map
        this.initMap();
        this.initInput();
        this.setMoveShift();
        // init display input request
        this.setSearch(this.search);
        this.setMarker(this.marker);
        // send init event
        setTimeout(() => {
            this.sendModifications("");
        }, 2000);
    }
    initMap() {
        // init map
        this.map = L.map("map", {
            attributionControl: false,
            zoomControl: false,
            center: [this.mapLat, this.mapLng],
            zoom: this.mapZoom,
        });
        // display map
        L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png").addTo(this.map);
        // disable keyboard
        this.map.keyboard.disable();
        // add search box
        this.geocoder = L.Control.geocoder({
            position: "topleft",
            collapsed: false,
            placeholder: "Recherche...",
            defaultMarkGeocode: true,
        }).addTo(this.map);
    }
    setSearch(search) {
        if (this.search) {
            // load searching
            this.geocoder.setQuery(search)._geocode();
            // search the first element
            setTimeout(() => {
                if (this.geocoder._results && this.geocoder._results.length) {
                    this.geocoder._geocodeResultSelected(this.geocoder._results[0]);
                    this.geocoder._clearResults();
                }
            }, 2000);
        }
    }
    setMarker(marker) {
        this.cleanMarkers();
        let i = 0;
        marker.forEach(element => {
            if ("lat" in element && "lng" in element) {
                element.id = i;
                if (!element.text) {
                    this.mapMarkers[i] = L.marker([element.lat, element.lng]);
                }
                else {
                    this.mapMarkers[i] = this.generateIconMarker(element);
                }
                this.mapMarkers[i].addTo(this.map);
                i++;
            }
        });
    }
    // remove all markers to display news
    cleanMarkers() {
        for (let i = 0; i < this.mapMarkers.length; i++) {
            this.map.removeLayer(this.mapMarkers[i]);
        }
    }
    // generate Marker
    generateIconMarker(element) {
        // set html form
        let html = `<div id="marker_${element.id}" style="background: white; border-radius:20px; position:absolute; padding:5px 10px 0 10px; text-align:center;">
              <div style="text-align:center; font-size:1.2em;">${element.text}</div>
              ` + (element.content ? `<span>${element.content}</span>` : ``) +
            (element.img ? `<img style="width:60px" src="${element.img}"/>` : ``) + `
            </div>`;
        // return leaflet marker
        return new L.Marker([element.lat, element.lng], {
            icon: new L.DivIcon({
                className: '',
                iconSize: [100, 70],
                iconAnchor: [45, element.img ? 40 : 10],
                html,
            })
        });
    }
    /*************** components attributes events *************/
    ngOnChanges(changes) {
        if (this.map) {
            switch (Object.keys(changes)[0]) {
                case "mapZoom":
                case "mapLat":
                case "mapLng":
                    this.map.setView([this.mapLat, this.mapLng], this.mapZoom);
                    this.setMoveShift();
                    break;
                case "marker":
                    this.setMarker(this.marker);
                    break;
                case "search":
                    this.setSearch(this.search);
                    break;
            }
        }
    }
    /*************** keyboard event detect and functions *************/
    keyEvent(event) {
        if (this.displayMenu != "") {
            this.handlingMenu(event.key);
        }
        else if (this.navigate) {
            this.handlingNavigation(event.key);
        }
        else {
            this.handlingMap(event.key);
            // send change to parent application
            this.sendModifications(event.key);
        }
    }
    handlingNavigation(key) {
        switch (key) {
            case "ArrowUp":
                this.navigateMarker(1, 0);
                break;
            case "ArrowDown":
                this.navigateMarker(-1, 0);
                break;
            case "ArrowRight":
                this.navigateMarker(0, 1);
                break;
            case "ArrowLeft":
                this.navigateMarker(0, -1);
                break;
            case "Enter":
                // send change to parent application
                if (this.marker[this.navigateId])
                    this.sendSelectEvent(this.marker[this.navigateId]);
                break;
            case "Escape":
                this.openMenu();
                break;
        }
    }
    handlingMenu(key) {
        switch (key) {
            case "ArrowRight":
                this.choiseMenu++;
                if (this.choiseMenu > 3) {
                    this.choiseMenu = 0;
                }
                break;
            case "ArrowLeft":
                this.choiseMenu--;
                if (this.choiseMenu < 0) {
                    this.choiseMenu = 3;
                }
                break;
            case "Enter":
                // reset navigation mode
                this.navigate = false;
                if (this.choiseMenu == 0) {
                    this.setFocus();
                }
                else {
                    this.setFocusOut();
                }
                if (this.choiseMenu == 1) {
                    this.setMarker(this.marker);
                    this.changeMode();
                }
                else if (this.choiseMenu == 2) {
                    this.setNavigationMode();
                }
                else if (this.choiseMenu == 3) {
                    alert("exit");
                }
                this.closeMenu();
                break;
            case "Escape":
                this.closeMenu();
                break;
        }
    }
    handlingMap(key) {
        switch (key) {
            case "ArrowUp":
                if (this.moveMode) {
                    if (this.map.getCenter().lat < CONST.LAT_MAX) {
                        this.moveMap(1, 0);
                    }
                }
                else {
                    if (this.mapZoom < CONST.ZOOM_MAX) {
                        this.zoomMap(1);
                        this.moveShift /= 2;
                    }
                }
                break;
            case "ArrowDown":
                if (this.moveMode) {
                    if (this.map.getCenter().lat > -CONST.LAT_MAX) {
                        this.moveMap(-1, 0);
                    }
                }
                else {
                    if (this.mapZoom > CONST.ZOOM_MIN) {
                        this.zoomMap(-1);
                        this.moveShift *= 2;
                    }
                }
                break;
            case "ArrowRight":
                if (this.moveMode) {
                    this.moveMap(0, 1);
                }
                else {
                }
                break;
            case "ArrowLeft":
                if (this.moveMode) {
                    this.moveMap(0, -1);
                }
                else {
                }
                break;
            case "Enter":
                this.changeMode();
                break;
            case "Escape":
                this.openMenu();
                break;
        }
    }
    // display move or zoom icon when press
    changeMode() {
        this.moveMode = !this.moveMode;
        if (this.moveMode) {
            this.handleIcon = "move";
            this.handleMenuIcon = "zoom";
        }
        else {
            this.handleIcon = "zoom";
            this.handleMenuIcon = "move";
        }
    }
    sendModifications(key) {
        // calcul map outline by container size and pixel progection
        let mapSize = this.map.getSize();
        let centerPixel = this.map.project([this.mapLat, this.mapLng], this.mapZoom);
        let topLeft = this.map.unproject([centerPixel.x - mapSize.x / 2, centerPixel.y - mapSize.y / 2], this.mapZoom);
        let bottomRight = this.map.unproject([centerPixel.x + mapSize.x / 2, centerPixel.y + mapSize.y / 2], this.mapZoom);
        // send coordinates results
        this.onchange.emit({
            key: key,
            zoom: this.mapZoom,
            lat: this.mapLat,
            lng: this.mapLng,
            view: {
                top: topLeft.lat,
                left: topLeft.lng,
                bottom: bottomRight.lat,
                right: bottomRight.lng
            }
        });
    }
    sendSelectEvent(selected) {
        this.onselect.emit(selected);
    }
    /*************** escape app functions *************/
    openMenu() {
        this.displayMenu = "show-menu";
    }
    closeMenu() {
        this.displayMenu = "";
        this.choiseMenu = 1;
    }
    // show escape message
    selectMenu(key) {
        if (key == "Escape") {
            this.closeMenu();
        }
        else {
            //this.validEscape = false;
        }
    }
    /*************** navigate between markers *************/
    setNavigationMode() {
        this.navigate = true;
        this.handleIcon = "navigation";
        this.navigateMarker(0, 0);
        // define menu to move
        this.moveMode = false;
        this.handleMenuIcon = "move";
    }
    navigateMarker(lat, lng) {
        if (!this.marker.length) {
            return;
        }
        if (this.marker.length == 1) {
            this.navigateId = 0;
            this.elem.nativeElement.querySelector("#marker_" + this.navigateId).style.background = "orange";
            return;
        }
        if (this.navigateId > this.marker.length) {
            this.navigateId = 0;
        }
        if (lat != 0 || lng != 0) {
            // reset previous
            this.elem.nativeElement.querySelector("#marker_" + this.marker[this.navigateId].id).style.background = "white";
        }
        // display new
        if (lng > 0) {
            this.findFirstRightElement();
        }
        else if (lng < 0) {
            this.findFirstLeftElement();
        }
        else if (lat > 0) {
            this.findFirstTopElement();
        }
        else if (lat < 0) {
            this.findFirstBottomElement();
        }
        else {
            this.navigateId = 0;
        }
        this.elem.nativeElement.querySelector("#marker_" + this.navigateId).style.background = "orange";
    }
    findFirstLeftElement() {
        let selected = this.marker[this.navigateId];
        let newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(element => {
            if (element != selected && element.lng < selected.lng && (element.lng > newSelect.lng || newSelect.lng > selected.lng)) {
                newSelect = element;
            }
        });
        if (newSelect.lng >= selected.lng) {
            let min = this.marker[0];
            this.marker.forEach(element => {
                if (element.lng > min.lng) {
                    min = element;
                }
            });
            this.navigateId = min.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    }
    findFirstRightElement() {
        let selected = this.marker[this.navigateId];
        let newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(element => {
            if (element != selected && element.lng > selected.lng && (element.lng < newSelect.lng || newSelect.lng < selected.lng)) {
                newSelect = element;
            }
        });
        if (newSelect.lng <= selected.lng) {
            let min = this.marker[0];
            this.marker.forEach(element => {
                if (element.lng < min.lng) {
                    min = element;
                }
            });
            this.navigateId = min.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    }
    findFirstBottomElement() {
        let selected = this.marker[this.navigateId];
        let newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(element => {
            if (element != selected && element.lat < selected.lat && (element.lat > newSelect.lat || newSelect.lat > selected.lat)) {
                newSelect = element;
            }
        });
        if (newSelect.lat >= selected.lat) {
            let min = this.marker[0];
            this.marker.forEach(element => {
                if (element.lat > min.lat) {
                    min = element;
                }
            });
            this.navigateId = min.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    }
    findFirstTopElement() {
        let selected = this.marker[this.navigateId];
        let newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(element => {
            if (element != selected && element.lat > selected.lat && (element.lat < newSelect.lat || newSelect.lat < selected.lat)) {
                newSelect = element;
            }
        });
        if (newSelect.lat <= selected.lat) {
            let min = this.marker[0];
            this.marker.forEach(element => {
                if (element.lat < min.lat) {
                    min = element;
                }
            });
            this.navigateId = min.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    }
    /*************** set position, move and zoom functions *************/
    // set new coordinates and handle zoom 
    setPosition() {
        let coord = this.map.getCenter();
        this.mapLat = coord.lat;
        this.mapLng = coord.lng;
        this.mapZoom = this.map.getZoom();
        // calcul new move size
        this.setMoveShift();
    }
    // calcul new coordinates
    moveMap(lat, lng) {
        this.mapLat += lat * this.moveShift;
        this.mapLng += lng * this.moveShift;
        this.map.setView([this.mapLat, this.mapLng], this.mapZoom);
    }
    // update zoom
    zoomMap(zoom) {
        this.mapZoom += zoom;
        this.map.setZoom(this.mapZoom);
    }
    // alter move padding
    setMoveShift() {
        this.moveShift = 80;
        for (let i = 1; i < this.mapZoom; i++) {
            this.moveShift /= 2;
        }
    }
    /*************** search input functions *************/
    // set input focus or blur
    initInput() {
        // select search input box
        this.searchInput = this.elem.nativeElement.querySelector(".leaflet-control-geocoder-form input");
        this.searchBar = this.elem.nativeElement.querySelector(".leaflet-bar");
        this.setFocusOut();
    }
    setFocus() {
        this.searchBar.style.display = "block";
        this.searchInput.focus();
        this.searchInputFocused = true;
    }
    setFocusOut() {
        this.searchInput.blur();
        this.searchBar.style.display = "none";
        this.searchInputFocused = false;
        this.setPosition();
    }
}
MapLibraryComponent.ɵfac = function MapLibraryComponent_Factory(t) { return new (t || MapLibraryComponent)(i0.ɵɵdirectiveInject(i0.ElementRef)); };
MapLibraryComponent.ɵcmp = i0.ɵɵdefineComponent({ type: MapLibraryComponent, selectors: [["map-library"]], hostBindings: function MapLibraryComponent_HostBindings(rf, ctx) { if (rf & 1) {
        i0.ɵɵlistener("keyup", function MapLibraryComponent_keyup_HostBindingHandler($event) { return ctx.keyEvent($event); }, false, i0.ɵɵresolveWindow);
    } }, inputs: { mapLat: "mapLat", mapLng: "mapLng", mapZoom: "mapZoom", search: "search", marker: "marker" }, outputs: { onchange: "onchange", onselect: "onselect" }, features: [i0.ɵɵNgOnChangesFeature], decls: 9, vars: 19, consts: [[1, "map-container"], ["id", "map"], [1, "menu-container"], [1, "menu-box"]], template: function MapLibraryComponent_Template(rf, ctx) { if (rf & 1) {
        i0.ɵɵelementStart(0, "div", 0);
        i0.ɵɵelement(1, "i");
        i0.ɵɵelement(2, "div", 1);
        i0.ɵɵelementEnd();
        i0.ɵɵelementStart(3, "div", 2);
        i0.ɵɵelementStart(4, "div", 3);
        i0.ɵɵelement(5, "i");
        i0.ɵɵelement(6, "i");
        i0.ɵɵelement(7, "i");
        i0.ɵɵelement(8, "i");
        i0.ɵɵelementEnd();
        i0.ɵɵelementEnd();
    } if (rf & 2) {
        i0.ɵɵadvance(1);
        i0.ɵɵclassMapInterpolate1("icon ", ctx.handleIcon, "");
        i0.ɵɵadvance(2);
        i0.ɵɵclassMap(ctx.displayMenu);
        i0.ɵɵadvance(2);
        i0.ɵɵclassMapInterpolate1("icon search ", ctx.choiseMenu == 0 ? "selected" : "", "");
        i0.ɵɵadvance(1);
        i0.ɵɵclassMapInterpolate2("icon ", ctx.handleMenuIcon, " ", ctx.choiseMenu == 1 ? "selected" : "", "");
        i0.ɵɵadvance(1);
        i0.ɵɵclassMapInterpolate1("icon navigation ", ctx.choiseMenu == 2 ? "selected" : "", "");
        i0.ɵɵadvance(1);
        i0.ɵɵclassMapInterpolate1("icon logout ", ctx.choiseMenu == 3 ? "selected" : "", "");
    } }, styles: [".map-container[_ngcontent-%COMP%]{position:absolute;z-index:1;top:0;left:0;right:0;bottom:0}#map[_ngcontent-%COMP%]{width:100%;height:100%}.map-container[_ngcontent-%COMP%]   .icon[_ngcontent-%COMP%]{position:absolute;z-index:1000;top:10px;right:10px;width:50px;height:50px}.menu-container[_ngcontent-%COMP%]{position:absolute;z-index:1001;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.3);display:none}.menu-box[_ngcontent-%COMP%]{position:absolute;top:calc(50% - 100px);left:calc(50% - 300px);width:600px;height:150px;background-color:#fff;border:1px solid orange!important;text-align:center;margin-top:50px}.menu-box[_ngcontent-%COMP%]   .icon[_ngcontent-%COMP%]{display:inline-block;width:150px;height:150px;border:0;border-radius:3px;background-size:100px 100px;background-repeat:no-repeat;background-position:center}.menu-box[_ngcontent-%COMP%]   .selected[_ngcontent-%COMP%]{background-color:orange}.show-menu[_ngcontent-%COMP%]{display:block}"] });
/*@__PURE__*/ (function () { i0.ɵsetClassMetadata(MapLibraryComponent, [{
        type: Component,
        args: [{
                selector: "map-library",
                inputs: ['mapLat', 'mapLng', 'mapZoom', 'search', 'marker'],
                templateUrl: "./map-library.component.html",
                styleUrls: ["./map-library.component.css",],
            }]
    }], function () { return [{ type: i0.ElementRef }]; }, { onchange: [{
            type: Output
        }], onselect: [{
            type: Output
        }], keyEvent: [{
            type: HostListener,
            args: ["window:keyup", ["$event"]]
        }] }); })();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLWxpYnJhcnkuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbWFwLWxpYnJhcnkvIiwic291cmNlcyI6WyJsaWIvbWFwLWxpYnJhcnkuY29tcG9uZW50LnRzIiwibGliL21hcC1saWJyYXJ5LmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFFTCxTQUFTLEVBQ1QsWUFBWSxFQUVaLE1BQU0sRUFDTixZQUFZLEVBRWIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxLQUFLLENBQUMsTUFBTSxTQUFTLENBQUM7QUFDN0IsT0FBTywwQkFBMEIsQ0FBQzs7QUFFbEMsTUFBTSxDQUFOLElBQVksS0FJWDtBQUpELFdBQVksS0FBSztJQUNmLDBDQUFhLENBQUE7SUFDYix5Q0FBWSxDQUFBO0lBQ1osd0NBQVksQ0FBQTtBQUNkLENBQUMsRUFKVyxLQUFLLEtBQUwsS0FBSyxRQUloQjtBQVNELE1BQU0sT0FBTyxtQkFBbUI7SUEwQjlCLFlBQW9CLElBQWdCO1FBQWhCLFNBQUksR0FBSixJQUFJLENBQVk7UUF4QnBDLGVBQWU7UUFDUixXQUFNLEdBQVcsRUFBRSxDQUFDO1FBQ3BCLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFDbkIsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUlqQixhQUFRLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQUNuQyxhQUFRLEdBQUcsSUFBSSxZQUFZLEVBQU8sQ0FBQztRQU1yQyx1QkFBa0IsR0FBRyxLQUFLLENBQUM7UUFDM0IsYUFBUSxHQUFHLElBQUksQ0FBQztRQUVqQixlQUFVLEdBQUcsTUFBTSxDQUFDO1FBQ3BCLG1CQUFjLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLGVBQVUsR0FBRyxDQUFDLENBQUM7UUFDZCxhQUFRLEdBQUcsS0FBSyxDQUFDO1FBQ2pCLGVBQVUsR0FBRyxDQUFDLENBQUM7UUFzRHZCLGtCQUFrQjtRQUNWLGVBQVUsR0FB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LG9GQUFxRDtRQUNyRCxlQUFpRTtRQUFqRSxzR0FBaUU7UUFDakUsZUFBeUQ7UUFBekQsd0ZBQXlEO1FBQ3pELGVBQXFEO1FBQXJELG9GQUFxRDs7a0REZ0JuRCxtQkFBbUI7Y0FQL0IsU0FBUztlQUFDO2dCQUNULFFBQVEsRUFBRSxhQUFhO2dCQUN2QixNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDO2dCQUMzRCxXQUFXLEVBQUUsOEJBQThCO2dCQUMzQyxTQUFTLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRTthQUM1Qzs7a0JBV0UsTUFBTTs7a0JBQ04sTUFBTTs7a0JBNklOLFlBQVk7bUJBQUMsY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgQ29tcG9uZW50LFxuICBIb3N0TGlzdGVuZXIsXG4gIEVsZW1lbnRSZWYsXG4gIE91dHB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBTaW1wbGVDaGFuZ2VzXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgKiBhcyBMIGZyb20gXCJsZWFmbGV0XCI7XG5pbXBvcnQgXCJsZWFmbGV0LWNvbnRyb2wtZ2VvY29kZXJcIjtcblxuZXhwb3J0IGVudW0gQ09OU1Qge1xuICBaT09NX01BWCA9IDE4LFxuICBaT09NX01JTiA9IDIsXG4gIExBVF9NQVggPSA4NSxcbn1cblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcIm1hcC1saWJyYXJ5XCIsXG4gIGlucHV0czogWydtYXBMYXQnLCAnbWFwTG5nJywgJ21hcFpvb20nLCAnc2VhcmNoJywgJ21hcmtlciddLFxuICB0ZW1wbGF0ZVVybDogXCIuL21hcC1saWJyYXJ5LmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9tYXAtbGlicmFyeS5jb21wb25lbnQuY3NzXCIsXSxcbn0pXG5cbmV4cG9ydCBjbGFzcyBNYXBMaWJyYXJ5Q29tcG9uZW50IGltcGxlbWVudHMgQWZ0ZXJWaWV3SW5pdCB7XG5cbiAgLy8gaW5wdXQgdmFsdWVzXG4gIHB1YmxpYyBtYXBMYXQ6IG51bWJlciA9IDQ1O1xuICBwdWJsaWMgbWFwTG5nOiBudW1iZXIgPSA1O1xuICBwdWJsaWMgbWFwWm9vbTogbnVtYmVyID0gNTtcbiAgcHVibGljIHNlYXJjaDogU3RyaW5nO1xuICBwdWJsaWMgbWFya2VyOiBhbnk7XG5cbiAgQE91dHB1dCgpIG9uY2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gIEBPdXRwdXQoKSBvbnNlbGVjdCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55PigpO1xuXG4gIHByaXZhdGUgbWFwO1xuICBwcml2YXRlIGdlb2NvZGVyO1xuICBwcml2YXRlIHNlYXJjaElucHV0O1xuICBwcml2YXRlIHNlYXJjaEJhcjtcbiAgcHJpdmF0ZSBzZWFyY2hJbnB1dEZvY3VzZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBtb3ZlTW9kZSA9IHRydWU7XG4gIHByaXZhdGUgbW92ZVNoaWZ0O1xuICBwdWJsaWMgaGFuZGxlSWNvbiA9IFwibW92ZVwiO1xuICBwdWJsaWMgaGFuZGxlTWVudUljb24gPSBcInpvb21cIjtcbiAgcHVibGljIGRpc3BsYXlNZW51ID0gXCJcIjtcbiAgcHVibGljIGNob2lzZU1lbnUgPSAxO1xuICBwcml2YXRlIG5hdmlnYXRlID0gZmFsc2U7XG4gIHByaXZhdGUgbmF2aWdhdGVJZCA9IDA7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBlbGVtOiBFbGVtZW50UmVmKSB7IH1cblxuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgLy8gaW5pdCBtYXBcbiAgICB0aGlzLmluaXRNYXAoKTtcbiAgICB0aGlzLmluaXRJbnB1dCgpO1xuICAgIHRoaXMuc2V0TW92ZVNoaWZ0KCk7XG5cbiAgICAvLyBpbml0IGRpc3BsYXkgaW5wdXQgcmVxdWVzdFxuICAgIHRoaXMuc2V0U2VhcmNoKHRoaXMuc2VhcmNoKTtcbiAgICB0aGlzLnNldE1hcmtlcih0aGlzLm1hcmtlcik7XG4gICAgLy8gc2VuZCBpbml0IGV2ZW50XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLnNlbmRNb2RpZmljYXRpb25zKFwiXCIpO1xuICAgIH0sIDIwMDApXG4gIH1cblxuICBwcml2YXRlIGluaXRNYXAoKTogdm9pZCB7XG4gICAgLy8gaW5pdCBtYXBcbiAgICB0aGlzLm1hcCA9IEwubWFwKFwibWFwXCIsIHtcbiAgICAgIGF0dHJpYnV0aW9uQ29udHJvbDogZmFsc2UsXG4gICAgICB6b29tQ29udHJvbDogZmFsc2UsXG4gICAgICBjZW50ZXI6IFt0aGlzLm1hcExhdCwgdGhpcy5tYXBMbmddLFxuICAgICAgem9vbTogdGhpcy5tYXBab29tLFxuICAgIH0pO1xuICAgIC8vIGRpc3BsYXkgbWFwXG4gICAgTC50aWxlTGF5ZXIoXCJodHRwczovL3tzfS50aWxlLm9zbS5vcmcve3p9L3t4fS97eX0ucG5nXCIpLmFkZFRvKHRoaXMubWFwKTtcbiAgICAvLyBkaXNhYmxlIGtleWJvYXJkXG4gICAgdGhpcy5tYXAua2V5Ym9hcmQuZGlzYWJsZSgpO1xuICAgIC8vIGFkZCBzZWFyY2ggYm94XG4gICAgdGhpcy5nZW9jb2RlciA9IEwuQ29udHJvbC5nZW9jb2Rlcih7XG4gICAgICBwb3NpdGlvbjogXCJ0b3BsZWZ0XCIsXG4gICAgICBjb2xsYXBzZWQ6IGZhbHNlLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiUmVjaGVyY2hlLi4uXCIsXG4gICAgICBkZWZhdWx0TWFya0dlb2NvZGU6IHRydWUsXG4gICAgfSkuYWRkVG8odGhpcy5tYXApO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRTZWFyY2goc2VhcmNoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2VhcmNoKSB7XG4gICAgICAvLyBsb2FkIHNlYXJjaGluZ1xuICAgICAgdGhpcy5nZW9jb2Rlci5zZXRRdWVyeShzZWFyY2gpLl9nZW9jb2RlKClcbiAgICAgIC8vIHNlYXJjaCB0aGUgZmlyc3QgZWxlbWVudFxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmdlb2NvZGVyLl9yZXN1bHRzICYmIHRoaXMuZ2VvY29kZXIuX3Jlc3VsdHMubGVuZ3RoKSB7XG4gICAgICAgICAgdGhpcy5nZW9jb2Rlci5fZ2VvY29kZVJlc3VsdFNlbGVjdGVkKHRoaXMuZ2VvY29kZXIuX3Jlc3VsdHNbMF0pXG4gICAgICAgICAgdGhpcy5nZW9jb2Rlci5fY2xlYXJSZXN1bHRzKCk7XG4gICAgICAgIH1cbiAgICAgIH0sIDIwMDApO1xuICAgIH1cbiAgfVxuXG4gIC8vIGRpc3BsYXkgbWFya2Vyc1xuICBwcml2YXRlIG1hcE1hcmtlcnMgPSBbXTtcbiAgcHJpdmF0ZSBzZXRNYXJrZXIobWFya2VyKTogdm9pZCB7XG5cbiAgICB0aGlzLmNsZWFuTWFya2VycygpO1xuICAgIGxldCBpID0gMDtcbiAgICBtYXJrZXIuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGlmIChcImxhdFwiIGluIGVsZW1lbnQgJiYgXCJsbmdcIiBpbiBlbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQuaWQ9aTtcbiAgICAgICAgaWYgKCFlbGVtZW50LnRleHQpIHtcbiAgICAgICAgICB0aGlzLm1hcE1hcmtlcnNbaV0gPSBMLm1hcmtlcihbZWxlbWVudC5sYXQsIGVsZW1lbnQubG5nXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLm1hcE1hcmtlcnNbaV0gPSB0aGlzLmdlbmVyYXRlSWNvbk1hcmtlcihlbGVtZW50KVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubWFwTWFya2Vyc1tpXS5hZGRUbyh0aGlzLm1hcCk7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHJlbW92ZSBhbGwgbWFya2VycyB0byBkaXNwbGF5IG5ld3NcbiAgcHJpdmF0ZSBjbGVhbk1hcmtlcnMoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1hcE1hcmtlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMubWFwLnJlbW92ZUxheWVyKHRoaXMubWFwTWFya2Vyc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gZ2VuZXJhdGUgTWFya2VyXG4gIHByaXZhdGUgZ2VuZXJhdGVJY29uTWFya2VyKGVsZW1lbnQpIHtcblxuICAgIC8vIHNldCBodG1sIGZvcm1cbiAgICBsZXQgaHRtbCA9IGA8ZGl2IGlkPVwibWFya2VyXyR7ZWxlbWVudC5pZH1cIiBzdHlsZT1cImJhY2tncm91bmQ6IHdoaXRlOyBib3JkZXItcmFkaXVzOjIwcHg7IHBvc2l0aW9uOmFic29sdXRlOyBwYWRkaW5nOjVweCAxMHB4IDAgMTBweDsgdGV4dC1hbGlnbjpjZW50ZXI7XCI+XG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjsgZm9udC1zaXplOjEuMmVtO1wiPiR7ZWxlbWVudC50ZXh0fTwvZGl2PlxuICAgICAgICAgICAgICBgKyAoZWxlbWVudC5jb250ZW50ID8gYDxzcGFuPiR7ZWxlbWVudC5jb250ZW50fTwvc3Bhbj5gIDogYGApICtcbiAgICAgIChlbGVtZW50LmltZyA/IGA8aW1nIHN0eWxlPVwid2lkdGg6NjBweFwiIHNyYz1cIiR7ZWxlbWVudC5pbWd9XCIvPmAgOiBgYCkgKyBgXG4gICAgICAgICAgICA8L2Rpdj5gXG5cbiAgICAvLyByZXR1cm4gbGVhZmxldCBtYXJrZXJcbiAgICByZXR1cm4gbmV3IEwuTWFya2VyKFtlbGVtZW50LmxhdCwgZWxlbWVudC5sbmddLCB7XG4gICAgICBpY29uOiBuZXcgTC5EaXZJY29uKHtcbiAgICAgICAgY2xhc3NOYW1lOiAnJyxcbiAgICAgICAgaWNvblNpemU6IFsxMDAsIDcwXSwgLy8gc2l6ZSBvZiB0aGUgaWNvblxuICAgICAgICBpY29uQW5jaG9yOiBbNDUsIGVsZW1lbnQuaW1nID8gNDAgOiAxMF0sXG4gICAgICAgIGh0bWwsXG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICAvKioqKioqKioqKioqKioqIGNvbXBvbmVudHMgYXR0cmlidXRlcyBldmVudHMgKioqKioqKioqKioqKi9cblxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgaWYgKHRoaXMubWFwKSB7XG4gICAgICBzd2l0Y2ggKE9iamVjdC5rZXlzKGNoYW5nZXMpWzBdKSB7XG4gICAgICAgIGNhc2UgXCJtYXBab29tXCI6XG4gICAgICAgIGNhc2UgXCJtYXBMYXRcIjpcbiAgICAgICAgY2FzZSBcIm1hcExuZ1wiOlxuICAgICAgICAgIHRoaXMubWFwLnNldFZpZXcoW3RoaXMubWFwTGF0LCB0aGlzLm1hcExuZ10sIHRoaXMubWFwWm9vbSk7XG4gICAgICAgICAgdGhpcy5zZXRNb3ZlU2hpZnQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIm1hcmtlclwiOlxuICAgICAgICAgIHRoaXMuc2V0TWFya2VyKHRoaXMubWFya2VyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInNlYXJjaFwiOlxuICAgICAgICAgIHRoaXMuc2V0U2VhcmNoKHRoaXMuc2VhcmNoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKioqKioqKioqKioqKioqIGtleWJvYXJkIGV2ZW50IGRldGVjdCBhbmQgZnVuY3Rpb25zICoqKioqKioqKioqKiovXG5cblxuXG4gIEBIb3N0TGlzdGVuZXIoXCJ3aW5kb3c6a2V5dXBcIiwgW1wiJGV2ZW50XCJdKVxuICBrZXlFdmVudChldmVudDogS2V5Ym9hcmRFdmVudCkge1xuXG4gICAgaWYgKHRoaXMuZGlzcGxheU1lbnUgIT0gXCJcIikge1xuICAgICAgdGhpcy5oYW5kbGluZ01lbnUoZXZlbnQua2V5KTtcblxuICAgIH0gZWxzZSBpZih0aGlzLm5hdmlnYXRlKXtcbiAgICAgIHRoaXMuaGFuZGxpbmdOYXZpZ2F0aW9uKGV2ZW50LmtleSlcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhhbmRsaW5nTWFwKGV2ZW50LmtleSlcbiAgICAgIC8vIHNlbmQgY2hhbmdlIHRvIHBhcmVudCBhcHBsaWNhdGlvblxuICAgICAgdGhpcy5zZW5kTW9kaWZpY2F0aW9ucyhldmVudC5rZXkpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxpbmdOYXZpZ2F0aW9uKGtleSk6IHZvaWQge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlIFwiQXJyb3dVcFwiOlxuICAgICAgICB0aGlzLm5hdmlnYXRlTWFya2VyKDEsMClcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dEb3duXCI6XG4gICAgICAgIHRoaXMubmF2aWdhdGVNYXJrZXIoLTEsMClcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dSaWdodFwiOlxuICAgICAgICB0aGlzLm5hdmlnYXRlTWFya2VyKDAsMSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dMZWZ0XCI6XG4gICAgICAgIHRoaXMubmF2aWdhdGVNYXJrZXIoMCwtMSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgLy8gc2VuZCBjaGFuZ2UgdG8gcGFyZW50IGFwcGxpY2F0aW9uXG4gICAgICAgIGlmKHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZF0pXG4gICAgICAgICAgdGhpcy5zZW5kU2VsZWN0RXZlbnQodGhpcy5tYXJrZXJbdGhpcy5uYXZpZ2F0ZUlkXSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRXNjYXBlXCI6XG4gICAgICAgIHRoaXMub3Blbk1lbnUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGluZ01lbnUoa2V5KTogdm9pZCB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgXCJBcnJvd1JpZ2h0XCI6XG4gICAgICAgIHRoaXMuY2hvaXNlTWVudSsrO1xuICAgICAgICBpZiAodGhpcy5jaG9pc2VNZW51ID4gMykge1xuICAgICAgICAgIHRoaXMuY2hvaXNlTWVudSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dMZWZ0XCI6XG4gICAgICAgIHRoaXMuY2hvaXNlTWVudS0tO1xuICAgICAgICBpZiAodGhpcy5jaG9pc2VNZW51IDwgMCkge1xuICAgICAgICAgIHRoaXMuY2hvaXNlTWVudSA9IDM7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgLy8gcmVzZXQgbmF2aWdhdGlvbiBtb2RlXG4gICAgICAgIHRoaXMubmF2aWdhdGU9ZmFsc2U7XG5cbiAgICAgICAgaWYgKHRoaXMuY2hvaXNlTWVudSA9PSAwKSB7XG4gICAgICAgICAgdGhpcy5zZXRGb2N1cygpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5zZXRGb2N1c091dCgpO1xuICAgICAgICB9IFxuICAgICAgICBpZiAodGhpcy5jaG9pc2VNZW51ID09IDEpIHtcbiAgICAgICAgICB0aGlzLnNldE1hcmtlcih0aGlzLm1hcmtlcik7XG4gICAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKClcblxuICAgICAgICB9IGVsc2UgaWYodGhpcy5jaG9pc2VNZW51PT0yKXtcbiAgICAgICAgICB0aGlzLnNldE5hdmlnYXRpb25Nb2RlKClcblxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY2hvaXNlTWVudSA9PSAzKSB7XG4gICAgICAgICAgYWxlcnQoXCJleGl0XCIpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJFc2NhcGVcIjpcbiAgICAgICAgdGhpcy5jbG9zZU1lbnUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGluZ01hcChrZXkpOiB2b2lkIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgICAgaWYgKHRoaXMubW92ZU1vZGUpIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXAuZ2V0Q2VudGVyKCkubGF0IDwgQ09OU1QuTEFUX01BWCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlTWFwKDEsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXBab29tIDwgQ09OU1QuWk9PTV9NQVgpIHtcbiAgICAgICAgICAgIHRoaXMuem9vbU1hcCgxKTtcbiAgICAgICAgICAgIHRoaXMubW92ZVNoaWZ0IC89IDI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93RG93blwiOlxuICAgICAgICBpZiAodGhpcy5tb3ZlTW9kZSkge1xuICAgICAgICAgIGlmICh0aGlzLm1hcC5nZXRDZW50ZXIoKS5sYXQgPiAtQ09OU1QuTEFUX01BWCkge1xuICAgICAgICAgICAgdGhpcy5tb3ZlTWFwKC0xLCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMubWFwWm9vbSA+IENPTlNULlpPT01fTUlOKSB7XG4gICAgICAgICAgICB0aGlzLnpvb21NYXAoLTEpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlU2hpZnQgKj0gMjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dSaWdodFwiOlxuICAgICAgICBpZiAodGhpcy5tb3ZlTW9kZSkge1xuICAgICAgICAgIHRoaXMubW92ZU1hcCgwLCAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0xlZnRcIjpcbiAgICAgICAgaWYgKHRoaXMubW92ZU1vZGUpIHtcbiAgICAgICAgICB0aGlzLm1vdmVNYXAoMCwgLTEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkVudGVyXCI6XG4gICAgICAgIHRoaXMuY2hhbmdlTW9kZSgpXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkVzY2FwZVwiOlxuICAgICAgICB0aGlzLm9wZW5NZW51KCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIGRpc3BsYXkgbW92ZSBvciB6b29tIGljb24gd2hlbiBwcmVzc1xuICBwcml2YXRlIGNoYW5nZU1vZGUoKTogdm9pZCB7XG4gICAgdGhpcy5tb3ZlTW9kZSA9ICF0aGlzLm1vdmVNb2RlO1xuICAgIGlmICh0aGlzLm1vdmVNb2RlKSB7XG4gICAgICB0aGlzLmhhbmRsZUljb24gPSBcIm1vdmVcIjtcbiAgICAgIHRoaXMuaGFuZGxlTWVudUljb24gPSBcInpvb21cIlxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhhbmRsZUljb24gPSBcInpvb21cIjtcbiAgICAgIHRoaXMuaGFuZGxlTWVudUljb24gPSBcIm1vdmVcIlxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2VuZE1vZGlmaWNhdGlvbnMoa2V5KSB7XG4gICAgLy8gY2FsY3VsIG1hcCBvdXRsaW5lIGJ5IGNvbnRhaW5lciBzaXplIGFuZCBwaXhlbCBwcm9nZWN0aW9uXG4gICAgbGV0IG1hcFNpemUgPSB0aGlzLm1hcC5nZXRTaXplKCk7XG4gICAgbGV0IGNlbnRlclBpeGVsID0gdGhpcy5tYXAucHJvamVjdChbdGhpcy5tYXBMYXQsIHRoaXMubWFwTG5nXSwgdGhpcy5tYXBab29tKVxuICAgIGxldCB0b3BMZWZ0ID0gdGhpcy5tYXAudW5wcm9qZWN0KFtjZW50ZXJQaXhlbC54IC0gbWFwU2l6ZS54IC8gMiwgY2VudGVyUGl4ZWwueSAtIG1hcFNpemUueSAvIDJdLCB0aGlzLm1hcFpvb20pXG4gICAgbGV0IGJvdHRvbVJpZ2h0ID0gdGhpcy5tYXAudW5wcm9qZWN0KFtjZW50ZXJQaXhlbC54ICsgbWFwU2l6ZS54IC8gMiwgY2VudGVyUGl4ZWwueSArIG1hcFNpemUueSAvIDJdLCB0aGlzLm1hcFpvb20pXG5cbiAgICAvLyBzZW5kIGNvb3JkaW5hdGVzIHJlc3VsdHNcbiAgICB0aGlzLm9uY2hhbmdlLmVtaXQoXG4gICAgICB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICB6b29tOiB0aGlzLm1hcFpvb20sXG4gICAgICAgIGxhdDogdGhpcy5tYXBMYXQsXG4gICAgICAgIGxuZzogdGhpcy5tYXBMbmcsXG4gICAgICAgIHZpZXc6IHtcbiAgICAgICAgICB0b3A6IHRvcExlZnQubGF0LFxuICAgICAgICAgIGxlZnQ6IHRvcExlZnQubG5nLFxuICAgICAgICAgIGJvdHRvbTogYm90dG9tUmlnaHQubGF0LFxuICAgICAgICAgIHJpZ2h0OiBib3R0b21SaWdodC5sbmdcbiAgICAgICAgfSAgICAgICBcbiAgICAgIH0pXG4gIH1cblxuICBwcml2YXRlIHNlbmRTZWxlY3RFdmVudChzZWxlY3RlZCkge1xuICAgIHRoaXMub25zZWxlY3QuZW1pdChzZWxlY3RlZClcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKiogZXNjYXBlIGFwcCBmdW5jdGlvbnMgKioqKioqKioqKioqKi9cblxuICBwcml2YXRlIG9wZW5NZW51KCk6IHZvaWQge1xuICAgIHRoaXMuZGlzcGxheU1lbnUgPSBcInNob3ctbWVudVwiO1xuICB9XG5cbiAgcHJpdmF0ZSBjbG9zZU1lbnUoKTogdm9pZCB7XG4gICAgdGhpcy5kaXNwbGF5TWVudSA9IFwiXCI7XG4gICAgdGhpcy5jaG9pc2VNZW51ID0gMTtcbiAgfVxuICAvLyBzaG93IGVzY2FwZSBtZXNzYWdlXG4gIHByaXZhdGUgc2VsZWN0TWVudShrZXkpOiB2b2lkIHtcbiAgICBpZiAoa2V5ID09IFwiRXNjYXBlXCIpIHtcbiAgICAgIHRoaXMuY2xvc2VNZW51KClcbiAgICB9IGVsc2Uge1xuICAgICAgLy90aGlzLnZhbGlkRXNjYXBlID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKiBuYXZpZ2F0ZSBiZXR3ZWVuIG1hcmtlcnMgKioqKioqKioqKioqKi9cblxuICBwcml2YXRlIHNldE5hdmlnYXRpb25Nb2RlKCk6IHZvaWR7XG4gICAgdGhpcy5uYXZpZ2F0ZT10cnVlO1xuICAgIHRoaXMuaGFuZGxlSWNvbiA9IFwibmF2aWdhdGlvblwiO1xuICAgIHRoaXMubmF2aWdhdGVNYXJrZXIoMCwwKVxuICAgIC8vIGRlZmluZSBtZW51IHRvIG1vdmVcbiAgICB0aGlzLm1vdmVNb2RlID0gZmFsc2VcbiAgICB0aGlzLmhhbmRsZU1lbnVJY29uID0gXCJtb3ZlXCJcbiAgfVxuXG4gIHByaXZhdGUgbmF2aWdhdGVNYXJrZXIobGF0LCBsbmcpOiB2b2lke1xuICAgIGlmKCF0aGlzLm1hcmtlci5sZW5ndGgpe1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZih0aGlzLm1hcmtlci5sZW5ndGg9PTEpe1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkID0gMDtcbiAgICAgIHRoaXMuZWxlbS5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWFya2VyX1wiK3RoaXMubmF2aWdhdGVJZCkuc3R5bGUuYmFja2dyb3VuZD1cIm9yYW5nZVwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZih0aGlzLm5hdmlnYXRlSWQgPiB0aGlzLm1hcmtlci5sZW5ndGgpe1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkID0gMDtcbiAgICB9XG4gICAgaWYobGF0IT0wIHx8IGxuZyAhPSAwKXtcbiAgICAgIC8vIHJlc2V0IHByZXZpb3VzXG4gICAgICB0aGlzLmVsZW0ubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiI21hcmtlcl9cIit0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWRdLmlkKS5zdHlsZS5iYWNrZ3JvdW5kPVwid2hpdGVcIjsgICAgXG4gICAgfVxuICAgIC8vIGRpc3BsYXkgbmV3XG4gICAgaWYobG5nPjApe1xuICAgICAgdGhpcy5maW5kRmlyc3RSaWdodEVsZW1lbnQoKTtcbiAgICB9ZWxzZSBpZihsbmc8MCl7XG4gICAgICB0aGlzLmZpbmRGaXJzdExlZnRFbGVtZW50KCk7XG4gICAgfWVsc2UgaWYobGF0PjApe1xuICAgICAgdGhpcy5maW5kRmlyc3RUb3BFbGVtZW50KCk7XG4gICAgfWVsc2UgaWYobGF0PDApe1xuICAgICAgdGhpcy5maW5kRmlyc3RCb3R0b21FbGVtZW50KCk7XG4gICAgfWVsc2Uge1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkPTBcbiAgICB9XG4gICAgdGhpcy5lbGVtLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcIiNtYXJrZXJfXCIrdGhpcy5uYXZpZ2F0ZUlkKS5zdHlsZS5iYWNrZ3JvdW5kPVwib3JhbmdlXCI7XG4gIH1cblxuICBwcml2YXRlIGZpbmRGaXJzdExlZnRFbGVtZW50KCl7XG4gICAgbGV0IHNlbGVjdGVkID0gdGhpcy5tYXJrZXJbdGhpcy5uYXZpZ2F0ZUlkXTtcbiAgICBsZXQgbmV3U2VsZWN0ID0gdGhpcy5tYXJrZXJbdGhpcy5uYXZpZ2F0ZUlkPT0wPzE6MF07XG4gICAgdGhpcy5tYXJrZXIuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGlmKGVsZW1lbnQhPXNlbGVjdGVkICYmIGVsZW1lbnQubG5nIDwgc2VsZWN0ZWQubG5nICYmIChlbGVtZW50LmxuZyA+IG5ld1NlbGVjdC5sbmcgfHwgbmV3U2VsZWN0LmxuZyA+IHNlbGVjdGVkLmxuZykpe1xuICAgICAgICBuZXdTZWxlY3QgPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmKG5ld1NlbGVjdC5sbmcgPj0gc2VsZWN0ZWQubG5nKXtcbiAgICAgIGxldCBtaW49dGhpcy5tYXJrZXJbMF1cbiAgICAgIHRoaXMubWFya2VyLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmKGVsZW1lbnQubG5nID4gbWluLmxuZyl7XG4gICAgICAgICAgbWluID0gZWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQgPSBtaW4uaWQ7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQ9bmV3U2VsZWN0LmlkXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBmaW5kRmlyc3RSaWdodEVsZW1lbnQoKXtcbiAgICBsZXQgc2VsZWN0ZWQgPSB0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWRdO1xuICAgIGxldCBuZXdTZWxlY3QgPSB0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWQ9PTA/MTowXTtcbiAgICB0aGlzLm1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgaWYoZWxlbWVudCE9c2VsZWN0ZWQgJiYgZWxlbWVudC5sbmcgPiBzZWxlY3RlZC5sbmcgJiYgKGVsZW1lbnQubG5nIDwgbmV3U2VsZWN0LmxuZyB8fCBuZXdTZWxlY3QubG5nIDwgc2VsZWN0ZWQubG5nKSl7XG4gICAgICAgIG5ld1NlbGVjdCA9IGVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYobmV3U2VsZWN0LmxuZyA8PSBzZWxlY3RlZC5sbmcpe1xuICAgICAgbGV0IG1pbj10aGlzLm1hcmtlclswXVxuICAgICAgdGhpcy5tYXJrZXIuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYoZWxlbWVudC5sbmcgPCBtaW4ubG5nKXtcbiAgICAgICAgICBtaW4gPSBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMubmF2aWdhdGVJZCA9IG1pbi5pZDtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMubmF2aWdhdGVJZD1uZXdTZWxlY3QuaWRcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmRGaXJzdEJvdHRvbUVsZW1lbnQoKXtcbiAgICBsZXQgc2VsZWN0ZWQgPSB0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWRdO1xuICAgIGxldCBuZXdTZWxlY3QgPSB0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWQ9PTA/MTowXTtcbiAgICB0aGlzLm1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgaWYoZWxlbWVudCE9c2VsZWN0ZWQgJiYgZWxlbWVudC5sYXQgPCBzZWxlY3RlZC5sYXQgJiYgKGVsZW1lbnQubGF0ID4gbmV3U2VsZWN0LmxhdCB8fCBuZXdTZWxlY3QubGF0ID4gc2VsZWN0ZWQubGF0KSl7XG4gICAgICAgIG5ld1NlbGVjdCA9IGVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYobmV3U2VsZWN0LmxhdCA+PSBzZWxlY3RlZC5sYXQpe1xuICAgICAgbGV0IG1pbj10aGlzLm1hcmtlclswXVxuICAgICAgdGhpcy5tYXJrZXIuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgXG4gICAgICAgIGlmKGVsZW1lbnQubGF0ID4gbWluLmxhdCl7XG4gICAgICAgICAgbWluID0gZWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQgPSBtaW4uaWQ7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQ9bmV3U2VsZWN0LmlkXG4gICAgfVxuICB9XG4gICAgXG4gIHByaXZhdGUgZmluZEZpcnN0VG9wRWxlbWVudCgpe1xuICAgIGxldCBzZWxlY3RlZCA9IHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZF07XG4gICAgbGV0IG5ld1NlbGVjdCA9IHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZD09MD8xOjBdO1xuICAgIHRoaXMubWFya2VyLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBpZihlbGVtZW50IT1zZWxlY3RlZCAmJiBlbGVtZW50LmxhdCA+IHNlbGVjdGVkLmxhdCAmJiAoZWxlbWVudC5sYXQgPCBuZXdTZWxlY3QubGF0IHx8IG5ld1NlbGVjdC5sYXQgPCBzZWxlY3RlZC5sYXQpKXtcbiAgICAgICAgbmV3U2VsZWN0ID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZihuZXdTZWxlY3QubGF0IDw9IHNlbGVjdGVkLmxhdCl7XG4gICAgICBsZXQgbWluPXRoaXMubWFya2VyWzBdXG4gICAgICB0aGlzLm1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZihlbGVtZW50LmxhdCA8IG1pbi5sYXQpe1xuICAgICAgICAgIG1pbiA9IGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkID0gbWluLmlkO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkPW5ld1NlbGVjdC5pZFxuICAgIH1cbiAgfVxuXG4gIC8qKioqKioqKioqKioqKiogc2V0IHBvc2l0aW9uLCBtb3ZlIGFuZCB6b29tIGZ1bmN0aW9ucyAqKioqKioqKioqKioqL1xuXG4gIC8vIHNldCBuZXcgY29vcmRpbmF0ZXMgYW5kIGhhbmRsZSB6b29tIFxuICBwcml2YXRlIHNldFBvc2l0aW9uKCk6IHZvaWQge1xuICAgIGxldCBjb29yZCA9IHRoaXMubWFwLmdldENlbnRlcigpO1xuICAgIHRoaXMubWFwTGF0ID0gY29vcmQubGF0O1xuICAgIHRoaXMubWFwTG5nID0gY29vcmQubG5nO1xuICAgIHRoaXMubWFwWm9vbSA9IHRoaXMubWFwLmdldFpvb20oKTtcbiAgICAvLyBjYWxjdWwgbmV3IG1vdmUgc2l6ZVxuICAgIHRoaXMuc2V0TW92ZVNoaWZ0KCk7XG4gIH1cblxuICAvLyBjYWxjdWwgbmV3IGNvb3JkaW5hdGVzXG4gIHByaXZhdGUgbW92ZU1hcChsYXQsIGxuZyk6IHZvaWQge1xuICAgIHRoaXMubWFwTGF0ICs9IGxhdCAqIHRoaXMubW92ZVNoaWZ0O1xuICAgIHRoaXMubWFwTG5nICs9IGxuZyAqIHRoaXMubW92ZVNoaWZ0O1xuICAgIHRoaXMubWFwLnNldFZpZXcoW3RoaXMubWFwTGF0LCB0aGlzLm1hcExuZ10sIHRoaXMubWFwWm9vbSk7XG4gIH1cblxuICAvLyB1cGRhdGUgem9vbVxuICBwcml2YXRlIHpvb21NYXAoem9vbSk6IHZvaWQge1xuICAgIHRoaXMubWFwWm9vbSArPSB6b29tO1xuICAgIHRoaXMubWFwLnNldFpvb20odGhpcy5tYXBab29tKTtcbiAgfVxuXG4gIC8vIGFsdGVyIG1vdmUgcGFkZGluZ1xuICBzZXRNb3ZlU2hpZnQoKSB7XG4gICAgdGhpcy5tb3ZlU2hpZnQgPSA4MDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMubWFwWm9vbTsgaSsrKSB7XG4gICAgICB0aGlzLm1vdmVTaGlmdCAvPSAyO1xuICAgIH1cbiAgfVxuXG4gIC8qKioqKioqKioqKioqKiogc2VhcmNoIGlucHV0IGZ1bmN0aW9ucyAqKioqKioqKioqKioqL1xuXG4gIC8vIHNldCBpbnB1dCBmb2N1cyBvciBibHVyXG4gIGluaXRJbnB1dCgpIHtcbiAgICAvLyBzZWxlY3Qgc2VhcmNoIGlucHV0IGJveFxuICAgIHRoaXMuc2VhcmNoSW5wdXQgPSB0aGlzLmVsZW0ubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgXCIubGVhZmxldC1jb250cm9sLWdlb2NvZGVyLWZvcm0gaW5wdXRcIlxuICAgICk7XG4gICAgdGhpcy5zZWFyY2hCYXIgPSB0aGlzLmVsZW0ubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgXCIubGVhZmxldC1iYXJcIlxuICAgICk7XG4gICAgdGhpcy5zZXRGb2N1c091dCgpO1xuICB9XG4gIHNldEZvY3VzKCkge1xuICAgIFxuICAgIHRoaXMuc2VhcmNoQmFyLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgdGhpcy5zZWFyY2hJbnB1dC5mb2N1cygpO1xuICAgIHRoaXMuc2VhcmNoSW5wdXRGb2N1c2VkID0gdHJ1ZTtcbiAgfVxuICBzZXRGb2N1c091dCgpIHtcbiAgICB0aGlzLnNlYXJjaElucHV0LmJsdXIoKTtcbiAgICB0aGlzLnNlYXJjaEJhci5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgdGhpcy5zZWFyY2hJbnB1dEZvY3VzZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuc2V0UG9zaXRpb24oKTtcbiAgfVxufVxuIiwiPGRpdiBjbGFzcz1cIm1hcC1jb250YWluZXJcIj5cbiAgICA8aSBjbGFzcz1cImljb24ge3toYW5kbGVJY29ufX1cIj48L2k+XG4gICAgPGRpdiBpZD1cIm1hcFwiPjwvZGl2PlxuPC9kaXY+XG48ZGl2IGNsYXNzPVwibWVudS1jb250YWluZXJcIiBjbGFzcz1cInt7ZGlzcGxheU1lbnV9fVwiPlxuICAgIDxkaXYgY2xhc3M9XCJtZW51LWJveFwiPlxuICAgICAgICA8aSBjbGFzcz1cImljb24gc2VhcmNoIHt7KGNob2lzZU1lbnU9PTA/J3NlbGVjdGVkJzonJyl9fVwiPjwvaT5cbiAgICAgICAgPGkgY2xhc3M9XCJpY29uIHt7aGFuZGxlTWVudUljb259fSB7eyhjaG9pc2VNZW51PT0xPydzZWxlY3RlZCc6JycpfX1cIj48L2k+XG4gICAgICAgIDxpIGNsYXNzPVwiaWNvbiBuYXZpZ2F0aW9uIHt7KGNob2lzZU1lbnU9PTI/J3NlbGVjdGVkJzonJyl9fVwiPjwvaT5cbiAgICAgICAgPGkgY2xhc3M9XCJpY29uIGxvZ291dCB7eyhjaG9pc2VNZW51PT0zPydzZWxlY3RlZCc6JycpfX1cIj48L2k+XG4gICAgPC9kaXY+ICBcbjwvZGl2PiJdfQ==