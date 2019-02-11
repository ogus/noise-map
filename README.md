# Noise Map
> A procedural 2D maps generator, with Perlin / simplex noise

## Usage
```html
<body>
  <canvas id="map-canvas" width="800" height="400"></canvas>
</body>
```
```js
var NoiseMap = require('noise-map');

var generator = new NoiseMap.MapGenerator();
var heightmap = generator.createMap(400, 200, {type: 'perlin'});

var context = document.getElementById('map-canvas').getContext('2d');
heightmap.draw(context, 800, 400, 'real');
```

Output:
![Procedural Map](example/map.png)


## API


## Installation


## License

This project is licensed under the WTFPL - see [LICENSE](LICENSE) for more details
