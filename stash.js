

// actions

function doStash( location ) {

    var container = $('#result-box');
    var coords = location.coords;
    container.html(buildCoordinateBox( coords ));
    container.append(buildGoogleMap( coords ));
    
    code = encode( { latitude: coords.latitude, longitude: coords.longitude } );
    
    var linkBox = $('<div/>');
    
    container.append(linkBox);
    container.append( buildCodeForm( code ) );
}

function buildCodeForm( code ) {
        
    var container = $('<div/>');
    
    container.append( $('<a/>', {
        href: buildQueryString( {code: code} ),
        'class': 'btn btn-primary btn-block',
        role: "button",
        text: "Try stash"
    }) );
    
    var form = $('<form/>', {
        action: "http://tinyurl.com/create.php",
        method: "post",
        id: 'tinyurl-form' });
    var formGroup = $('<div/>', {'class': 'form-group'});
        
    var input = $('<textarea/>', {
        id: 'tinyurl-input',
        'class': 'form-control',
        rows: 3,
        name: 'url' });
    input.val( urlWithoutQueryString() + buildQueryString( {code: code} ) );
    formGroup.append( input );
    form.append(formGroup);
    
    formGroup = $('<div/>', {'class': 'form-group'});
    formGroup.append( $('<input/>', {
        type: 'submit',
        name: 'submit',
        'class': 'btn btn-danger',
        value: "Submit to tinyurl.com" }));
    form.append(formGroup);
    
    container.append(form);
    return container;
}

// views
function beginStashed( stashedData ) {
    watchLocation( function (loc) { renderStashed( stashedData, loc ); } );
}

function renderNewStash() {

    var container = $('#content-box');
    container.html('');
    
    var stashButton = $('<input/>', {
        type: 'button',
        'class': 'btn btn-primary btn-block',
        value: "Stash" });
        
    stashButton.click( function() { getLocation(doStash) } );
    container.append(stashButton);
    
    container.append($('<div/>', { id: 'result-box' }));
}

function renderStashed( stashedData, currentPosition ) {
    var coords = currentPosition.coords;
    
    var container = $('#content-box');
    container.html('');
    
    container.append('<b>Current location</b>');
    container.append( buildCoordinateBox( coords ) );
    
    container.append('<b>Stashed location</b>');
    container.append( buildCoordinateBox( stashedData ) );
}

function buildGoogleMap( params ) {

    lat = params.latitude;
    long = params.longitude;

    queryParams = {
        center: lat + ',' + long,
        markers: "color:red|"+lat + "," + long,
        zoom: "15",
        size: "300x300",
        sensor: "false"
    };

    var image = $('<img/>', {
        src: "http://maps.googleapis.com/maps/api/staticmap"+buildQueryString(queryParams)
    });
    
    var container = $('<div/>', {'class': 'img-container'});
    container.append(image);
    return container;
}

function buildCoordinateBox( params ) {
    
    lat = params.latitude;
    long = params.longitude;
    
    var panel = $('<div/>',  {'class': 'panel panel-default coordinate-box'} );
    var d = $('<div/>',  {'class': 'panel-body'} );
    d.append($('<p/>', {text: 'Latitude: '+lat}));
    d.append($('<p/>', {text: 'Longitude: '+long}));
    panel.append(d);
    return panel;
}

// useful helpers
function encode( obj ) { return btoa(JSON.stringify(obj)); }

function decodeQuery( ) {
    var code = parseQueryString().code;
    if (code === undefined) return undefined;
    return JSON.parse(atob(code));
}

function watchLocation( callback )
{
    navigator.geolocation.watchPosition(callback, showGeoError, {enableHighAccuracy: true});
}

function getLocation( callback )
{
    navigator.geolocation.getCurrentPosition(callback, showGeoError, {enableHighAccuracy: true});
}

function showError( errorText ) {
    var x = $('#error-box');
    x.show();
    x.html(errorText);
}

function showGeoError(error)
{
    switch(error.code) 
    {
    case error.PERMISSION_DENIED:
      showError("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      showError("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      showError("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      showError("An unknown error occurred.");
      break;
    }
}

// stupid helpers
function parseQueryString() {
    var params = {};
    var qstring = window.location.search.split('?')[1];
    if (qstring === undefined) return params;
    qstring = qstring.split('/')[0];
    var strs = qstring.split('&');
    for (var i in strs) {
        var nameAndValue = strs[i].split('=');
        params[nameAndValue[0]] = decodeURIComponent(nameAndValue[1]);
    }
    return params;
}

function buildQueryString( obj ) {
    var arr = [];
    for (var param in obj) {
        var value = obj[param];
        arr.push( param + "=" + encodeURIComponent(value) );
    }
    if (arr.length == 0) return '';
    return '?'+arr.join('&');
}

function urlWithoutQueryString() {
    var url = window.location;
    return url.protocol + "//" + url.host + url.pathname
}
