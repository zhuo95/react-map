import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {Route, withRouter} from 'react-router-dom';
import './Map.css';
import Marker from '../Marker/Marker.js';
import InfoWindow from '../InfoWindow/InfoWindow.js';
import Event from '../Event.js';
import sampleMarkers from '../sample-markers.js';
import axios from "../../base.js";
import Loading from "../Loading/Loading.js";
import MarkerClusterer from '../../markerclusterer.js';
import currentLocationIcon from '../../images/currentLocation.png';
import markerClusterIcon from '../../images/markerCluster.png';

const google = window.google;

class Map extends Component {

    constructor(props) {
        super(props);
        this.state = {
            currentCenter: {
                lat: null,
                lng: null
            },
            map: null,
            displayEvent: false,
            markers: [],
            defaultEventPlace: {
                defaultPlace: null,
                defaultGeoLocation: {
                    lat: null,
                    lng: null
                }
            },
            markerCluster: null
        };

        this.searchRef = React.createRef();
    }

    componentDidMount() {
        // if(google) {
            navigator.geolocation.getCurrentPosition((position) => {
                this.setState({
                    currentCenter: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }, this.initMap);
            });
            this.searchPlace();
        // }
    }

    initMap = () => {

            const node = ReactDOM.findDOMNode(this.refs.map);
            const currentCenter = this.state.currentCenter;
            const map = new google.maps.Map(node, {
                zoom: 16,
                center: currentCenter
            });

            this.setState({map: map});

            const marker = new google.maps.Marker({position: currentCenter, map: map, icon: currentLocationIcon, animation: google.maps.Animation.DROP});

            this.getMarkers(currentCenter);

            map.addListener("dragend", () => {
                const center = {
                    lat: map.getCenter().lat(),
                    lng: map.getCenter().lng()
                }
                if(Math.abs(center.lat - this.state.currentCenter.lat) > 0.04 || Math.abs(center.lng - this.state.currentCenter.lng) > 0.04) {
                    this.setState({ currentCenter: center }, this.getMarkers(center));
                    this.setDefaultEventPlace(center);
                }
            });

            this.setDefaultEventPlace(this.state.currentCenter);

    }

    toggleEvent = (event) => {
        const display = !this.state.displayEvent;
        this.setState({displayEvent: display});
    }

    changeCenter = (center) => {
        this.state.map.setCenter(center);
        this.getMarkers(center);
    }

    getMarkers = (center) => {
        axios.get(`/event?longitude=${center.lng}&latitude=${center.lat}`
        )
        .then(res => {
            console.log("markers", res.data);
            if(res.data.status === 0) {
                this.clearMarkers();
                this.setState({markers: res.data.data}, this.initMarkerCluster);
            } else {
                alert(res.data.msg);
            }
        })
    }

    clearMarkers = () => {
        this.setState({ markers: null });
    }

    initMarkerCluster = () => {
        const clusterStyles = [
          {
            textColor: 'white',
            url: markerClusterIcon,
            height: 60,
            width: 60
          }
        ];
        const Options = {
            styles: clusterStyles
        };
        const markerCluster = new MarkerClusterer(this.state.map, [], Options);
        // const markerCluster = new MarkerClusterer(this.state.map, [], {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
        this.setState({markerCluster: markerCluster});
    }

    pushIntoMarkerCluster = (marker) => {
        this.state.markerCluster.addMarker(marker);
        // console.log("cluster", this.state.markerCluster);
    }

    searchPlace = () => {
        const searchInput = ReactDOM.findDOMNode(this.searchRef.current);
        if(google) {
            const autocomplete = new google.maps.places.Autocomplete(searchInput);
            autocomplete.addListener('place_changed', () => {
                this.fillInSearchAddress(autocomplete)
            });
        }
    }

    fillInSearchAddress = (autocomplete) => {
        const autoPlace = autocomplete.getPlace();
        const center = {
            lat: autoPlace.geometry.location.lat(),
            lng: autoPlace.geometry.location.lng()
        };
        
        this.changeCenter(center);
        this.setDefaultEventPlace(center);
    }

    setDefaultEventPlace = (geolocation) => {

        let place;

        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ 'location': geolocation}, (results, status) => {
            if(status === google.maps.GeocoderStatus.OK) {
                place = results[0].formatted_address;
                const newDefaultEventPlace = {
                    defaultPlace: place,
                    defaultGeoLocation: {
                        lat: geolocation.lat,
                        lng: geolocation.lng
                    }
                }

                this.setState({defaultEventPlace: newDefaultEventPlace});
            }
        });

    }

    handleUser = (event) => {
        if(this.props.user === null) {
            this.props.history.push(`/login`);
        } else {
            console.log("user", this.props.user);
        }
    }

    render() {

        return (
            <div>
                <div className="toggle-cta">
                    <nav className="navbar navbar-expand-lg navbar-light bg-light">
                      <a className="navbar-brand" href="/"><i className="fas fa-map-marker-alt"></i></a>
                      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                      </button>

                      <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav mr-auto">
                          <li className="nav-item">
                            <a className="nav-link" onClick={this.toggleEvent}>Publish</a>
                          </li>
                          <li className="nav-item">
                            <a className="nav-link" onClick={this.handleUser}>
                                {this.props.user === null?
                                    "LogIn"
                                    :
                                    this.props.user.username
                                }
                            </a>
                          </li>
                        </ul>
                        <form className="form-inline my-2 my-lg-0">
                          <input className="form-control mr-sm-2" ref={this.searchRef} type="search" placeholder="Search" aria-label="Search"/>
                          <a className="navbar-brand" href="/"><i className="fas fa-search"></i></a>
                        </form>
                      </div>
                    </nav>
                    {this.state.displayEvent === true ?
                        <Event 
                            map={this.state.map}
                            changeCenter={this.changeCenter}
                            toggleEvent={this.toggleEvent}
                            markers={this.state.markers}
                            defaultEventPlace={this.state.defaultEventPlace}
                        />
                        :""
                    }
                </div>

                <div ref="map" className="map">
                    <Loading />
                    {this.state.markers !== null?
                        Object.keys(this.state.markers).map(key => (
                            <Marker 
                                key={key}
                                map={this.state.map}
                                marker={this.state.markers[key]}
                                pushIntoMarkerCluster={this.pushIntoMarkerCluster}
                            />
                        ))
                        :""
                    }
                </div>

            </div>
        );
    }

}

export default withRouter(Map);