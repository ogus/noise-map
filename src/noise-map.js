(function (root, factory) {
  if (typeof exports === 'object') { module.exports = factory(); }
  else if (typeof define === 'function' && define.amd) { define(factory); }
  else { root.NoiseMap = factory(); }
}(this, function () {
  'use strict';

  const TABLE = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
    247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,
    165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,
    25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,
    226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,
    152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,
    97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,
    84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

  const SIMPLEX_SKEW = 0.5 * (Math.sqrt(3) - 1);
  const SIMPLEX_UNSKEW = (3 - Math.sqrt(3)) / 6;

  var permutationTable = [];
  var gradientTable = [
    {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1},
    {x: Math.SQRT1_2, y: Math.SQRT1_2}, {x: -Math.SQRT1_2, y: Math.SQRT1_2},
    {x: Math.SQRT1_2, y: -Math.SQRT1_2}, {x: -Math.SQRT1_2, y: -Math.SQRT1_2}
  ];

  function generatePermutationTable(seed) {
    permutationTable = new Array(512);
    let v = 0;
    for (let i = 0; i < 256; i++) {
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
    let noise = new Array(width * height);
    let n = 0, min = 99999, max = -99999;
    let amplitude = 0, frequency = 0, value = 0;
    let x = 0, y = 0, k = 0;
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
   * Compute the noise value at coordinates {x, y} from a permutation table
   * by using the Perlin noise algorithm
   */
  function perlinNoise(inputX, inputY){
    // coords of the cell
    let xFloor = Math.floor(inputX);
    let yFloor = Math.floor(inputY);
    // relative xy coords in the cell
    let x = inputX - xFloor;
    let y = inputY - yFloor;
    xFloor &= 255; yFloor &= 255;
    // Calculate noise contributions from each corners
    let grad;
    grad = gradientTable[permutationTable[xFloor + permutationTable[yFloor]] & 7];
    let n00 = grad.x*x + grad.y*y;
    grad = gradientTable[permutationTable[xFloor + permutationTable[yFloor+1]] & 7];
    let n01 = grad.x*x + grad.y*(y-1);
    grad = gradientTable[permutationTable[xFloor+1 + permutationTable[yFloor]] & 7];
    let n10 = grad.x*(x-1) + grad.y*y;
    grad = gradientTable[permutationTable[xFloor+1 + permutationTable[yFloor+1]] & 7];
    let n11 = grad.x*(x-1) + grad.y*(y-1);
    // Interpolate the gradient of the four corners
    let n = smooth(x);
    let value = lerp(smooth(y), lerp(n, n00, n10), lerp(n, n01, n11));
    return value;
  }

  /**
   * Compute the noise value at coordinates {x, y} from a gradient table
   * by using the simplex noise algorithm
   */
  function simplexNoise(inputX, inputY){
    // coords of the simplex
    let skew = (inputX + inputY) * SIMPLEX_SKEW;
    let xFloor = Math.floor(inputX + skew);
    let yFloor = Math.floor(inputY + skew);
    // first unskewed corner in simplex
    let x0 = inputX-xFloor + (xFloor + yFloor)*SIMPLEX_UNSKEW;
    let y0 = inputY-yFloor + (xFloor + yFloor)*SIMPLEX_UNSKEW;
    // offset for the second corner of simplex
    let x_offset, y_offset;
    if (x0 > y0) {
      x_offset = 1; y_offset = 0;
    }
    else {
      x_offset = 0; y_offset = 1;
    }
     // third and last corner in unskewed coords
    let x1 = x0 - x_offset + SIMPLEX_UNSKEW;
    let y1 = y0 - y_offset + SIMPLEX_UNSKEW;
    let x2 = x0 - 1 + 2*SIMPLEX_UNSKEW;
    let y2 = y0 - 1 + 2*SIMPLEX_UNSKEW;
    // compute gradient of each corner
    xFloor &= 255; yFloor &= 255;
    let g0 = gradientTable[permutationTable[xFloor + permutationTable[yFloor]] & 7];
    let g1 = gradientTable[permutationTable[xFloor+x_offset + permutationTable[yFloor+y_offset]] & 7];
    let g2 = gradientTable[permutationTable[xFloor+1 + permutationTable[yFloor+1]] & 7];
    // compute contribution of each corner
    let n0 = 0, n1 = 0, n2 = 0, dist = 0;
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
   * @param seed Any value, used as a seed
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
      let s = parseInt(seed) || Math.random();
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
      for (let prop of Object.keys(this._config)) {
        if (config.hasOwnProperty(prop)) {
          this._config[prop] = config[prop];
        }
      }
    },

    createMap: function (width, height, config) {
      if (config !== undefined) {
        this.setConfig(inputConfig);
      }
      // create the array of noise values
      let c = this._config;
      if (!!c.generateSeed) {
        this.setSeed();
      }
      let noiseFunc = (c.type == 'perlin') ? perlinNoise : simplexNoise;
      let noise = generateNoise(width, height, c.amplitude, c.amplitudeCoef, c.frequency, c.frequencyCoef, noiseFunc);
      // scale values to [0, 1]
      let min = Math.min.apply(null, noise);
      let max = Math.max.apply(null, noise);
      noise = noise.map(function (n) {
        return scale(n, min, max, 0,1);
      });
      // create the new HeightMap
      return new HeightMap(width, height, noise);
    }
  };

   /**
    * HeightMap contains data on noise values
    * and methods to be displayed on a Canvas
    */
  function HeightMap(width, height, data) {
    this.width = width;
    this.height = height;
    this.size = this.width * this.height;
    this.data = data;
  }

  HeightMap.prototype = {
    getData: function (x, y) {
      if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
        return this.data[y*this.width + x];
      }
      else {
        return null;
      }
    },

    scaleValues: function (expCoeff) {
      var coeff = Math.max( Math.min(expCoeff, 2), 0.5);
      if (coeff != 1) {
        for (let i = 0; i < this.data.length; i++) {
          this.data[i] = Math.pow(this.data[i], coeff);
        }
      }
    },

    stepValues: function (n) {
      let steps = Math.max( Math.min(n, 100), 1);
      if (steps > 1) {
        for (let i = 0; i < this.data.length; i++) {
          this.data[i] = Math.round(this.data[i]*steps) / steps;
        }
      }
    },

    inverseValues: function () {
      for (let i = 0; i < this.data.length; i++) {
        this.data[i] = 1 - this.data[i];
      }
    },

    draw(context, mapWidth, mapHeight, mapStyle, enableShadow) {
      let cellWidth = Math.ceil(mapWidth / this.width);
      let cellHeight = Math.ceil(mapHeight / this.height);
      let colorMap = ColorMap.new(mapStyle);
      let shadow = !!enableShadow;
      for (let i = 0; i < this.width; i++) {
        for (let j = 0; j < this.height; j++) {
          context.fillStyle = colorMap.getColor(this.getData(i, j));
          context.fillRect(i*cellWidth, j*cellHeight, cellWidth,cellHeight);
          if (shadow) {
            context.fillStyle = this.getShadowColor(i, j);
            context.fillRect(i*cellWidth, j*cellHeight, cellWidth,cellHeight);
          }
        }
      }
    },

    getShadowColor: function (x, y) {
      let intensity = 0;
      let value = this.getData(x, y);
      if (value >= 0.5) {
        if (this.getData(x-1, y) > value) {
          intensity += 0.01;
        }
        if (this.getData(x, y-1) > value) {
          intensity += 0.02;
        }
        if (this.getData(x-1, y-1) > value) {
          intensity += 0.03;
        }
      }
      return "rgba(0,0,0," + String(intensity) + ")";
    }
  };

  const REAL_COLORS = {
   R: [[0,2],[63,9],[126,17],[127,69],[128,42],[191,115],[225,153],[250,179],[255,255]],
   G: [[0,43],[63,62],[126,82],[127,108],[128,102],[191,128],[225,143],[250,179],[255,255]],
   B: [[0,68],[63,92],[126,112],[127,118],[128,41],[191,77],[225,92],[250,179],[255,255]]
  };
  const HEAT_COLORS = {
   R: [[0,94],[126,66],[127,77],[128,86],[160,207],[191,254],[223,247],[255,182]],
   G: [[0,79],[126,138],[127,163],[128,173],[160,236],[191,235],[223,137],[255,28]],
   B: [[0,162],[126,181],[127,177],[128,174],[160,158],[191,159],[223,81],[255,71]]
  };
  const GEO_COLORS = {
   R: [[0,10],[126,73],[127,109],[128,29],[160,107],[191,254],[223,207],[255,67]],
   G: [[0,0],[126,186],[127,219],[128,160],[160,138],[191,245],[223,131],[255,40]],
   B: [[0,79],[126,184],[127,184],[128,108],[160,44],[191,176],[223,55],[255,19]]
   };

   var ColorMap = {
    new: function (style) {
      let colorFunction = null;
      switch (style) {
        case 'real':
          colorFunction = function (t) {
            return ColorMap.getColor(t, REAL_COLORS);
          };
          break;
        case 'heat':
          colorFunction = function (t) {
            return ColorMap.getColor(t, HEAT_COLORS);
          };
          break;
        case 'geo':
          colorFunction = function (t) {
            return ColorMap.getColor(t, GEO_COLORS);
          };
          break;
        default:
          style = 'gray';
          colorFunction = function (t) {
            return "hsl(0,0%," + String(t*100) + "%)";
          };
      }
      // return a new object with a single 'getColor' function
      return {
        style: style,
        getColor: colorFunction
      };
    },

    getColor: function (t, colorMatrix) {
      return "rgb(" +
      ColorMap.interpolate(t*255, colorMatrix.R) + "," +
      ColorMap.interpolate(t*255, colorMatrix.G) + "," +
      ColorMap.interpolate(t*255, colorMatrix.B) + ")";
    },

    interpolate: function (t, colorArray) {
     for (let i = 0; i < colorArray.length; i++) {
       // t match an array value
       if (t == colorArray[i][0]) {
         return colorArray[i][1];
       }
       // t is in an interval
       if (t < colorArray[i][0]) {
         let lower = colorArray[i-1];
         let upper = colorArray[i];
         return Math.floor(scale(t, lower[0], upper[0], lower[1], upper[1]));
       }
     }
     return array[array.length-1][1];
   }
  };

  var NoiseMap = {
    MapGenerator: MapGenerator,
    HeightMap: HeightMap
  };
  return NoiseMap;
}));
