(function (root, factory) {
  if (typeof exports === 'object') { module.exports = factory(); }
  else if (typeof define === 'function' && define.amd) { define(factory); }
  else { root.NoiseMap = factory(); }
}(this, function () {
  'use strict';

  var TABLE = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
    247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,
    165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,
    25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,
    226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,
    152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,
    97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,
    84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

  var SIMPLEX_SKEW = 0.5 * (Math.sqrt(3) - 1);
  var SIMPLEX_UNSKEW = (3 - Math.sqrt(3)) / 6;

  var permutationTable = [];
  var gradientTable = [
    {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1},
    {x: Math.SQRT1_2, y: Math.SQRT1_2}, {x: -Math.SQRT1_2, y: Math.SQRT1_2},
    {x: Math.SQRT1_2, y: -Math.SQRT1_2}, {x: -Math.SQRT1_2, y: -Math.SQRT1_2}
  ];

  function generatePermutationTable(seed) {
    permutationTable = new Array(512);
    var v = 0;
    for (var i = 0; i < 256; i++) {
      if (i & 1) {
        v = TABLE[i] ^ (seed & 255);
      }
      else {
        v = TABLE[i] ^ ((seed>>8) & 255);
      }
      permutationTable[i] = permutationTable[i + 256] = v;
    }
  }

  /**
   * Create noise values for a 2D map by adding successive noise octaves
   * at different amplitudes and frequencies.
   * The result is a 1D Array of size width*height
   * @param width Width of the map
   * @param height Height of the map
   * @param startAmplitude Starting octave amplitude
   * @param amplitudeCoef Variation of amplitude on successive octave
   * @param startFrequency Starting octave frequency
   * @param frequencyCoef Variation of frequency on successive octave
   * @param noiseFunc The noise function used (Perlin / Simplex)
   */
  function generateNoise(width, height, startAmplitude, amplitudeCoef, startFrequency, frequencyCoef, noiseFunc) {
    // initialize noise matrix
    var noise = new Array(width * height);
    var n = 0, min = 99999, max = -99999;
    var amplitude = 0, frequency = 0, value = 0;
    var x = 0, y = 0, k = 0;
    // fill the noise Array
    for (x = 0; x < width; x++) {
      for (y = 0; y < height; y++) {
        amplitude = startAmplitude;
        frequency = startFrequency;
        value = 0;
        // compute noise value with 5 octaves
        for (k = 0; k < 5; k++) {
          n = noiseFunc(x / (width*frequency), y / (height*frequency));
          min = Math.min(n, min); max = Math.max(n, max);
          value += amplitude * n;
          amplitude *= amplitudeCoef;
          frequency *= frequencyCoef;
        }
        // add the new value to the matrix
        noise[x + y*width] = value;
      }
    }
    return noise;
  }

  /**
   * Compute the Perlin noise value at coordinates x,y from a permutation table
   */
  function perlinNoise(inputX, inputY) {
    // coords of the cell
    var xFloor = Math.floor(inputX);
    var yFloor = Math.floor(inputY);
    // relative xy coords in the cell
    var x = inputX - xFloor;
    var y = inputY - yFloor;
    xFloor &= 255; yFloor &= 255;
    // Calculate noise contributions from each corners
    var grad;
    grad = gradientTable[permutationTable[xFloor + permutationTable[yFloor]] & 7];
    var n00 = grad.x*x + grad.y*y;
    grad = gradientTable[permutationTable[xFloor + permutationTable[yFloor+1]] & 7];
    var n01 = grad.x*x + grad.y*(y-1);
    grad = gradientTable[permutationTable[xFloor+1 + permutationTable[yFloor]] & 7];
    var n10 = grad.x*(x-1) + grad.y*y;
    grad = gradientTable[permutationTable[xFloor+1 + permutationTable[yFloor+1]] & 7];
    var n11 = grad.x*(x-1) + grad.y*(y-1);
    // Interpolate the gradient of the four corners
    var n = smooth(x);
    var value = lerp(smooth(y), lerp(n, n00, n10), lerp(n, n01, n11));
    return value;
  }

  /**
   * Compute the simplex noise value at coordinates x,y from a gradient table
   */
  function simplexNoise(inputX, inputY) {
    // coords of the simplex
    var skew = (inputX + inputY) * SIMPLEX_SKEW;
    var xFloor = Math.floor(inputX + skew);
    var yFloor = Math.floor(inputY + skew);
    // first unskewed corner in simplex
    var x0 = inputX-xFloor + (xFloor + yFloor)*SIMPLEX_UNSKEW;
    var y0 = inputY-yFloor + (xFloor + yFloor)*SIMPLEX_UNSKEW;
    // offset for the second corner of simplex
    var x_offset, y_offset;
    if (x0 > y0) {
      x_offset = 1; y_offset = 0;
    }
    else {
      x_offset = 0; y_offset = 1;
    }
    // second and last corner in unskewed coords
    var x1 = x0 - x_offset + SIMPLEX_UNSKEW;
    var y1 = y0 - y_offset + SIMPLEX_UNSKEW;
    var x2 = x0 - 1 + 2*SIMPLEX_UNSKEW;
    var y2 = y0 - 1 + 2*SIMPLEX_UNSKEW;
    // compute gradient of each corner
    xFloor &= 255; yFloor &= 255;
    var g0 = gradientTable[permutationTable[xFloor + permutationTable[yFloor]] & 7];
    var g1 = gradientTable[permutationTable[xFloor+x_offset + permutationTable[yFloor+y_offset]] & 7];
    var g2 = gradientTable[permutationTable[xFloor+1 + permutationTable[yFloor+1]] & 7];
    // compute contribution of each corner
    var n0 = 0, n1 = 0, n2 = 0, dist = 0;
    dist = 0.5 - x0*x0-y0*y0;
    if (dist < 0) { n0 = 0; }
    else {
      dist *= dist;
      n0 = (dist*dist) * (g0.x*x0 + g0.y*y0);
    }
    dist = 0.5 - x1*x1-y1*y1;
    if(dist < 0) { n1 = 0; }
    else {
      dist *= dist;
      n1 = (dist*dist) * (g1.x*x1 + g1.y*y1);
    }
    dist = 0.5 - x2*x2-y2*y2;
    if (dist < 0) { n2 = 0; }
    else {
      dist *= dist;
      n2 = (dist*dist) * (g2.x*x2 + g2.y*y2);
    }
    // sum contribution of each corner
    return 70 * (n0 + n1 + n2);
  }

  /**
   * Smoothing function that fade the square-ish look
   * @param t Value to smooth, in [0, 1]
   */
  function smooth(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  /**
   * Linear interpolation of t between a and b
   */
  function lerp(t, a, b) {
    return (1-t)*a + t*b;
  }

  /**
   * Scale a value from an old interval to a new interval
   */
  function scale(x, oldMin, oldMax, newMin, newMax) {
    return newMin + (newMax - newMin) * (x - oldMin) / (oldMax - oldMin);
  }


  /**
   * MapGenerator can generate new HeightMap by using noise function
   * @constructor
   * @param seed An Integer value, used as a seed
   * @param config A custom configuration
   */
  function MapGenerator(seed, config) {
    this._seed = null;
    this._config = {
      type: 'simplex',
      amplitude: 1,
      frequency: 0.5,
      amplitudeCoef: 0.5,
      frequencyCoef: 0.5,
      generateSeed: false
    };

    this.setSeed(seed);
    this.setConfig(config);
  }

  MapGenerator.prototype = {
    setSeed: function (seed) {
      var s = parseInt(seed) || Math.random();
      if (s < 0) {
        s *= -1;
      }
      if(s > 0 && s < 1) {
        s *= 65536;
      }
      if(s < 256) {
        s |= s << 8;
      }
      this._seed = s;
      generatePermutationTable(this._seed);
    },

    setConfig: function(config) {
      config = (config !== undefined) ? config : {};
      var properties = Object.keys(this._config);
      for (var i = 0; i < properties.length; i++) {
        if (config.hasOwnProperty(properties[i])) {
          this._config[properties[i]] = config[properties[i]];
        }
      }
    },

    createMap: function (width, height, config) {
      if (config !== undefined) {
        this.setConfig(config);
      }
      // create the array of noise values
      var c = this._config;
      if (!!c.generateSeed) {
        this.setSeed();
      }
      var noiseFunc = (c.type == 'perlin') ? perlinNoise : simplexNoise;
      var noise = generateNoise(width, height, c.amplitude, c.amplitudeCoef, c.frequency, c.frequencyCoef, noiseFunc);
      // scale values to [0, 1]
      var min = Math.min.apply(null, noise);
      var max = Math.max.apply(null, noise);
      noise = noise.map(function (n) {
        return scale(n, min, max, 0,1);
      });
      // create the new HeightMap
      return new HeightMap(width, height, noise);
    }
  };

  /**
   * HeightMap contains data on noise values and methods to be displayed on a Canvas
   *
   * @constructor
   * @param width The heightmap width
   * @param height The heightmap height
   * @param data The heightmap data as an Array
   */
  function HeightMap(width, height, data) {
    this.width = width;
    this.height = height;
    this.data = typeof(data) != 'undefined' ? data : new Array(width * height);
  }

  HeightMap.prototype = {
    get: function (x, y) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        return this.data[y*this.width + x];
      }
      return null;
    },

    set: function (x, y, value) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        this.data[y*this.width + x] = value;
      }
    },

    scaleValues: function (expCoeff) {
      var coeff = Math.max( Math.min(expCoeff, 2), 0.5);
      if (coeff != 1) {
        for (var i = 0; i < this.data.length; i++) {
          this.data[i] = Math.pow(this.data[i], coeff);
        }
      }
    },

    stepValues: function (n) {
      var steps = Math.max( Math.min(n, 100), 1);
      if (steps > 1) {
        for (var i = 0; i < this.data.length; i++) {
          this.data[i] = Math.round(this.data[i]*steps) / steps;
        }
      }
    },

    inverseValues: function () {
      for (var i = 0; i < this.data.length; i++) {
        this.data[i] = 1 - this.data[i];
      }
    },

    draw: function (context, outputWidth, outputHeight, style, enableShadow) {
      var cellWidth = Math.ceil(outputWidth / this.width);
      var cellHeight = Math.ceil(outputHeight / this.height);
      var colorizer = new Colorizer(style);
      var shadow = !!enableShadow;
      for (var i = 0; i < this.width; i++) {
        for (var j = 0; j < this.height; j++) {
          context.fillStyle = colorizer.getColor(this.get(i, j));
          context.fillRect(i*cellWidth, j*cellHeight, cellWidth, cellHeight);
          if (shadow) {
            context.fillStyle = this.getShadowColor(i, j);
            context.fillRect(i*cellWidth, j*cellHeight, cellWidth, cellHeight);
          }
        }
      }
    },

    getShadowColor: function (x, y) {
      var intensity = 0;
      var value = this.get(x, y);
      if (value >= 0.5) {
        if (this.get(x-1, y) > value) {
          intensity += 0.01;
        }
        if (this.get(x, y-1) > value) {
          intensity += 0.02;
        }
        if (this.get(x-1, y-1) > value) {
          intensity += 0.03;
        }
      }
      return "rgba(0,0,0," + String(intensity) + ")";
    }
  };

  var _realColorMatrix = {
    R: [[0,2],[63,9],[126,17],[127,69],[128,42],[191,115],[225,153],[250,179],[255,255]],
    G: [[0,43],[63,62],[126,82],[127,108],[128,102],[191,128],[225,143],[250,179],[255,255]],
    B: [[0,68],[63,92],[126,112],[127,118],[128,41],[191,77],[225,92],[250,179],[255,255]]
  };
  var _heatColorMatrix = {
    R: [[0,94],[126,66],[127,77],[128,86],[160,207],[191,254],[223,247],[255,182]],
    G: [[0,79],[126,138],[127,163],[128,173],[160,236],[191,235],[223,137],[255,28]],
    B: [[0,162],[126,181],[127,177],[128,174],[160,158],[191,159],[223,81],[255,71]]
  };
  var _geoColorMatrix = {
    R: [[0,10],[126,73],[127,109],[128,29],[160,107],[191,254],[223,207],[255,67]],
    G: [[0,0],[126,186],[127,219],[128,160],[160,138],[191,245],[223,131],[255,40]],
    B: [[0,79],[126,184],[127,184],[128,108],[160,44],[191,176],[223,55],[255,19]]
  };
  var _grayColorMatrix = {
    R: [[0,0],[255,255]],
    G: [[0,0],[255,255]],
    B: [[0,0],[255,255]]
  };

  var STYLE = {
    REALISTIC: 0,
    HEATMAP: 1,
    GEOLOGIC: 2,
    GRAY: 3
  };

  function Colorizer(mapStyle) {
    this._colorMatrix = null;
    switch (mapStyle) {
      case STYLE.REALISTIC:
        this._colorMatrix = _realColorMatrix;
        break;
      case STYLE.HEATMAP:
        this._colorMatrix = _heatColorMatrix;
        break;
      case STYLE.GEOLOGIC:
        this._colorMatrix = _geoColorMatrix;
        break;
      case STYLE.GRAY:
      default:
        this._colorMatrix = _grayColorMatrix;
        break;
    };
  };
  Colorizer.prototype = {
    getColor: function (value) {
      var r = this._interpolate(value*255, this._colorMatrix.R);
      var g = this._interpolate(value*255, this._colorMatrix.G);
      var b = this._interpolate(value*255, this._colorMatrix.B);
      return "rgb(" + r + "," + g + "," + b + ")";
    },

    _interpolate: function (t, colorArray) {
      for (var i = 0; i < colorArray.length; i++) {
        if (t == colorArray[i][0]) {
          return colorArray[i][1];
        }
        if (t < colorArray[i][0]) {
          var prev = colorArray[i-1];
          var next = colorArray[i];
          return Math.floor(scale(t, prev[0], next[0], prev[1], next[1]));
        }
      }
      return array[array.length-1][1];
    }
  }

  return {
    MapGenerator: MapGenerator,
    HeightMap: HeightMap,
    STYLE: STYLE,
    Colorizer: Colorizer
  };
}));
