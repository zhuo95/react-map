import React, { Component } from 'react';
import './EditEvent.css';
import ReactDOM from 'react-dom';
import axios from "../../base.js";
import Qs from 'qs';
import markerIcon from '../../images/marker.png';

const google = window.google;

class EditEvent extends Component {

    constructor(props) {
        super(props);

        this.state = {
            geoLocation: {
                lat: this.props.event.latitude,
                lng: this.props.event.longitude
            },
            newMarker: null
        };

        this.titleRef = React.createRef();
        this.placeRef = React.createRef();
        this.durationRef = React.createRef();
        this.timeRef = React.createRef();
        this.descriptionRef = React.createRef();
    }

    componentDidMount() {
        this.initEvent(this.props.event);
    }

    componentWillUnmount() {
        if(this.state.newMarker !== null) {
            this.state.newMarker.setMap(null);
        }
    }

    initEvent = (event) => {

        const titleInput = ReactDOM.findDOMNode(this.titleRef.current);
        const placeInput = ReactDOM.findDOMNode(this.placeRef.current);
        const durationInput = ReactDOM.findDOMNode(this.durationRef.current);
        const timeInput = ReactDOM.findDOMNode(this.timeRef.current);
        const descriptionInput = ReactDOM.findDOMNode(this.descriptionRef.current);

        titleInput.value = event.title;
        placeInput.value = event.address;
        if(event.expireDays > 3) {
            durationInput.checked = true;
        }
        timeInput.value = event.date;
        descriptionInput.value = event.description;

        if(google) {
            const autocomplete = new google.maps.places.Autocomplete(placeInput);
            autocomplete.addListener('place_changed', () => {
                this.fillInAddress(autocomplete)
            });
        }
    }

    fillInAddress = (autocomplete) => {
        if(this.state.newMarker !== null) {
            this.state.newMarker.setMap(null);
        }
        console.log(autocomplete);
        const autoPlace = autocomplete.getPlace();
        const geoLocation = {
            lat: autoPlace.geometry.location.lat(),
            lng: autoPlace.geometry.location.lng()
        };
        this.setState({ geoLocation: geoLocation });
        this.props.changeCenter(this.state.geoLocation);
        const marker = new google.maps.Marker({position: this.state.geoLocation, map: this.props.map});
        this.setState({newMarker: marker}, () => {
          this.state.newMarker.setIcon(markerIcon);
          this.state.newMarker.setAnimation(google.maps.Animation.BOUNCE);
        });
    }

    handleSubmit = event => {
        event.preventDefault();

        if(this.state.newMarker !== null) {
            this.state.newMarker.setMap(null);
        }

        const title = this.titleRef.current.value;
        const address = this.placeRef.current.value;
        const category = 2;
        const longitude = this.state.geoLocation.lng.toFixed(3);
        const latitude = this.state.geoLocation.lat.toFixed(3);
        const description = this.descriptionRef.current.value;
        const date = this.timeRef.current.value;

        const duration = this.durationRef.current.checked;
        let expireDays = 3;
        //Long-term
        if(duration === true) {
            expireDays = 365;
        }

        const placeId = this.props.event.placeId;

        axios.patch(`/event/${this.props.event.id}`, 
                Qs.stringify({ 
                    title,
                    address, 
                    category,
                    longitude,
                    latitude,
                    description,
                    date,
                    expireDays,
                    placeId
                }),
        )
        .then(res => {
            console.log(res.data);
            if(res.data.status === 0) {
                this.props.changeCenter(this.state.geoLocation);
                this.props.backToUser();
            } else {
                alert(res.data.msg);
            }
        })
        
    }

    render() {
        if(this.props.event !== null) {
            return (
                <div className="container event">
                    <i className="close fas fa-chevron-left" onClick={this.props.backToUser}></i>
                    <div className="event-form">
                        <form onSubmit={this.handleSubmit}>
                          <div className="form-group">
                            <label htmlFor="title">Event Title</label>
                            <input 
                                required
                                name="title"
                                type="text" 
                                className="form-control" 
                                id="title" 
                                ref={this.titleRef}
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor="place">Place</label>
                            <input required name="place" type="text" className="form-control" id="place" ref={this.placeRef}/>
                          </div>
                          <div className="form-group form-check">
                            <input className="form-check-input" type="checkbox" id="duration" name="duration" ref={this.durationRef}/>
                            <label className="form-check-label" htmlFor="duration">
                            Long-term
                            </label>
                          </div>
                          <div className="form-group">
                            <label htmlFor="time">Time</label>
                            <input required name="time" type="datetime-local" className="form-control" id="time" ref={this.timeRef}/>
                          </div>
                          <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <input name="description" type="text" className="form-control" id="description" ref={this.descriptionRef} />
                          </div>
                          <button className="btn btn-primary btn-block" type="submit">Save</button>
                          <button className="btn btn-primary btn-block" onClick={this.props.deleteEvent}>Delete</button>
                        </form>

                    </div>
                </div>
            );
        }
        return null;
    }
}

export default EditEvent;