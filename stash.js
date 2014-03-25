

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
        text: "Try stash"
    }) );
    
    var form = $('<form/>', {
        action: "http://tinyurl.com/create.php",
        method: "post",
        id: 'tinyurl-form' });
    var input = $('<textarea/>', {
        id: 'tinyurl-input',
        cols: 60,
        name: 'url' });
    input.val( urlWithoutQueryString() + buildQueryString( {code: code} ) );
    form.append( input );
    form.append('<br/>');
    form.append( $('<input/>', {
        type: 'submit',
        name: 'submit',
        value: "Submit to tinyurl.com" }));
    
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
        value: "stash" });
        
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

    return $('<img/>', {
        src: "http://maps.googleapis.com/maps/api/staticmap"+buildQueryString(queryParams)
    });
}

function buildCoordinateBox( params ) {
    
    lat = params.latitude;
    long = params.longitude;
    
    var d = $('<div/>');
    d.append($('<p/>', {text: 'Latitude: '+lat}));
    d.append($('<p/>', {text: 'Longitude: '+long}));
    return d;
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
    navigator.geolocation.watchPosition(callback, showGeoError);
}

function getLocation( callback )
{
    navigator.geolocation.getCurrentPosition(callback, showGeoError);
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
