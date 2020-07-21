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
var MapLibraryComponent = /** @class */ (function () {
    function MapLibraryComponent(elem) {
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
    MapLibraryComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        // init map
        this.initMap();
        this.initInput();
        this.setMoveShift();
        // init display input request
        this.setSearch(this.search);
        this.setMarker(this.marker);
        // send init event
        setTimeout(function () {
            _this.sendModifications("");
        }, 2000);
    };
    MapLibraryComponent.prototype.initMap = function () {
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
    };
    MapLibraryComponent.prototype.setSearch = function (search) {
        var _this = this;
        if (this.search) {
            // load searching
            this.geocoder.setQuery(search)._geocode();
            // search the first element
            setTimeout(function () {
                if (_this.geocoder._results && _this.geocoder._results.length) {
                    _this.geocoder._geocodeResultSelected(_this.geocoder._results[0]);
                    _this.geocoder._clearResults();
                }
            }, 2000);
        }
    };
    MapLibraryComponent.prototype.setMarker = function (marker) {
        var _this = this;
        this.cleanMarkers();
        var i = 0;
        marker.forEach(function (element) {
            if ("lat" in element && "lng" in element) {
                element.id = i;
                if (!element.text) {
                    _this.mapMarkers[i] = L.marker([element.lat, element.lng]);
                }
                else {
                    _this.mapMarkers[i] = _this.generateIconMarker(element);
                }
                _this.mapMarkers[i].addTo(_this.map);
                i++;
            }
        });
    };
    // remove all markers to display news
    MapLibraryComponent.prototype.cleanMarkers = function () {
        for (var i = 0; i < this.mapMarkers.length; i++) {
            this.map.removeLayer(this.mapMarkers[i]);
        }
    };
    // generate Marker
    MapLibraryComponent.prototype.generateIconMarker = function (element) {
        // set html form
        var html = "<div id=\"marker_" + element.id + "\" style=\"background: white; border-radius:20px; position:absolute; padding:5px 10px 0 10px; text-align:center;\">\n              <div style=\"text-align:center; font-size:1.2em;\">" + element.text + "</div>\n              " + (element.content ? "<span>" + element.content + "</span>" : "") +
            (element.img ? "<img style=\"width:60px\" src=\"" + element.img + "\"/>" : "") + "\n            </div>";
        // return leaflet marker
        return new L.Marker([element.lat, element.lng], {
            icon: new L.DivIcon({
                className: '',
                iconSize: [100, 70],
                iconAnchor: [45, element.img ? 40 : 10],
                html: html,
            })
        });
    };
    /*************** components attributes events *************/
    MapLibraryComponent.prototype.ngOnChanges = function (changes) {
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
    };
    /*************** keyboard event detect and functions *************/
    MapLibraryComponent.prototype.keyEvent = function (event) {
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
    };
    MapLibraryComponent.prototype.handlingNavigation = function (key) {
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
    };
    MapLibraryComponent.prototype.handlingMenu = function (key) {
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
    };
    MapLibraryComponent.prototype.handlingMap = function (key) {
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
    };
    // display move or zoom icon when press
    MapLibraryComponent.prototype.changeMode = function () {
        this.moveMode = !this.moveMode;
        if (this.moveMode) {
            this.handleIcon = "move";
            this.handleMenuIcon = "zoom";
        }
        else {
            this.handleIcon = "zoom";
            this.handleMenuIcon = "move";
        }
    };
    MapLibraryComponent.prototype.sendModifications = function (key) {
        // calcul map outline by container size and pixel progection
        var mapSize = this.map.getSize();
        var centerPixel = this.map.project([this.mapLat, this.mapLng], this.mapZoom);
        var topLeft = this.map.unproject([centerPixel.x - mapSize.x / 2, centerPixel.y - mapSize.y / 2], this.mapZoom);
        var bottomRight = this.map.unproject([centerPixel.x + mapSize.x / 2, centerPixel.y + mapSize.y / 2], this.mapZoom);
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
    };
    MapLibraryComponent.prototype.sendSelectEvent = function (selected) {
        this.onselect.emit(selected);
    };
    /*************** escape app functions *************/
    MapLibraryComponent.prototype.openMenu = function () {
        this.displayMenu = "show-menu";
    };
    MapLibraryComponent.prototype.closeMenu = function () {
        this.displayMenu = "";
        this.choiseMenu = 1;
    };
    // show escape message
    MapLibraryComponent.prototype.selectMenu = function (key) {
        if (key == "Escape") {
            this.closeMenu();
        }
        else {
            //this.validEscape = false;
        }
    };
    /*************** navigate between markers *************/
    MapLibraryComponent.prototype.setNavigationMode = function () {
        this.navigate = true;
        this.handleIcon = "navigation";
        this.navigateMarker(0, 0);
        // define menu to move
        this.moveMode = false;
        this.handleMenuIcon = "move";
    };
    MapLibraryComponent.prototype.navigateMarker = function (lat, lng) {
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
    };
    MapLibraryComponent.prototype.findFirstLeftElement = function () {
        var selected = this.marker[this.navigateId];
        var newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(function (element) {
            if (element != selected && element.lng < selected.lng && (element.lng > newSelect.lng || newSelect.lng > selected.lng)) {
                newSelect = element;
            }
        });
        if (newSelect.lng >= selected.lng) {
            var min_1 = this.marker[0];
            this.marker.forEach(function (element) {
                if (element.lng > min_1.lng) {
                    min_1 = element;
                }
            });
            this.navigateId = min_1.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    };
    MapLibraryComponent.prototype.findFirstRightElement = function () {
        var selected = this.marker[this.navigateId];
        var newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(function (element) {
            if (element != selected && element.lng > selected.lng && (element.lng < newSelect.lng || newSelect.lng < selected.lng)) {
                newSelect = element;
            }
        });
        if (newSelect.lng <= selected.lng) {
            var min_2 = this.marker[0];
            this.marker.forEach(function (element) {
                if (element.lng < min_2.lng) {
                    min_2 = element;
                }
            });
            this.navigateId = min_2.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    };
    MapLibraryComponent.prototype.findFirstBottomElement = function () {
        var selected = this.marker[this.navigateId];
        var newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(function (element) {
            if (element != selected && element.lat < selected.lat && (element.lat > newSelect.lat || newSelect.lat > selected.lat)) {
                newSelect = element;
            }
        });
        if (newSelect.lat >= selected.lat) {
            var min_3 = this.marker[0];
            this.marker.forEach(function (element) {
                if (element.lat > min_3.lat) {
                    min_3 = element;
                }
            });
            this.navigateId = min_3.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    };
    MapLibraryComponent.prototype.findFirstTopElement = function () {
        var selected = this.marker[this.navigateId];
        var newSelect = this.marker[this.navigateId == 0 ? 1 : 0];
        this.marker.forEach(function (element) {
            if (element != selected && element.lat > selected.lat && (element.lat < newSelect.lat || newSelect.lat < selected.lat)) {
                newSelect = element;
            }
        });
        if (newSelect.lat <= selected.lat) {
            var min_4 = this.marker[0];
            this.marker.forEach(function (element) {
                if (element.lat < min_4.lat) {
                    min_4 = element;
                }
            });
            this.navigateId = min_4.id;
        }
        else {
            this.navigateId = newSelect.id;
        }
    };
    /*************** set position, move and zoom functions *************/
    // set new coordinates and handle zoom 
    MapLibraryComponent.prototype.setPosition = function () {
        var coord = this.map.getCenter();
        this.mapLat = coord.lat;
        this.mapLng = coord.lng;
        this.mapZoom = this.map.getZoom();
        // calcul new move size
        this.setMoveShift();
    };
    // calcul new coordinates
    MapLibraryComponent.prototype.moveMap = function (lat, lng) {
        this.mapLat += lat * this.moveShift;
        this.mapLng += lng * this.moveShift;
        this.map.setView([this.mapLat, this.mapLng], this.mapZoom);
    };
    // update zoom
    MapLibraryComponent.prototype.zoomMap = function (zoom) {
        this.mapZoom += zoom;
        this.map.setZoom(this.mapZoom);
    };
    // alter move padding
    MapLibraryComponent.prototype.setMoveShift = function () {
        this.moveShift = 80;
        for (var i = 1; i < this.mapZoom; i++) {
            this.moveShift /= 2;
        }
    };
    /*************** search input functions *************/
    // set input focus or blur
    MapLibraryComponent.prototype.initInput = function () {
        // select search input box
        this.searchInput = this.elem.nativeElement.querySelector(".leaflet-control-geocoder-form input");
        this.searchBar = this.elem.nativeElement.querySelector(".leaflet-bar");
        this.setFocusOut();
    };
    MapLibraryComponent.prototype.setFocus = function () {
        this.searchBar.style.display = "block";
        this.searchInput.focus();
        this.searchInputFocused = true;
    };
    MapLibraryComponent.prototype.setFocusOut = function () {
        this.searchInput.blur();
        this.searchBar.style.display = "none";
        this.searchInputFocused = false;
        this.setPosition();
    };
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
    return MapLibraryComponent;
}());
export { MapLibraryComponent };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLWxpYnJhcnkuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6Im5nOi8vbWFwLWxpYnJhcnkvIiwic291cmNlcyI6WyJsaWIvbWFwLWxpYnJhcnkuY29tcG9uZW50LnRzIiwibGliL21hcC1saWJyYXJ5LmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFFTCxTQUFTLEVBQ1QsWUFBWSxFQUVaLE1BQU0sRUFDTixZQUFZLEVBRWIsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxLQUFLLENBQUMsTUFBTSxTQUFTLENBQUM7QUFDN0IsT0FBTywwQkFBMEIsQ0FBQzs7QUFFbEMsTUFBTSxDQUFOLElBQVksS0FJWDtBQUpELFdBQVksS0FBSztJQUNmLDBDQUFhLENBQUE7SUFDYix5Q0FBWSxDQUFBO0lBQ1osd0NBQVksQ0FBQTtBQUNkLENBQUMsRUFKVyxLQUFLLEtBQUwsS0FBSyxRQUloQjtBQUVEO0lBaUNFLDZCQUFvQixJQUFnQjtRQUFoQixTQUFJLEdBQUosSUFBSSxDQUFZO1FBeEJwQyxlQUFlO1FBQ1IsV0FBTSxHQUFXLEVBQUUsQ0FBQztRQUNwQixXQUFNLEdBQVcsQ0FBQyxDQUFDO1FBQ25CLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFJakIsYUFBUSxHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFDbkMsYUFBUSxHQUFHLElBQUksWUFBWSxFQUFPLENBQUM7UUFNckMsdUJBQWtCLEdBQUcsS0FBSyxDQUFDO1FBQzNCLGFBQVEsR0FBRyxJQUFJLENBQUM7UUFFakIsZUFBVSxHQUFHLE1BQU0sQ0FBQztRQUNwQixtQkFBYyxHQUFHLE1BQU0sQ0FBQztRQUN4QixnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUNqQixlQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsYUFBUSxHQUFHLEtBQUssQ0FBQztRQUNqQixlQUFVLEdBQUcsQ0FBQyxDQUFDO1FBc0R2QixrQkFBa0I7UUFDVixlQUFVLEdBQUcsRUFBRSxDQUFDO0lBckRn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STtZQUFBLDhCQUNJO1lBQUEsb0JBQTZEO1lBQzdELG9CQUF5RTtZQUN6RSxvQkFBaUU7WUFDakUsb0JBQTZEO1lBQ2pFLGlCQUFNO1lBQ1YsaUJBQU07O1lBVkMsZUFBMkI7WUFBM0Isc0RBQTJCO1lBR04sZUFBdUI7WUFBdkIsOEJBQXVCO1lBRXhDLGVBQXFEO1lBQXJELG9GQUFxRDtZQUNyRCxlQUFpRTtZQUFqRSxzR0FBaUU7WUFDakUsZUFBeUQ7WUFBekQsd0ZBQXlEO1lBQ3pELGVBQXFEO1lBQXJELG9GQUFxRDs7OEJEVGhFO0NBcWlCQyxBQW5oQkQsSUFtaEJDO1NBNWdCWSxtQkFBbUI7a0RBQW5CLG1CQUFtQjtjQVAvQixTQUFTO2VBQUM7Z0JBQ1QsUUFBUSxFQUFFLGFBQWE7Z0JBQ3ZCLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUM7Z0JBQzNELFdBQVcsRUFBRSw4QkFBOEI7Z0JBQzNDLFNBQVMsRUFBRSxDQUFDLDZCQUE2QixFQUFFO2FBQzVDOztrQkFXRSxNQUFNOztrQkFDTixNQUFNOztrQkE2SU4sWUFBWTttQkFBQyxjQUFjLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb21wb25lbnQsXG4gIEhvc3RMaXN0ZW5lcixcbiAgRWxlbWVudFJlZixcbiAgT3V0cHV0LFxuICBFdmVudEVtaXR0ZXIsXG4gIFNpbXBsZUNoYW5nZXNcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCAqIGFzIEwgZnJvbSBcImxlYWZsZXRcIjtcbmltcG9ydCBcImxlYWZsZXQtY29udHJvbC1nZW9jb2RlclwiO1xuXG5leHBvcnQgZW51bSBDT05TVCB7XG4gIFpPT01fTUFYID0gMTgsXG4gIFpPT01fTUlOID0gMixcbiAgTEFUX01BWCA9IDg1LFxufVxuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwibWFwLWxpYnJhcnlcIixcbiAgaW5wdXRzOiBbJ21hcExhdCcsICdtYXBMbmcnLCAnbWFwWm9vbScsICdzZWFyY2gnLCAnbWFya2VyJ10sXG4gIHRlbXBsYXRlVXJsOiBcIi4vbWFwLWxpYnJhcnkuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL21hcC1saWJyYXJ5LmNvbXBvbmVudC5jc3NcIixdLFxufSlcblxuZXhwb3J0IGNsYXNzIE1hcExpYnJhcnlDb21wb25lbnQgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0IHtcblxuICAvLyBpbnB1dCB2YWx1ZXNcbiAgcHVibGljIG1hcExhdDogbnVtYmVyID0gNDU7XG4gIHB1YmxpYyBtYXBMbmc6IG51bWJlciA9IDU7XG4gIHB1YmxpYyBtYXBab29tOiBudW1iZXIgPSA1O1xuICBwdWJsaWMgc2VhcmNoOiBTdHJpbmc7XG4gIHB1YmxpYyBtYXJrZXI6IGFueTtcblxuICBAT3V0cHV0KCkgb25jaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgQE91dHB1dCgpIG9uc2VsZWN0ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG5cbiAgcHJpdmF0ZSBtYXA7XG4gIHByaXZhdGUgZ2VvY29kZXI7XG4gIHByaXZhdGUgc2VhcmNoSW5wdXQ7XG4gIHByaXZhdGUgc2VhcmNoQmFyO1xuICBwcml2YXRlIHNlYXJjaElucHV0Rm9jdXNlZCA9IGZhbHNlO1xuICBwcml2YXRlIG1vdmVNb2RlID0gdHJ1ZTtcbiAgcHJpdmF0ZSBtb3ZlU2hpZnQ7XG4gIHB1YmxpYyBoYW5kbGVJY29uID0gXCJtb3ZlXCI7XG4gIHB1YmxpYyBoYW5kbGVNZW51SWNvbiA9IFwiem9vbVwiO1xuICBwdWJsaWMgZGlzcGxheU1lbnUgPSBcIlwiO1xuICBwdWJsaWMgY2hvaXNlTWVudSA9IDE7XG4gIHByaXZhdGUgbmF2aWdhdGUgPSBmYWxzZTtcbiAgcHJpdmF0ZSBuYXZpZ2F0ZUlkID0gMDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVsZW06IEVsZW1lbnRSZWYpIHsgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpOiB2b2lkIHtcbiAgICAvLyBpbml0IG1hcFxuICAgIHRoaXMuaW5pdE1hcCgpO1xuICAgIHRoaXMuaW5pdElucHV0KCk7XG4gICAgdGhpcy5zZXRNb3ZlU2hpZnQoKTtcblxuICAgIC8vIGluaXQgZGlzcGxheSBpbnB1dCByZXF1ZXN0XG4gICAgdGhpcy5zZXRTZWFyY2godGhpcy5zZWFyY2gpO1xuICAgIHRoaXMuc2V0TWFya2VyKHRoaXMubWFya2VyKTtcbiAgICAvLyBzZW5kIGluaXQgZXZlbnRcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuc2VuZE1vZGlmaWNhdGlvbnMoXCJcIik7XG4gICAgfSwgMjAwMClcbiAgfVxuXG4gIHByaXZhdGUgaW5pdE1hcCgpOiB2b2lkIHtcbiAgICAvLyBpbml0IG1hcFxuICAgIHRoaXMubWFwID0gTC5tYXAoXCJtYXBcIiwge1xuICAgICAgYXR0cmlidXRpb25Db250cm9sOiBmYWxzZSxcbiAgICAgIHpvb21Db250cm9sOiBmYWxzZSxcbiAgICAgIGNlbnRlcjogW3RoaXMubWFwTGF0LCB0aGlzLm1hcExuZ10sXG4gICAgICB6b29tOiB0aGlzLm1hcFpvb20sXG4gICAgfSk7XG4gICAgLy8gZGlzcGxheSBtYXBcbiAgICBMLnRpbGVMYXllcihcImh0dHBzOi8ve3N9LnRpbGUub3NtLm9yZy97en0ve3h9L3t5fS5wbmdcIikuYWRkVG8odGhpcy5tYXApO1xuICAgIC8vIGRpc2FibGUga2V5Ym9hcmRcbiAgICB0aGlzLm1hcC5rZXlib2FyZC5kaXNhYmxlKCk7XG4gICAgLy8gYWRkIHNlYXJjaCBib3hcbiAgICB0aGlzLmdlb2NvZGVyID0gTC5Db250cm9sLmdlb2NvZGVyKHtcbiAgICAgIHBvc2l0aW9uOiBcInRvcGxlZnRcIixcbiAgICAgIGNvbGxhcHNlZDogZmFsc2UsXG4gICAgICBwbGFjZWhvbGRlcjogXCJSZWNoZXJjaGUuLi5cIixcbiAgICAgIGRlZmF1bHRNYXJrR2VvY29kZTogdHJ1ZSxcbiAgICB9KS5hZGRUbyh0aGlzLm1hcCk7XG4gIH1cblxuICBwcml2YXRlIHNldFNlYXJjaChzZWFyY2gpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zZWFyY2gpIHtcbiAgICAgIC8vIGxvYWQgc2VhcmNoaW5nXG4gICAgICB0aGlzLmdlb2NvZGVyLnNldFF1ZXJ5KHNlYXJjaCkuX2dlb2NvZGUoKVxuICAgICAgLy8gc2VhcmNoIHRoZSBmaXJzdCBlbGVtZW50XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuZ2VvY29kZXIuX3Jlc3VsdHMgJiYgdGhpcy5nZW9jb2Rlci5fcmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICB0aGlzLmdlb2NvZGVyLl9nZW9jb2RlUmVzdWx0U2VsZWN0ZWQodGhpcy5nZW9jb2Rlci5fcmVzdWx0c1swXSlcbiAgICAgICAgICB0aGlzLmdlb2NvZGVyLl9jbGVhclJlc3VsdHMoKTtcbiAgICAgICAgfVxuICAgICAgfSwgMjAwMCk7XG4gICAgfVxuICB9XG5cbiAgLy8gZGlzcGxheSBtYXJrZXJzXG4gIHByaXZhdGUgbWFwTWFya2VycyA9IFtdO1xuICBwcml2YXRlIHNldE1hcmtlcihtYXJrZXIpOiB2b2lkIHtcblxuICAgIHRoaXMuY2xlYW5NYXJrZXJzKCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIG1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgaWYgKFwibGF0XCIgaW4gZWxlbWVudCAmJiBcImxuZ1wiIGluIGVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5pZD1pO1xuICAgICAgICBpZiAoIWVsZW1lbnQudGV4dCkge1xuICAgICAgICAgIHRoaXMubWFwTWFya2Vyc1tpXSA9IEwubWFya2VyKFtlbGVtZW50LmxhdCwgZWxlbWVudC5sbmddKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMubWFwTWFya2Vyc1tpXSA9IHRoaXMuZ2VuZXJhdGVJY29uTWFya2VyKGVsZW1lbnQpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tYXBNYXJrZXJzW2ldLmFkZFRvKHRoaXMubWFwKTtcbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gcmVtb3ZlIGFsbCBtYXJrZXJzIHRvIGRpc3BsYXkgbmV3c1xuICBwcml2YXRlIGNsZWFuTWFya2VycygpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubWFwTWFya2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5tYXAucmVtb3ZlTGF5ZXIodGhpcy5tYXBNYXJrZXJzW2ldKTtcbiAgICB9XG4gIH1cblxuICAvLyBnZW5lcmF0ZSBNYXJrZXJcbiAgcHJpdmF0ZSBnZW5lcmF0ZUljb25NYXJrZXIoZWxlbWVudCkge1xuXG4gICAgLy8gc2V0IGh0bWwgZm9ybVxuICAgIGxldCBodG1sID0gYDxkaXYgaWQ9XCJtYXJrZXJfJHtlbGVtZW50LmlkfVwiIHN0eWxlPVwiYmFja2dyb3VuZDogd2hpdGU7IGJvcmRlci1yYWRpdXM6MjBweDsgcG9zaXRpb246YWJzb2x1dGU7IHBhZGRpbmc6NXB4IDEwcHggMCAxMHB4OyB0ZXh0LWFsaWduOmNlbnRlcjtcIj5cbiAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyOyBmb250LXNpemU6MS4yZW07XCI+JHtlbGVtZW50LnRleHR9PC9kaXY+XG4gICAgICAgICAgICAgIGArIChlbGVtZW50LmNvbnRlbnQgPyBgPHNwYW4+JHtlbGVtZW50LmNvbnRlbnR9PC9zcGFuPmAgOiBgYCkgK1xuICAgICAgKGVsZW1lbnQuaW1nID8gYDxpbWcgc3R5bGU9XCJ3aWR0aDo2MHB4XCIgc3JjPVwiJHtlbGVtZW50LmltZ31cIi8+YCA6IGBgKSArIGBcbiAgICAgICAgICAgIDwvZGl2PmBcblxuICAgIC8vIHJldHVybiBsZWFmbGV0IG1hcmtlclxuICAgIHJldHVybiBuZXcgTC5NYXJrZXIoW2VsZW1lbnQubGF0LCBlbGVtZW50LmxuZ10sIHtcbiAgICAgIGljb246IG5ldyBMLkRpdkljb24oe1xuICAgICAgICBjbGFzc05hbWU6ICcnLFxuICAgICAgICBpY29uU2l6ZTogWzEwMCwgNzBdLCAvLyBzaXplIG9mIHRoZSBpY29uXG4gICAgICAgIGljb25BbmNob3I6IFs0NSwgZWxlbWVudC5pbWcgPyA0MCA6IDEwXSxcbiAgICAgICAgaHRtbCxcbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIC8qKioqKioqKioqKioqKiogY29tcG9uZW50cyBhdHRyaWJ1dGVzIGV2ZW50cyAqKioqKioqKioqKioqL1xuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpIHtcbiAgICBpZiAodGhpcy5tYXApIHtcbiAgICAgIHN3aXRjaCAoT2JqZWN0LmtleXMoY2hhbmdlcylbMF0pIHtcbiAgICAgICAgY2FzZSBcIm1hcFpvb21cIjpcbiAgICAgICAgY2FzZSBcIm1hcExhdFwiOlxuICAgICAgICBjYXNlIFwibWFwTG5nXCI6XG4gICAgICAgICAgdGhpcy5tYXAuc2V0VmlldyhbdGhpcy5tYXBMYXQsIHRoaXMubWFwTG5nXSwgdGhpcy5tYXBab29tKTtcbiAgICAgICAgICB0aGlzLnNldE1vdmVTaGlmdCgpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibWFya2VyXCI6XG4gICAgICAgICAgdGhpcy5zZXRNYXJrZXIodGhpcy5tYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic2VhcmNoXCI6XG4gICAgICAgICAgdGhpcy5zZXRTZWFyY2godGhpcy5zZWFyY2gpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKioqKioqKioqKioqKioga2V5Ym9hcmQgZXZlbnQgZGV0ZWN0IGFuZCBmdW5jdGlvbnMgKioqKioqKioqKioqKi9cblxuXG5cbiAgQEhvc3RMaXN0ZW5lcihcIndpbmRvdzprZXl1cFwiLCBbXCIkZXZlbnRcIl0pXG4gIGtleUV2ZW50KGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG5cbiAgICBpZiAodGhpcy5kaXNwbGF5TWVudSAhPSBcIlwiKSB7XG4gICAgICB0aGlzLmhhbmRsaW5nTWVudShldmVudC5rZXkpO1xuXG4gICAgfSBlbHNlIGlmKHRoaXMubmF2aWdhdGUpe1xuICAgICAgdGhpcy5oYW5kbGluZ05hdmlnYXRpb24oZXZlbnQua2V5KVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGFuZGxpbmdNYXAoZXZlbnQua2V5KVxuICAgICAgLy8gc2VuZCBjaGFuZ2UgdG8gcGFyZW50IGFwcGxpY2F0aW9uXG4gICAgICB0aGlzLnNlbmRNb2RpZmljYXRpb25zKGV2ZW50LmtleSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGluZ05hdmlnYXRpb24oa2V5KTogdm9pZCB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgIGNhc2UgXCJBcnJvd1VwXCI6XG4gICAgICAgIHRoaXMubmF2aWdhdGVNYXJrZXIoMSwwKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0Rvd25cIjpcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZU1hcmtlcigtMSwwKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd1JpZ2h0XCI6XG4gICAgICAgIHRoaXMubmF2aWdhdGVNYXJrZXIoMCwxKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0xlZnRcIjpcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZU1hcmtlcigwLC0xKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJFbnRlclwiOlxuICAgICAgICAvLyBzZW5kIGNoYW5nZSB0byBwYXJlbnQgYXBwbGljYXRpb25cbiAgICAgICAgaWYodGhpcy5tYXJrZXJbdGhpcy5uYXZpZ2F0ZUlkXSlcbiAgICAgICAgICB0aGlzLnNlbmRTZWxlY3RFdmVudCh0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWRdKVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJFc2NhcGVcIjpcbiAgICAgICAgdGhpcy5vcGVuTWVudSgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsaW5nTWVudShrZXkpOiB2b2lkIHtcbiAgICBzd2l0Y2ggKGtleSkge1xuICAgICAgY2FzZSBcIkFycm93UmlnaHRcIjpcbiAgICAgICAgdGhpcy5jaG9pc2VNZW51Kys7XG4gICAgICAgIGlmICh0aGlzLmNob2lzZU1lbnUgPiAzKSB7XG4gICAgICAgICAgdGhpcy5jaG9pc2VNZW51ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd0xlZnRcIjpcbiAgICAgICAgdGhpcy5jaG9pc2VNZW51LS07XG4gICAgICAgIGlmICh0aGlzLmNob2lzZU1lbnUgPCAwKSB7XG4gICAgICAgICAgdGhpcy5jaG9pc2VNZW51ID0gMztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJFbnRlclwiOlxuICAgICAgICAvLyByZXNldCBuYXZpZ2F0aW9uIG1vZGVcbiAgICAgICAgdGhpcy5uYXZpZ2F0ZT1mYWxzZTtcblxuICAgICAgICBpZiAodGhpcy5jaG9pc2VNZW51ID09IDApIHtcbiAgICAgICAgICB0aGlzLnNldEZvY3VzKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnNldEZvY3VzT3V0KCk7XG4gICAgICAgIH0gXG4gICAgICAgIGlmICh0aGlzLmNob2lzZU1lbnUgPT0gMSkge1xuICAgICAgICAgIHRoaXMuc2V0TWFya2VyKHRoaXMubWFya2VyKTtcbiAgICAgICAgICB0aGlzLmNoYW5nZU1vZGUoKVxuXG4gICAgICAgIH0gZWxzZSBpZih0aGlzLmNob2lzZU1lbnU9PTIpe1xuICAgICAgICAgIHRoaXMuc2V0TmF2aWdhdGlvbk1vZGUoKVxuXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaG9pc2VNZW51ID09IDMpIHtcbiAgICAgICAgICBhbGVydChcImV4aXRcIilcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsb3NlTWVudSgpXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkVzY2FwZVwiOlxuICAgICAgICB0aGlzLmNsb3NlTWVudSgpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGhhbmRsaW5nTWFwKGtleSk6IHZvaWQge1xuICAgIHN3aXRjaCAoa2V5KSB7XG4gICAgICBjYXNlIFwiQXJyb3dVcFwiOlxuICAgICAgICBpZiAodGhpcy5tb3ZlTW9kZSkge1xuICAgICAgICAgIGlmICh0aGlzLm1hcC5nZXRDZW50ZXIoKS5sYXQgPCBDT05TVC5MQVRfTUFYKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVNYXAoMSwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0aGlzLm1hcFpvb20gPCBDT05TVC5aT09NX01BWCkge1xuICAgICAgICAgICAgdGhpcy56b29tTWFwKDEpO1xuICAgICAgICAgICAgdGhpcy5tb3ZlU2hpZnQgLz0gMjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXJyb3dEb3duXCI6XG4gICAgICAgIGlmICh0aGlzLm1vdmVNb2RlKSB7XG4gICAgICAgICAgaWYgKHRoaXMubWFwLmdldENlbnRlcigpLmxhdCA+IC1DT05TVC5MQVRfTUFYKSB7XG4gICAgICAgICAgICB0aGlzLm1vdmVNYXAoLTEsIDApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXBab29tID4gQ09OU1QuWk9PTV9NSU4pIHtcbiAgICAgICAgICAgIHRoaXMuem9vbU1hcCgtMSk7XG4gICAgICAgICAgICB0aGlzLm1vdmVTaGlmdCAqPSAyO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJBcnJvd1JpZ2h0XCI6XG4gICAgICAgIGlmICh0aGlzLm1vdmVNb2RlKSB7XG4gICAgICAgICAgdGhpcy5tb3ZlTWFwKDAsIDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkFycm93TGVmdFwiOlxuICAgICAgICBpZiAodGhpcy5tb3ZlTW9kZSkge1xuICAgICAgICAgIHRoaXMubW92ZU1hcCgwLCAtMSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgdGhpcy5jaGFuZ2VNb2RlKClcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiRXNjYXBlXCI6XG4gICAgICAgIHRoaXMub3Blbk1lbnUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gZGlzcGxheSBtb3ZlIG9yIHpvb20gaWNvbiB3aGVuIHByZXNzXG4gIHByaXZhdGUgY2hhbmdlTW9kZSgpOiB2b2lkIHtcbiAgICB0aGlzLm1vdmVNb2RlID0gIXRoaXMubW92ZU1vZGU7XG4gICAgaWYgKHRoaXMubW92ZU1vZGUpIHtcbiAgICAgIHRoaXMuaGFuZGxlSWNvbiA9IFwibW92ZVwiO1xuICAgICAgdGhpcy5oYW5kbGVNZW51SWNvbiA9IFwiem9vbVwiXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaGFuZGxlSWNvbiA9IFwiem9vbVwiO1xuICAgICAgdGhpcy5oYW5kbGVNZW51SWNvbiA9IFwibW92ZVwiXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZW5kTW9kaWZpY2F0aW9ucyhrZXkpIHtcbiAgICAvLyBjYWxjdWwgbWFwIG91dGxpbmUgYnkgY29udGFpbmVyIHNpemUgYW5kIHBpeGVsIHByb2dlY3Rpb25cbiAgICBsZXQgbWFwU2l6ZSA9IHRoaXMubWFwLmdldFNpemUoKTtcbiAgICBsZXQgY2VudGVyUGl4ZWwgPSB0aGlzLm1hcC5wcm9qZWN0KFt0aGlzLm1hcExhdCwgdGhpcy5tYXBMbmddLCB0aGlzLm1hcFpvb20pXG4gICAgbGV0IHRvcExlZnQgPSB0aGlzLm1hcC51bnByb2plY3QoW2NlbnRlclBpeGVsLnggLSBtYXBTaXplLnggLyAyLCBjZW50ZXJQaXhlbC55IC0gbWFwU2l6ZS55IC8gMl0sIHRoaXMubWFwWm9vbSlcbiAgICBsZXQgYm90dG9tUmlnaHQgPSB0aGlzLm1hcC51bnByb2plY3QoW2NlbnRlclBpeGVsLnggKyBtYXBTaXplLnggLyAyLCBjZW50ZXJQaXhlbC55ICsgbWFwU2l6ZS55IC8gMl0sIHRoaXMubWFwWm9vbSlcblxuICAgIC8vIHNlbmQgY29vcmRpbmF0ZXMgcmVzdWx0c1xuICAgIHRoaXMub25jaGFuZ2UuZW1pdChcbiAgICAgIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHpvb206IHRoaXMubWFwWm9vbSxcbiAgICAgICAgbGF0OiB0aGlzLm1hcExhdCxcbiAgICAgICAgbG5nOiB0aGlzLm1hcExuZyxcbiAgICAgICAgdmlldzoge1xuICAgICAgICAgIHRvcDogdG9wTGVmdC5sYXQsXG4gICAgICAgICAgbGVmdDogdG9wTGVmdC5sbmcsXG4gICAgICAgICAgYm90dG9tOiBib3R0b21SaWdodC5sYXQsXG4gICAgICAgICAgcmlnaHQ6IGJvdHRvbVJpZ2h0LmxuZ1xuICAgICAgICB9ICAgICAgIFxuICAgICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgc2VuZFNlbGVjdEV2ZW50KHNlbGVjdGVkKSB7XG4gICAgdGhpcy5vbnNlbGVjdC5lbWl0KHNlbGVjdGVkKVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKiBlc2NhcGUgYXBwIGZ1bmN0aW9ucyAqKioqKioqKioqKioqL1xuXG4gIHByaXZhdGUgb3Blbk1lbnUoKTogdm9pZCB7XG4gICAgdGhpcy5kaXNwbGF5TWVudSA9IFwic2hvdy1tZW51XCI7XG4gIH1cblxuICBwcml2YXRlIGNsb3NlTWVudSgpOiB2b2lkIHtcbiAgICB0aGlzLmRpc3BsYXlNZW51ID0gXCJcIjtcbiAgICB0aGlzLmNob2lzZU1lbnUgPSAxO1xuICB9XG4gIC8vIHNob3cgZXNjYXBlIG1lc3NhZ2VcbiAgcHJpdmF0ZSBzZWxlY3RNZW51KGtleSk6IHZvaWQge1xuICAgIGlmIChrZXkgPT0gXCJFc2NhcGVcIikge1xuICAgICAgdGhpcy5jbG9zZU1lbnUoKVxuICAgIH0gZWxzZSB7XG4gICAgICAvL3RoaXMudmFsaWRFc2NhcGUgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKioqKioqKioqKioqKioqIG5hdmlnYXRlIGJldHdlZW4gbWFya2VycyAqKioqKioqKioqKioqL1xuXG4gIHByaXZhdGUgc2V0TmF2aWdhdGlvbk1vZGUoKTogdm9pZHtcbiAgICB0aGlzLm5hdmlnYXRlPXRydWU7XG4gICAgdGhpcy5oYW5kbGVJY29uID0gXCJuYXZpZ2F0aW9uXCI7XG4gICAgdGhpcy5uYXZpZ2F0ZU1hcmtlcigwLDApXG4gICAgLy8gZGVmaW5lIG1lbnUgdG8gbW92ZVxuICAgIHRoaXMubW92ZU1vZGUgPSBmYWxzZVxuICAgIHRoaXMuaGFuZGxlTWVudUljb24gPSBcIm1vdmVcIlxuICB9XG5cbiAgcHJpdmF0ZSBuYXZpZ2F0ZU1hcmtlcihsYXQsIGxuZyk6IHZvaWR7XG4gICAgaWYoIXRoaXMubWFya2VyLmxlbmd0aCl7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKHRoaXMubWFya2VyLmxlbmd0aD09MSl7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQgPSAwO1xuICAgICAgdGhpcy5lbGVtLm5hdGl2ZUVsZW1lbnQucXVlcnlTZWxlY3RvcihcIiNtYXJrZXJfXCIrdGhpcy5uYXZpZ2F0ZUlkKS5zdHlsZS5iYWNrZ3JvdW5kPVwib3JhbmdlXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmKHRoaXMubmF2aWdhdGVJZCA+IHRoaXMubWFya2VyLmxlbmd0aCl7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQgPSAwO1xuICAgIH1cbiAgICBpZihsYXQhPTAgfHwgbG5nICE9IDApe1xuICAgICAgLy8gcmVzZXQgcHJldmlvdXNcbiAgICAgIHRoaXMuZWxlbS5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWFya2VyX1wiK3RoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZF0uaWQpLnN0eWxlLmJhY2tncm91bmQ9XCJ3aGl0ZVwiOyAgICBcbiAgICB9XG4gICAgLy8gZGlzcGxheSBuZXdcbiAgICBpZihsbmc+MCl7XG4gICAgICB0aGlzLmZpbmRGaXJzdFJpZ2h0RWxlbWVudCgpO1xuICAgIH1lbHNlIGlmKGxuZzwwKXtcbiAgICAgIHRoaXMuZmluZEZpcnN0TGVmdEVsZW1lbnQoKTtcbiAgICB9ZWxzZSBpZihsYXQ+MCl7XG4gICAgICB0aGlzLmZpbmRGaXJzdFRvcEVsZW1lbnQoKTtcbiAgICB9ZWxzZSBpZihsYXQ8MCl7XG4gICAgICB0aGlzLmZpbmRGaXJzdEJvdHRvbUVsZW1lbnQoKTtcbiAgICB9ZWxzZSB7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQ9MFxuICAgIH1cbiAgICB0aGlzLmVsZW0ubmF0aXZlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiI21hcmtlcl9cIit0aGlzLm5hdmlnYXRlSWQpLnN0eWxlLmJhY2tncm91bmQ9XCJvcmFuZ2VcIjtcbiAgfVxuXG4gIHByaXZhdGUgZmluZEZpcnN0TGVmdEVsZW1lbnQoKXtcbiAgICBsZXQgc2VsZWN0ZWQgPSB0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWRdO1xuICAgIGxldCBuZXdTZWxlY3QgPSB0aGlzLm1hcmtlclt0aGlzLm5hdmlnYXRlSWQ9PTA/MTowXTtcbiAgICB0aGlzLm1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgaWYoZWxlbWVudCE9c2VsZWN0ZWQgJiYgZWxlbWVudC5sbmcgPCBzZWxlY3RlZC5sbmcgJiYgKGVsZW1lbnQubG5nID4gbmV3U2VsZWN0LmxuZyB8fCBuZXdTZWxlY3QubG5nID4gc2VsZWN0ZWQubG5nKSl7XG4gICAgICAgIG5ld1NlbGVjdCA9IGVsZW1lbnQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYobmV3U2VsZWN0LmxuZyA+PSBzZWxlY3RlZC5sbmcpe1xuICAgICAgbGV0IG1pbj10aGlzLm1hcmtlclswXVxuICAgICAgdGhpcy5tYXJrZXIuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgaWYoZWxlbWVudC5sbmcgPiBtaW4ubG5nKXtcbiAgICAgICAgICBtaW4gPSBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMubmF2aWdhdGVJZCA9IG1pbi5pZDtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMubmF2aWdhdGVJZD1uZXdTZWxlY3QuaWRcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGZpbmRGaXJzdFJpZ2h0RWxlbWVudCgpe1xuICAgIGxldCBzZWxlY3RlZCA9IHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZF07XG4gICAgbGV0IG5ld1NlbGVjdCA9IHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZD09MD8xOjBdO1xuICAgIHRoaXMubWFya2VyLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBpZihlbGVtZW50IT1zZWxlY3RlZCAmJiBlbGVtZW50LmxuZyA+IHNlbGVjdGVkLmxuZyAmJiAoZWxlbWVudC5sbmcgPCBuZXdTZWxlY3QubG5nIHx8IG5ld1NlbGVjdC5sbmcgPCBzZWxlY3RlZC5sbmcpKXtcbiAgICAgICAgbmV3U2VsZWN0ID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZihuZXdTZWxlY3QubG5nIDw9IHNlbGVjdGVkLmxuZyl7XG4gICAgICBsZXQgbWluPXRoaXMubWFya2VyWzBdXG4gICAgICB0aGlzLm1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBpZihlbGVtZW50LmxuZyA8IG1pbi5sbmcpe1xuICAgICAgICAgIG1pbiA9IGVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkID0gbWluLmlkO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5uYXZpZ2F0ZUlkPW5ld1NlbGVjdC5pZFxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZmluZEZpcnN0Qm90dG9tRWxlbWVudCgpe1xuICAgIGxldCBzZWxlY3RlZCA9IHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZF07XG4gICAgbGV0IG5ld1NlbGVjdCA9IHRoaXMubWFya2VyW3RoaXMubmF2aWdhdGVJZD09MD8xOjBdO1xuICAgIHRoaXMubWFya2VyLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBpZihlbGVtZW50IT1zZWxlY3RlZCAmJiBlbGVtZW50LmxhdCA8IHNlbGVjdGVkLmxhdCAmJiAoZWxlbWVudC5sYXQgPiBuZXdTZWxlY3QubGF0IHx8IG5ld1NlbGVjdC5sYXQgPiBzZWxlY3RlZC5sYXQpKXtcbiAgICAgICAgbmV3U2VsZWN0ID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZihuZXdTZWxlY3QubGF0ID49IHNlbGVjdGVkLmxhdCl7XG4gICAgICBsZXQgbWluPXRoaXMubWFya2VyWzBdXG4gICAgICB0aGlzLm1hcmtlci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBcbiAgICAgICAgaWYoZWxlbWVudC5sYXQgPiBtaW4ubGF0KXtcbiAgICAgICAgICBtaW4gPSBlbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHRoaXMubmF2aWdhdGVJZCA9IG1pbi5pZDtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMubmF2aWdhdGVJZD1uZXdTZWxlY3QuaWRcbiAgICB9XG4gIH1cbiAgICBcbiAgcHJpdmF0ZSBmaW5kRmlyc3RUb3BFbGVtZW50KCl7XG4gICAgbGV0IHNlbGVjdGVkID0gdGhpcy5tYXJrZXJbdGhpcy5uYXZpZ2F0ZUlkXTtcbiAgICBsZXQgbmV3U2VsZWN0ID0gdGhpcy5tYXJrZXJbdGhpcy5uYXZpZ2F0ZUlkPT0wPzE6MF07XG4gICAgdGhpcy5tYXJrZXIuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGlmKGVsZW1lbnQhPXNlbGVjdGVkICYmIGVsZW1lbnQubGF0ID4gc2VsZWN0ZWQubGF0ICYmIChlbGVtZW50LmxhdCA8IG5ld1NlbGVjdC5sYXQgfHwgbmV3U2VsZWN0LmxhdCA8IHNlbGVjdGVkLmxhdCkpe1xuICAgICAgICBuZXdTZWxlY3QgPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmKG5ld1NlbGVjdC5sYXQgPD0gc2VsZWN0ZWQubGF0KXtcbiAgICAgIGxldCBtaW49dGhpcy5tYXJrZXJbMF1cbiAgICAgIHRoaXMubWFya2VyLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgIGlmKGVsZW1lbnQubGF0IDwgbWluLmxhdCl7XG4gICAgICAgICAgbWluID0gZWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQgPSBtaW4uaWQ7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLm5hdmlnYXRlSWQ9bmV3U2VsZWN0LmlkXG4gICAgfVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKiBzZXQgcG9zaXRpb24sIG1vdmUgYW5kIHpvb20gZnVuY3Rpb25zICoqKioqKioqKioqKiovXG5cbiAgLy8gc2V0IG5ldyBjb29yZGluYXRlcyBhbmQgaGFuZGxlIHpvb20gXG4gIHByaXZhdGUgc2V0UG9zaXRpb24oKTogdm9pZCB7XG4gICAgbGV0IGNvb3JkID0gdGhpcy5tYXAuZ2V0Q2VudGVyKCk7XG4gICAgdGhpcy5tYXBMYXQgPSBjb29yZC5sYXQ7XG4gICAgdGhpcy5tYXBMbmcgPSBjb29yZC5sbmc7XG4gICAgdGhpcy5tYXBab29tID0gdGhpcy5tYXAuZ2V0Wm9vbSgpO1xuICAgIC8vIGNhbGN1bCBuZXcgbW92ZSBzaXplXG4gICAgdGhpcy5zZXRNb3ZlU2hpZnQoKTtcbiAgfVxuXG4gIC8vIGNhbGN1bCBuZXcgY29vcmRpbmF0ZXNcbiAgcHJpdmF0ZSBtb3ZlTWFwKGxhdCwgbG5nKTogdm9pZCB7XG4gICAgdGhpcy5tYXBMYXQgKz0gbGF0ICogdGhpcy5tb3ZlU2hpZnQ7XG4gICAgdGhpcy5tYXBMbmcgKz0gbG5nICogdGhpcy5tb3ZlU2hpZnQ7XG4gICAgdGhpcy5tYXAuc2V0VmlldyhbdGhpcy5tYXBMYXQsIHRoaXMubWFwTG5nXSwgdGhpcy5tYXBab29tKTtcbiAgfVxuXG4gIC8vIHVwZGF0ZSB6b29tXG4gIHByaXZhdGUgem9vbU1hcCh6b29tKTogdm9pZCB7XG4gICAgdGhpcy5tYXBab29tICs9IHpvb207XG4gICAgdGhpcy5tYXAuc2V0Wm9vbSh0aGlzLm1hcFpvb20pO1xuICB9XG5cbiAgLy8gYWx0ZXIgbW92ZSBwYWRkaW5nXG4gIHNldE1vdmVTaGlmdCgpIHtcbiAgICB0aGlzLm1vdmVTaGlmdCA9IDgwO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5tYXBab29tOyBpKyspIHtcbiAgICAgIHRoaXMubW92ZVNoaWZ0IC89IDI7XG4gICAgfVxuICB9XG5cbiAgLyoqKioqKioqKioqKioqKiBzZWFyY2ggaW5wdXQgZnVuY3Rpb25zICoqKioqKioqKioqKiovXG5cbiAgLy8gc2V0IGlucHV0IGZvY3VzIG9yIGJsdXJcbiAgaW5pdElucHV0KCkge1xuICAgIC8vIHNlbGVjdCBzZWFyY2ggaW5wdXQgYm94XG4gICAgdGhpcy5zZWFyY2hJbnB1dCA9IHRoaXMuZWxlbS5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICBcIi5sZWFmbGV0LWNvbnRyb2wtZ2VvY29kZXItZm9ybSBpbnB1dFwiXG4gICAgKTtcbiAgICB0aGlzLnNlYXJjaEJhciA9IHRoaXMuZWxlbS5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICBcIi5sZWFmbGV0LWJhclwiXG4gICAgKTtcbiAgICB0aGlzLnNldEZvY3VzT3V0KCk7XG4gIH1cbiAgc2V0Rm9jdXMoKSB7XG4gICAgXG4gICAgdGhpcy5zZWFyY2hCYXIuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICB0aGlzLnNlYXJjaElucHV0LmZvY3VzKCk7XG4gICAgdGhpcy5zZWFyY2hJbnB1dEZvY3VzZWQgPSB0cnVlO1xuICB9XG4gIHNldEZvY3VzT3V0KCkge1xuICAgIHRoaXMuc2VhcmNoSW5wdXQuYmx1cigpO1xuICAgIHRoaXMuc2VhcmNoQmFyLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICB0aGlzLnNlYXJjaElucHV0Rm9jdXNlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zZXRQb3NpdGlvbigpO1xuICB9XG59XG4iLCI8ZGl2IGNsYXNzPVwibWFwLWNvbnRhaW5lclwiPlxuICAgIDxpIGNsYXNzPVwiaWNvbiB7e2hhbmRsZUljb259fVwiPjwvaT5cbiAgICA8ZGl2IGlkPVwibWFwXCI+PC9kaXY+XG48L2Rpdj5cbjxkaXYgY2xhc3M9XCJtZW51LWNvbnRhaW5lclwiIGNsYXNzPVwie3tkaXNwbGF5TWVudX19XCI+XG4gICAgPGRpdiBjbGFzcz1cIm1lbnUtYm94XCI+XG4gICAgICAgIDxpIGNsYXNzPVwiaWNvbiBzZWFyY2gge3soY2hvaXNlTWVudT09MD8nc2VsZWN0ZWQnOicnKX19XCI+PC9pPlxuICAgICAgICA8aSBjbGFzcz1cImljb24ge3toYW5kbGVNZW51SWNvbn19IHt7KGNob2lzZU1lbnU9PTE/J3NlbGVjdGVkJzonJyl9fVwiPjwvaT5cbiAgICAgICAgPGkgY2xhc3M9XCJpY29uIG5hdmlnYXRpb24ge3soY2hvaXNlTWVudT09Mj8nc2VsZWN0ZWQnOicnKX19XCI+PC9pPlxuICAgICAgICA8aSBjbGFzcz1cImljb24gbG9nb3V0IHt7KGNob2lzZU1lbnU9PTM/J3NlbGVjdGVkJzonJyl9fVwiPjwvaT5cbiAgICA8L2Rpdj4gIFxuPC9kaXY+Il19