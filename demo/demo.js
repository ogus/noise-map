"use strict";

var dom = {
  mapConfig: null,
  floorToggle: null,
  floorInput: null,
  seedInput: null,
  styleConfig: null,
  shadowToggle: null,
  buttonStart: null,
  buttonReset: null
};

var canvas, ctx, map;

window.onload = function () {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  map = null;

  initDOM();
  initListener();
  startMapCreation();
}

function initDOM() {
  dom.mapConfig = document.getElementsByName("map_config");
  dom.floorToggle = document.getElementById("floor_checkbox");
  dom.floorInput = document.getElementById("floor_input");
  dom.seedInput = document.getElementById("seed_input");
  dom.styleConfig = document.getElementById("style_config");
  dom.shadowToggle = document.getElementById("shadow_checkbox");
  dom.buttonStart = document.getElementById("start");
  dom.buttonReset = document.getElementById("reset");
}

function initListener() {
  for (let i = 0; i < dom.mapConfig.length; i++) {
    dom.mapConfig[i].addEventListener("change", createHeightmap, false);
  }

  dom.floorToggle.addEventListener("change", createHeightmap, false) ;
  dom.floorInput.addEventListener("change", function (e) {
    if(dom.floorToggle.checked){
      createHeightmap();
    }
  }, false);

  dom.styleConfig.addEventListener("change", drawMap, false);
  dom.shadowToggle.addEventListener("change", drawMap, false);

  dom.buttonStart.addEventListener("click", startMapCreation, false);
  dom.buttonReset.addEventListener("click", resetUserParam, false);
}

function startMapCreation() {
  if (dom.seedInput.value.length > 0) {
    map = new PerlinMap(250,250, dom.seedInput.value.value);
  }
  else {
    map = new PerlinMap(250,250);
  }
  createHeightmap();
}

function createHeightmap() {
  let config = getUserConfig();
  map.compute("perlin", config);
  map.heightmap.scaleValues(config.elevation);
  if(config.floor) {
    map.heightmap.floorValues(config.floorValue);
  }
  drawMap();
}

function drawMap() {
  let config = getUserStyle();
  console.log(config);
  map.draw(ctx, canvas.width, canvas.height, config.style, config.shadow);
}

function getUserConfig() {
  let config = {
    amplitude: 1,
    amplitudeCoef: parseFloat(dom.mapConfig[0].value),
    frequency: parseFloat(dom.mapConfig[1].value),
    frequencyCoef: parseFloat(dom.mapConfig[2].value),
    elevation: parseFloat(dom.mapConfig[3].value),
    floor: dom.floorToggle.checked,
    floorValue: parseInt(dom.floorInput.value),
    seed: dom.seedInput.value.length > 0 ? dom.seedInput.value : false
  };
  return config;
}

function getUserStyle() {
  let style = "";
  for (let i = 0; i < dom.styleConfig.length; i++) {
    if(dom.styleConfig[i].checked) {
      style = dom.styleConfig[i].value;
    }
  }
  let shadow = dom.shadowToggle.checked;
  return {
    style: style,
    shadow: shadow
  };
}

function resetUserParam() {
  dom.mapConfig[0].value = 0.5;
  dom.mapConfig[1].value = 0.5;
  dom.mapConfig[2].value = 0.5;
  dom.mapConfig[3].value = 1;

  // dom.floorToggle.checked = false;
  dom.floorInput.value = 20;

  createHeightmap();
}
