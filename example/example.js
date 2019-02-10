"use strict";

var dom = {
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
  dom.mapConfig = document.getElementsByName("map_config");
  dom.stepToggle = document.getElementById("step_checkbox");
  dom.stepInput = document.getElementById("step_input");
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

  dom.stepToggle.addEventListener("change", createHeightmap, false);
  dom.stepInput.addEventListener("change", function (e) {
    if(dom.stepToggle.checked){
      createHeightmap();
    }
  }, false);

  dom.styleConfig.addEventListener("change", drawMap, false);
  dom.shadowToggle.addEventListener("change", drawMap, false);

  dom.buttonStart.addEventListener("click", startMapCreation, false);
  dom.buttonReset.addEventListener("click", resetUserParam, false);
}

function startMapCreation() {
  generator.setSeed(dom.seedInput.value);
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
    amplitudeCoef: parseFloat(dom.mapConfig[0].value),
    frequency: parseFloat(dom.mapConfig[1].value),
    frequencyCoef: parseFloat(dom.mapConfig[2].value),
    elevation: parseFloat(dom.mapConfig[3].value),
    step: dom.stepToggle.checked,
    stepValue: parseInt(dom.stepInput.value),
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
  dom.stepToggle.checked = false;
  // dom.stepInput.value = 20;
  createHeightmap();
}
