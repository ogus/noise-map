# Noise Map

 A procedural 2D map generator based on Perlin / simplex noise

## Example

![Procedural Map](example/map.png)

## Usage

Create a `Canvas` in your HTML code:

```html
<canvas id="map-canvas" width="800" height="400"></canvas>
```

Create a `HeightMap` with the `MapGenerator` in your JS code:
```js
var NoiseMap = require('noise-map');

var generator = new NoiseMap.MapGenerator();
var heightmap = generator.createMap(400, 200, {type: 'perlin'});

var context = document.getElementById('map-canvas').getContext('2d');
heightmap.draw(context, 800, 400, NoiseMap.STYLE.GRAY);
```

## API

This module allows you to create random heightmaps with Perlin and simplex noise,
edit their data with utility methods, and display them on a Canvas.

The module exposes four items:
 + `MapGenerator`: A configurable map constructor
 + `HeightMap`: A data container for noise values
 + `STYLE`: An enum for the map rendering style
 + `Colorizer`: An internal map rendering tool

### MapGenerator

#### `new MapGenerator(seed = random(), configuration = {})`

Instantiate a new MapGenerator, that can be used repeatedly to create different maps. You usually need only one `MapGenerator`.

*Arguments:*

`seed`: optionnal, an integer used a a seed for the noise functions

`configuration`: optionnal, an object describing the current configuration of this generator:
 + type: The algorithm used for noise values (`"simplex"` or `"perlin"`)
 + amplitude: The base amplitude for noise values (default: `1`)
 + frequency: The base frequency for noise values (default: `0.5`)
 + amplitudeCoef: The amplitude modifier for noise values (default: `0.5`)
 + frequencyCoef: The frequency modifier for noise values (default: `0.5`)
 + generateSeed: Toggle the generation of a new seed before map creation (default: `false`)

#### `setSeed(seed)`

#### `setConfig(config)`

#### `newMap(width, height, config = {})`

Return a new `HeightMap` with the input dimensions, and fill it wil random values in [0, 1];

### HeightMap

#### `new HeightMap(width, height, data = [])`

Create a new `HeightMap` with dimensions (`width`, `height`).

The argument `data` is an optionnal 1D `Array` containing the values of the heightmap.

#### `get(x, y)`
Get the value at (`x`, `y`)

#### `set(x, y, value)`
Set the value at (`x`, `y`) to `value`

#### `scaleValues(coef)`
Exponentially scale the values of the heightmap, by a coefficient `coef`;

#### `stepValues(n)`
Floor the values of the heightmap, resulting in `n` steps;

#### `inverseValues()`
Inverse the values of the heightmap

#### `draw(context, outputWidth, outputHeight, style = STYLE.GRAY, enableShadow = false)`

 + context: The 2D context from a `Canvas` element
 + outputWidth: The width for the output map display
 + outputHeight: The height for the output map display
 + style: Set the style, which defines the color used
 + enableShadow: Toggle the shadow on the map

The style can be one of: `STYLE.GRAY`, `STYLE.REALISTIC`, `STYLE.GEOLOGIC`, `STYLE.HEATMAP`


## Installation

You can install the module with [npm](https://www.npmjs.com/):
```sh
npm install noise-map
```

You can import the module with [unpkg](https://unpkg.com/):
```html
<script type="text/javascript" src="https://unpkg.com/noise-map@latest"></script>
```

You can clone the repository & include the `noise-map.js` file in your project:
```sh
git clone https://github.com/ogus/noise-map.git
```


## License

This project is licensed under the WTFPL - see [LICENSE](LICENSE) for more details
