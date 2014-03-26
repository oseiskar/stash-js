
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
    }
  }
};

window.defaultStashView = 'debug';
