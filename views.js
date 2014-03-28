
// helpers
function buildCoordinateBox( params ) {
    
    lat = params.latitude;
    long = params.longitude;
    
    return $('<div/>', {'class': 'panel panel-default coordinate-box'} ).append(
        $('<div/>',  {'class': 'panel-body'}).append(
            $('<p/>', {text: 'Latitude: '+lat} )
        ).append(
            $('<p/>', {text: 'Longitude: '+long})
        )
    );
}

function buildGoogleMapWithTwoPoints( center, other ) {
    return buildGoogleMap(
        $.extend({}, center, {
            extraMarker: {
                color: 'blue',
                latitude: other.latitude,
                longitude: other.longitude
            }
        })
    );
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
  
  distonly: { 
    name: "Distance only",
    renderer: function ( elem, stashed, current ) {
        elem.html('');
        
        var distance = getDistanceBetween( stashed, current );
        distance = Math.round(distance).toString() + " m";
        
        elem.append($('<div/>', {'class': 'command', text: distance }));
    }
  },
  
  headonly: {
    name: "Heading only",
    renderer: function ( elem, stashed, current ) {
        elem.html('');
        
        var head = getHeading( current, stashed );
        head = Math.round(head).toString();
        
        elem.append($('<div/>', { 'class': 'command', text: head }));
    }
  },
  
  disthead: {
    name: "Distance and heading",
    renderer: function ( elem, stashed, current ) {
        elem.html('');
        
        var dist = getDistanceBetween( stashed, current );
        var head = getHeading( current, stashed );
        dist = Math.round(dist).toString() + ' m';
        head = Math.round(head).toString() + ' °';
        
        elem.append($('<div/>', {
            'class': 'command' }).append(
                $('<p/>', {text: dist})
            ).append(
                $('<p/>', {text: head})
            )
        )
    }
  },
  
  cardinal: {
    name: "Cardinal direction",
    renderer: function ( elem, stashedCoords, currentCoords ) {
    
        elem.html('');
        
        var dir = getCardinalDirection( currentCoords, stashedCoords );
        var command = "walk "+dir;
        
        elem.append($('<div/>', {'class': 'command', text: command }));
    }
  },
  
  binheading: {
    name: "Binary heading",
    renderer: function ( elem, stashed, current ) {
    
        elem.html('');
        var head = Math.round(getHeading( current, stashed )).toString(2);
        elem.append($('<div/>', {'class': 'command', text: head }));
    }
  },
  
  bothOnMap: {
    name: "Show on map",
    initializer: function ( elem, stashed, current ) {
    
        elem.append(
            $('<div/>', {id: 'map-box'} ).append(
                buildGoogleMapWithTwoPoints( stashed, current )
            )
        );
        elem.append( $('<div/>', {id: 'coord-box'} ) );
        
    },
    renderer: function ( elem, stashed, current ) {
    
        $('#coord-box').append( 
            buildButton( 'Refresh map', 'btn-primary', function () {
                $('#map-box').html(
                    buildGoogleMapWithTwoPoints( stashed, current )
                )
            })
        ).append(
            buildCoordinateBox(current)
        );
    }
  }
};

window.defaultStashView = 'bothOnMap';


// coordinate helpers
function degToRad( deg ) { return deg / 180.0 * Math.PI; }
function radToDeg( rad ) { return rad / Math.PI * 180.0; }
function fmod( x, mod ) {
    while (x < 0.0) x += mod;
    while (x >= mod) x -= mod;
    return x;
}

function vecMult( v, scalar ) {
    return { x: v.x*scalar, y: v.y*scalar, z: v.z*scalar };
}

function vecPlus( a, b ) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vecMinus( a, b ) { return vecPlus(a, vecMult(b, -1.0)); }
function vecDot( a, b ) { return a.x*b.x + a.y*b.y + a.z*b.z; }
function vecLength( v ) { return Math.sqrt(vecDot(v,v)); }
function vecDirection( v ) { return vecMult( v, 1.0/vecLength( v ) ); }
function vecCross( v1, v2 ) {
    return {
        x:   ( (v1.y * v2.z) - (v1.z * v2.y) ),
        y: - ( (v1.x * v2.z) - (v1.z * v2.x) ),
        z:   ( (v1.x * v2.y) - (v1.y * v2.x) )
    };
}

function vecProjectToPlane( vec, planeNormal ) {
    var unitNormal = vecDirection( planeNormal );
    return vecMinus( vec, vecMult( unitNormal, vecDot( vec, unitNormal ) ) );
}

function getGlobalXYZ( coords ) {
    lat = degToRad(coords.latitude);
    long = degToRad(coords.longitude);
    
    var R = 6371000.0;
    
    return {
        x: Math.cos(long)*Math.cos(lat) * R,
        y: Math.sin(long)*Math.cos(lat) * R,
        z: Math.sin(lat) * R };
}

function getDistanceBetween( a, b ) {
    return vecLength( vecMinus( getGlobalXYZ(b), getGlobalXYZ(a) ) );
}

function getCardinalDirection( from, to ) {
        // won't work on strange places (on the 180 meridian)
        var dlat = to.latitude - from.latitude;
        var dlong = to.longitude - from.longitude;
        
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
        return dir;
}

function getHeading( from, to ) {

    var local = getLocalCoordinateSystem( from );
    
    var dirVec = vecMinus( getGlobalXYZ( to ), local.pos );
    var tangent = vecProjectToPlane( dirVec, local.up );
    
    var distWE = vecDot( tangent, local.east );
    var distSN = vecDot( tangent, local.north );
    var dirRad = Math.atan2( distSN, distWE );
    
    return fmod( -(radToDeg( dirRad ) - 90), 360);
}

function getLocalCoordinateSystem( coords ) {
    
    var pos = getGlobalXYZ( coords );
    var northPole = getGlobalXYZ( { latitude: 90, longitude: 0 } );
    var toNorthPole = vecMinus( northPole, pos );
    
    var east = vecDirection( vecCross( toNorthPole, pos ) );
    var north = vecDirection( vecCross( pos, east ) );
    var up = vecDirection( pos );
    
    return {
        pos: pos,
        north: north,
        east: east,
        up: up
    };
}
