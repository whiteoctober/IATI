// Packs a set of circles around each other, given the radius of each circle and a desired aspect ratio
var packLayout = function(sizes, ratio) {
  var positions = [];
  var pairs = [];
  var origin = {x: 0, y: 0};
  
  // Sets a default aspect ratio 
  ratio = ratio || 1;

  // Places a circle next to a pair of circles
  var place = function(node, pair) {
    var db = pair[0].r + node.r;
    var dx = pair[1].x - pair[0].x;
    var dy = pair[1].y - pair[0].y;
    if (db && (dx || dy)) {
      var da = pair[1].r + node.r;
      var dc = Math.sqrt(dx * dx + dy * dy);
      var cos = Math.max(-1, Math.min(1, (db * db + dc * dc - da * da) / (2 * db * dc)));
      var x = cos * (db /= dc);
      var y = Math.sin(Math.acos(cos)) * db;
      node.x = pair[0].x + x * dx + y * dy;
      node.y = pair[0].y + x * dy - y * dx;
    } else {
      node.x = pair[0].x + db;
      node.y = pair[0].y;
    }
    return node;
  }

  // Finds the distance between two points,
  // scaling vertical/horizontal values according to the desired aspect ratio
  var dist = function(a, b, r) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow((r || 1) * (a.y - b.y), 2));
  };
  
  // Finds the distance between a pair of circles and the origin, 
  // using the desired aspect ratio
  var pairDist = function(pair) { 
    return (dist(pair[0], origin, ratio) + dist(pair[1], origin, ratio)) / 2; 
  };

  // Tests if two circles collide
  var collides = function(a, b) {
    return a.r + b.r - dist(a, b) > 3;
  };

  // Adds initial pair of circles
  if (sizes.length > 0) positions.push({x:0, y: 0, r: sizes[0]});
  if (sizes.length > 1) {
    positions.push({x:0, y: sizes[0] + sizes[1], r: sizes[1]});
    pairs.push([positions[0], positions[1]]);
    pairs.push([positions[1], positions[0]]);
  }

  // Loops through existing pairs trying to place each circle
  var j = 0;
  while (positions.length < sizes.length) {
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      var node = {r: sizes[positions.length]};
      node = place(node, pair);
      if (positions.filter(function(p) { return collides(node, p); }).length == 0) {
        positions.push(node);
        pairs.push([pair[0], node]);
        pairs.push([node, pair[1]]);
        pairs.splice(i, 1);
        break;
      }
    }
    
    pairs.sort(function(a, b) { return pairDist(a) - pairDist(b); });
    if (j++ > 100) break;
  }
  return positions;
};