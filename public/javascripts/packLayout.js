var packLayout = function(sizes, ratio) {
  var positions = [];
  var pairs = [];
  var centre = {x: 0, y: 0};

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

  var dist = function(a, b, r) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow((r || 1) * (a.y - b.y), 2));
  };

  var collides = function(a, b) {
    return a.r + b.r - dist(a, b) > 3;
  };

  positions.push({x:0, y: 0, r: sizes[0]});
  positions.push({x:0, y: sizes[0] + sizes[1], r: sizes[1]});
  pairs.push([positions[0], positions[1]]);
  pairs.push([positions[1], positions[0]]);

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
    pairs = _(pairs).sortBy(function(pair) { return (dist(pair[0], centre, ratio) + dist(pair[1], centre, ratio)) / 2; });
    //console.log(JSON.stringify(pairs));
    if (j++ > 100) break;
  }
  return positions;
};