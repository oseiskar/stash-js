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
    
  destonly: {
    name: "Destination only",
    renderer: function ( elem, stashedCoords, currentCoords ) {
        
        elem.html('');
        
        elem.append('<b>Stashed location</b>');
        elem.append( buildCoordinateBox( stashedCoords ) );
    }
  }
};

window.defaultStashView = 'debug';
