
// actions
function doStash( location, selectedMode ) {

    var coords  = location.coords;
    if (selectedMode === undefined) selectedMode = window.defaultStashView;
    var container = $('#stash-box');
    
    container.html('');
    code = encode( $.extend({}, coords, {mode: selectedMode}) );
        
    container.append($('<a/>', {id: 'stash'}));
    
    var dropdown = $('<select/>', {'class': 'form-control', id: 'mode-selector'});
    
    var formGroup = $('<div/>', {'class': 'form-group'});
    formGroup.append($('<label/>', {text: 'Stash mode' }));
    
    for( var opt in window.stashViews ) {
        var name = window.stashViews[opt].name;
        $('<option/>', {value: opt, text: name}).appendTo(dropdown);
    }
    
    dropdown.val( selectedMode );
    
    dropdown.change( function () {
        var selected = $('#mode-selector').val();
        doStash( location, selected );
    } );
    
    formGroup.append(dropdown);
    container.append(formGroup);
    
    container.append( buildLinkButton( {
        text: "Try stash",
        href: buildQueryString( {code: code} )
        }, 'btn-success') );
    
    var form = $('<form/>', {
        action: "http://tinyurl.com/create.php",
        method: "post",
        id: 'tinyurl-form' });
    var formGroup = $('<div/>', {'class': 'form-group'});
        
    var input = $('<textarea/>', {
        id: 'tinyurl-input',
        'class': 'form-control',
        rows: 4,
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

    var mode = stashedData.mode;
    var view = window.stashViews[mode];
    if (view)
    {
        $('body').addClass('stashed');
        $('body').addClass(mode);
        
        watchLocation( function (loc) {
            view.renderer( $('#content-box'), stashedData, loc.coords );
        } );
    }
    else showError( "Did not recongize stash view" );
}

function beginNewStash() {
    
    var container = $('#content-box');
    container.html('');
    
    var stashButton = buildLinkButton(
        {text: 'Stash', href: '#stash', id: "stash-button"},
        'btn-primary' );
    stashButton.click( function () {
        $('#stash-box').show();
        $('#stash-button').hide();
    } );
    
    container.append(stashButton);
    container.append($('<div/>', {id: 'result-box'}));
    
    getLocation( function (loc) {
        renderNewStash( loc );
    } );
    
    $('#stash-box').hide();
}

function renderNewStash( location ) {

    var previewBox = $('#result-box');
    previewBox.html('');
    
    previewBox.append(buildButton( 'Refresh', 'btn-default', function() {
        getLocation( function (loc) {
        renderNewStash( loc );
        } );
    }));
    
    var coords = location.coords;
    
    previewBox.append(buildCoordinateBox( coords ));
    previewBox.append(buildGoogleMap( coords ));
    
    doStash(location);
}

function buildButton( text, classes, action ) {
    var button = $('<input/>', {
        type: 'button',
        'class': 'btn btn-block btn-and-space '+classes,
        value: text });
    button.click( action );
    return button;
}

function buildLinkButton( params, classes ) {
    return $('<a/>', $.extend({
        'class': 'btn btn-primary btn-block btn-and-space '+classes,
        role: "button",
    },params));
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
function encode( obj ) {
    return btoa(JSON.stringify( {la: obj.latitude, lo: obj.longitude, mo: obj.mode } ));
}

function decodeQuery( ) {
    var code = parseQueryString().code;
    if (code === undefined) return undefined;
    var obj = JSON.parse(atob(code));
    return { latitude: obj.la, longitude: obj.lo, mode: obj.mo };
}

function watchLocation( callback )
{
   window.watchId = navigator.geolocation.watchPosition(callback, showGeoError, {enableHighAccuracy: true});
}

function stopWatching() {
    navigator.geolocation.clearWatch(window.watchId);
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
