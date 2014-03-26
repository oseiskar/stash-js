
// helpers
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

function debugWithBothOnMap( elem, stashedCoords, currentCoords ) {
    var d = $('<div/>');
    window.stashViews.bothOnMap.renderer( d, stashedCoords, currentCoords )
    d.appendTo(elem);
}

// views
window.stashViews = {
  debug: {
    name: "Debug",
    renderer: function ( elem, stashedCoords, currentCoords ) {
        
        elem.html('');
        
        elem.append('<b>Current location</b>');
        elem.append( buildCoordinateBox( currentCoords ) );
        
        elem.append('<b>Stashed location</b>');
        elem.append( buildCoordinateBox( stashedCoords ) );
    }
  },
  
  cardinal: {
    name: "Cardinal direction",
    renderer: function ( elem, stashedCoords, currentCoords ) {
    
        elem.html('');
        
        // won't work on strange places (on the 180 meridian)
        var dlat = stashedCoords.latitude - currentCoords.latitude;
        var dlong = stashedCoords.longitude - currentCoords.longitude;
        
        var adlat = Math.abs(dlat), adlong = Math.abs(dlong);
        console.log(dlat);
        console.log(dlong);
        console.log(adlat);
        console.log(adlong);
        
        dir = 'nowhere';
        
        if (adlat > adlong) {
            // greater deviation in north-south vs west-east
            if (dlat > 0) dir = 'north';
            else dir = 'south';
        }
        else {
            if (dlong > 0) dir = 'east';
            else dir = 'west';
        }
        
        command = "walk "+dir;
        
        elem.append($('<div/>', {
            'class': 'command',
            text: command }));
            
        //debugWithBothOnMap( elem, stashedCoords, currentCoords );
    }
  },
  
  bothOnMap: {
    name: "Show on map",
    renderer: function ( elem, stashed, current ) {
    
        elem.html('');
        
        elem.append( buildGoogleMap(
            $.extend({}, stashed, {
                extraMarker: {
                    color: 'blue',
                    latitude: current.latitude,
                    longitude: current.longitude
                }
            }))
        );
        
    }
  }
};

window.defaultStashView = 'debug';
