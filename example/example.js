"use strict";

var DOM = {
  mapConfig: null,
  stepToggle: null,
  stepInput: null,
  seedInput: null,
  styleConfig: null,
  shadowToggle: null,
  buttonStart: null,
  buttonReset: null
};

var canvas, ctx, generator, map;

window.onload = function () {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  generator = new NoiseMap.MapGenerator();

  initDOM();
  initListener();
  startMapCreation();
}

function initDOM() {
  DOM.mapConfig = document.getElementsByName("map_config");
  DOM.stepToggle = document.getElementById("step_checkbox");
  DOM.stepInput = document.getElementById("step_input");
  DOM.seedInput = document.getElementById("seed_input");
  DOM.styleConfig = document.getElementById("style_config");
  DOM.shadowToggle = document.getElementById("shadow_checkbox");
  DOM.buttonStart = document.getElementById("start");
  DOM.buttonReset = document.getElementById("reset");
}

function initListener() {
  for (let i = 0; i < DOM.mapConfig.length; i++) {
    DOM.mapConfig[i].addEventListener("change", createHeightmap, false);
  }

  DOM.stepToggle.addEventListener("change", createHeightmap, false);
  DOM.stepInput.addEventListener("change", function (e) {
    if(DOM.stepToggle.checked){
      createHeightmap();
    }
  }, false);

  DOM.styleConfig.addEventListener("change", drawMap, false);
  DOM.shadowToggle.addEventListener("change", drawMap, false);

  DOM.buttonStart.addEventListener("click", startMapCreation, false);
  DOM.buttonReset.addEventListener("click", resetUserParam, false);
}

function startMapCreation() {
  generator.setSeed(DOM.seedInput.value);
  createHeightmap();
}

function createHeightmap() {
  let userConfig = getUserConfig();
  map = generator.createMap(250,250, userConfig);

  map.scaleValues(userConfig.elevation);
  if (userConfig.step) {
    map.stepValues(userConfig.stepValue);
  }
  drawMap();
}

function drawMap() {
  let userStyle = getUserStyle();
  map.draw(ctx, canvas.width, canvas.height, userStyle.style, userStyle.shadow);
}

function getUserConfig() {
  let config = {
    amplitude: 1,
    amplitudeCoef: parseFloat(DOM.mapConfig[0].value),
    frequency: parseFloat(DOM.mapConfig[1].value),
    frequencyCoef: parseFloat(DOM.mapConfig[2].value),
    elevation: parseFloat(DOM.mapConfig[3].value),
    step: DOM.stepToggle.checked,
    stepValue: parseInt(DOM.stepInput.value),
    seed: DOM.seedInput.value.length > 0 ? DOM.seedInput.value : false
  };
  return config;
}

function getUserStyle() {
  let style = "";
  for (let i = 0; i < DOM.styleConfig.length; i++) {
    if(DOM.styleConfig[i].checked) {
      style = DOM.styleConfig[i].value;
    }
  }
  switch (style) {
    case "real":
      style = NoiseMap.STYLE.REALISTIC;
      break;
    case "geo":
      style = NoiseMap.STYLE.GEOLOGIC;
      break;
    case "heat":
      style = NoiseMap.STYLE.HEATMAP;
      break;
    case "gray":
      style = NoiseMap.STYLE.GRAY;
      break;
  }

  let shadow = DOM.shadowToggle.checked;
  return {
    style: style,
    shadow: shadow
  };
}

function resetUserParam() {
  DOM.mapConfig[0].value = 0.5;
  DOM.mapConfig[1].value = 0.5;
  DOM.mapConfig[2].value = 0.5;
  DOM.mapConfig[3].value = 1;
  DOM.stepToggle.checked = false;
  // DOM.stepInput.value = 20;
  createHeightmap();
}
