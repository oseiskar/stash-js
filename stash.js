
// actions
function doStash( coords, selectedMode ) {

    if (selectedMode === undefined) selectedMode = window.lastSelected;
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
        window.lastSelected = selected;
        doStash( coords, selected );
    } );
    
    formGroup.append(dropdown);
    container.append(formGroup);
    
    container.append( buildLinkButton( {
        text: "Try stash",
        href: buildQueryString( {code: code} )
    }, 'btn-success') );
     
    if ($('#preview-frame-box').is(':hidden')) {
        container.append(buildButton( 'Preview', 'btn-info preview-button', function() {
            showPreview( coords, selectedMode );
            $('.preview-button').hide();
        }));
    }
    
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
    if ($('#preview-frame-box').is(':visible')) {
        showPreview( coords, selectedMode );
    }
}

function hidePreview() {
    var box = $('#preview-frame-box');
    box.html('');
    box.hide();
    $('.preview-button').show();
}

function showPreview( coords, selectedMode ) {
    
    var container = $('#preview-frame-box');
    container.show();
    
    var codeActual = encode( $.extend({}, coords, {mode: selectedMode}) );
    var codeDebug = encode( $.extend({}, coords, {mode: 'bothOnMap'}) );
    
    container.html('');
    
    container.append( buildButton( 'Hide preview', '', hidePreview ) );
    
    container.append($('<b/>', { text: 'Preview' } ));
    container.append($('<iframe/>', {
        width: '100%',
        height: '350px',
        seamless: true,
        src: buildQueryString( {code: codeActual} )
    }));
    
    if (codeActual != codeDebug) {
        container.append($('<b/>', { text: 'Debug' } ));
        container.append($('<iframe/>', {
            width: '100%',
            height: '400px',
            seamless: true,
            src: buildQueryString( {code: codeDebug} )
        }));
    }
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
        
    stashButton.click( showStashBox );
    
    container.append(stashButton);
    var resultBox = $('<div/>', {id: 'result-box'});
    container.append(resultBox);
    resultBox.append(buildLoadingIndicator());
    
    getLocation( function (loc) {
        renderNewStash( loc.coords );
    } );
    
    $('#stash-box').hide();
    $('#preview-frame-box').hide();
}

function showStashBox() {
    $('#stash-box').show();
    $('#stash-button').hide();
}

function renderNewStash( coords ) {

    var previewBox = $('#result-box');
    previewBox.html('');
    
    var btnGroup = $('<div/>', {'class': 'btn-group btn-group-justified'} );
    
    var leftBtnGroup = $('<div/>', {'class': 'btn-group'} );
    leftBtnGroup.append(buildButton( 'Refresh location', 'btn-default', function() {
        $('#preview-frame-box').html('');
        getLocation( function (loc) { renderNewStash( loc.coords ); } );
    }));
    btnGroup.append(leftBtnGroup);
    previewBox.append(btnGroup);
    
    var coordBox = $('<div/>');
    var mapBox = $('<div/>');
    coordBox.append(buildEditableCoordinateBox(coords, true));
    mapBox.append(buildGoogleMap( coords ));
    previewBox.append(coordBox);
    previewBox.append(mapBox);
    
    var rightBtnGroup = $('<div/>', {'class': 'btn-group'} );
    rightBtnGroup.append(buildButton( 'Watch location', 'btn-warning', function() {
        $('#preview-frame-box').html('');
        $('#stash-box').hide();
        $('#stash-button').hide();
        var watchId = watchLocation( function (loc) {
            coordBox.html('');
            coordBox.append(buildEditableCoordinateBox(loc.coords, false));
        });
        leftBtnGroup.html(buildButton( 'Show on map', 'btn-default', function() {
            mapBox.html('');
            mapBox.append(buildGoogleMap( window.lastWatchCoords ));
        } ));
        rightBtnGroup.html(buildButton( 'Stop watch', 'btn-primary', function() {
            stopWatching( watchId );
            renderNewStash( window.lastWatchCoords );
            $('#stash-box').show();
        } ));
    }));
    btnGroup.append(rightBtnGroup);
    
    doStash(coords);
}

function buildLoadingIndicator() {
    var container = $('<div/>', {'class': 'loading-outer'});
    container.append( $('<div/>', {
        'class': 'loading-inner',
        text: 'Loading...' }) );
    return container;
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

function buildEditableCoordinateBox( coords, editable ) {

    var coordinateBox = $('<div/>',  {
        'id': 'preview-coordinate-box',
        'class': 'panel panel-default coordinate-box'
    });
    var innerCoordinateBox = $('<div/>', {
        'class': 'panel-body',
    });
    innerCoordinateBox.append($('<p/>', {text: 'Latitude: '+coords.latitude}));
    innerCoordinateBox.append($('<p/>', {text: 'Longitude: '+coords.longitude}));
    
    if (editable) {
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
                showStashBox();
            }));
            box.append(innerBox);
        });
            
        coordinateBox.append( editButton );
    }
    coordinateBox.append(innerCoordinateBox);

    return coordinateBox;
}

function buildGoogleMap( params ) {

    var lat = params.latitude;
    var long = params.longitude;
    var markers = [ "color:red|"+lat + "," + long ];
    if (params.extraMarker) {
        var m = params.extraMarker
        markers.push( "color:"+m.color+"|"+m.latitude+","+m.longitude );
    }

    queryParams = {
        center: lat + ',' + long,
        markers: markers,
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
    window.watchId = navigator.geolocation.watchPosition( function ( loc ) {
        window.lastWatchCoords = loc.coords;
        callback(loc);
    }, showGeoError, opts );
    return window.watchId;
}


function stopWatching( watchId ) {
    if (watchId === undefined) watchId = window.watchId;
    navigator.geolocation.clearWatch(watchId);
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
        if ($.isArray(value)) {
            for (var i in value)
                arr.push( param + '=' + encodeURIComponent(value[i]) );
        }
        else
            arr.push( param + "=" + encodeURIComponent(value) );
    }
    if (arr.length == 0) return '';
    return '?'+arr.join('&');
}

function urlWithoutQueryString() {
    var url = window.location;
    return url.protocol + "//" + url.host + url.pathname
}
