
// actions
function doStash( coords, selectedMode ) {

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
        doStash( coords, selected );
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
        renderNewStash( loc.coords );
    } );
    
    $('#stash-box').hide();
}

function renderNewStash( coords ) {

    var previewBox = $('#result-box');
    previewBox.html('');
    
    previewBox.append(buildButton( 'Refresh', 'btn-default', function() {
        getLocation( function (loc) {
        renderNewStash( coords );
        } );
    }));
    
    previewBox.append(buildEditableCoordinateBox(coords));
    previewBox.append(buildGoogleMap( coords ));
    
    doStash(coords);
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

function buildEditableCoordinateBox( coords ) {

    var coordinateBox = $('<div/>',  {
        'id': 'preview-coordinate-box',
        'class': 'panel panel-default coordinate-box'
    });
    var innerCoordinateBox = $('<div/>', {
        'class': 'panel-body',
    });
    innerCoordinateBox.append($('<p/>', {text: 'Latitude: '+coords.latitude}));
    innerCoordinateBox.append($('<p/>', {text: 'Longitude: '+coords.longitude}));
    
    var editButton = $('<input/>', {
        type: 'button',
        'class': 'btn btn-default btn-xs pull-right',
        value: 'Edit' });
        
    editButton.click( function () {
        var box = $('#preview-coordinate-box');
        box.html('');
        
        var innerBox = $('<div/>', {
            'class': 'panel-body',
        });
        
        var buildInput = function ( id, label, value ) {
            var formGroup = $('<div/>', {'class': 'form-group'});
            formGroup.append($('<label/>', {text: label}));
            formGroup.append($('<input/>', {
                id: id,
                type: 'text',
                value: value,
                'class': 'form-control'
            }));
            return formGroup;
        };
        
        innerBox.append( buildInput( 'lat-edit', 'Latitude', coords.latitude) );
        innerBox.append( buildInput( 'long-edit', 'Longitude', coords.longitude) );
        innerBox.append( buildButton( 'Stash these', 'btn-info', function() {
            var la = $('#lat-edit').val();
            var lo = $('#long-edit').val();
            var newCoords = $.extend({}, coords, { latitude: la, longitude: lo });
            renderNewStash( newCoords );
        }));
        box.append(innerBox);
    });
        
    coordinateBox.append( editButton );
    coordinateBox.append(innerCoordinateBox);

    return coordinateBox;
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

commonGeoOptions = {
    enableHighAccuracy: true,
    timeout:60000
};


function watchLocation( callback )
{
    var opts = $.extend({}, commonGeoOptions, { maximumAge: 5000 });
    window.watchId = navigator.geolocation.watchPosition( callback, showGeoError, opts );
}


function stopWatching() {
    navigator.geolocation.clearWatch(window.watchId);
}

function getLocation( callback )
{
    navigator.geolocation.getCurrentPosition(callback, showGeoError, commonGeoOptions);
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

// coordinate helpers
/*function degToRad( deg ) {
    return deg / 180.0 * Math.PI;
}

function vecMult( v, scalar ) {
    return { x: v.x*scalar, y: v.y*scalar, z: v.z*scalar };
}

function vecPlus( a, b ) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function vecMinus( a, b ) { return vecPlus(a, vecMult(b, -1.0)); }
function vecDot( a, b ) { return a.x*b.x + a.y*b.y + a.z*b.z; }
function vecLength( v ) { return Math.sqrt(vecDot(v,v)); }
function vecDirection( v ) { return vecMult( v, 1.0/vecLength( v ) ); }

function getGlobalXYZ( coords ) {
    lat = degToRad(coords.latitude);
    long = degToRad(coords.longitude);
    
    var R = 6371000.0;
    
    return {
        x: Math.sin(long)*Math.cos(lat) * R,
        y: Math.cos(long)*Math.cos(lat) * R,
        z: Math.sin(lat) * R };
}

function getLocalCoordinateSystem( coords ) {
    
    var pos = getGlobalXYZ( coords );
    var northPole = getGlobalXYZ( { latitude: 90, longitude: 0 } );
    var toNorthPole = vecMinus( northPole, coords );
    return {
        north: vecDirection(toNorthPole) // TODO
    };
}*/
