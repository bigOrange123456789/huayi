import {
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRendererEx,
  sRGBEncoding
} from '../lib/three/build/three';

import Stats from '../lib/three/examples/jsm/libs/stats.module.js';
//import {OrbitControls} from '../lib/three/examples/jsm/controls/OrbitControls.js';
import {PlayerControl} from '../lib/myThree/PlayerControl.js';

import { GUI } from 'dat.gui';

import { SLMLoader } from '../lib/SLMLoader';

export class Viewer 
{
  constructor (el, options) 
  {
    this.el = el;
    this.options = options;

    this.lights = [];
    this.content = null;

    this.gui = null;

    this.prevTime = 0;

    this.stats = new Stats();
    this.stats.dom.height = '48px';
    [].forEach.call(this.stats.dom.children, (child) => (child.style.display = ''));

    this.scene = new Scene();
    window.scene=this.scene

    const fov = 60;
    this.defaultCamera = new PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.1, 10000);
    this.activeCamera = this.defaultCamera;
    this.scene.add(this.defaultCamera);
    this.activeCamera.layers.enableAll();

    this.renderer = window.renderer = new WebGLRendererEx({antialias: true});
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.setClearColor(0xcccccc);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.renderer.autoClear = false;

    new PlayerControl(this.activeCamera)
    window.camera=this.activeCamera

    this.el.appendChild(this.renderer.domElement);

    this.slmLoader = new SLMLoader(
      {
        EnablePicking: true,
        renderer: this.renderer,
        scene: this.scene,
        sceneOccluder: this.scene,
        el: this.el,
        EnableCulling: true,
      }
    );

    this.showgui = true;

    if (this.showgui)
    {
      this.addGUI();
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    window.addEventListener('resize', this.resize.bind(this), false);

    this.setupScene();
  }

  animate(time)
  {
    requestAnimationFrame(this.animate);

    this.stats.update();

    this.render();

    this.prevTime = time;
  }

  render() 
  {
    this.renderer.clear();//????????????
    this.renderer.render(this.scene, this.activeCamera);//?????????????????????render
  }

  resize() 
  {
    const {clientHeight, clientWidth} = this.el.parentElement;

    this.defaultCamera.aspect = clientWidth / clientHeight;
    this.defaultCamera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  //???app.js??????
  load(scenes, finishCallback)//scenes
  {
    window.hasLoadingTag=0
    var scope = this;
    window.addMoment("slmLoader.LoadScene:start")
    this.slmLoader.LoadScene(
      scenes, //??????????????????zip????????????
      function(slmScene, _tag, bvhScene){ //singleSceneCallbackAsync, ?????????????????????
        console.log("this.slmLoader.LoadScene 1")
        //scope.addSceneModel(slmScene,_tag);
      }, 
      function(){ //allScenesCallbackAsync, ????????????????????????
        console.log("this.slmLoader.LoadScene 2")
        if (finishCallback)
        {
          finishCallback();
        }
      }, 
      function(slmScene, _tag){ //singleSceneCallbackSync,?????????????????????
        console.log("this.slmLoader.LoadScene 3")
      });
  }

  addSceneModel(sceneModel)
  {
    this.scene.add(sceneModel);
  }

  setupScene() 
  {
    this.setCamera();

    this.addLights();

    window.content = this.content;
  }

  setCamera() 
  {
    this.defaultCamera.position.set(-459.8231509760614,  39.2496658862353,  2716.9451960982447);
    this.defaultCamera.rotation.set( -0.18589681069184721,  0.6590683541369203,  0.11466413855442507)
    this.activeCamera = this.defaultCamera;
    window.c=this.defaultCamera
  }

  addLights ()
  {
    if (!this.options || !this.options.baked)
    {
      const directionalLight  = new DirectionalLight(0xFFFFFF, 3.5);
      directionalLight.position.set(0.5, 1.2, 0.5);
  
      this.scene.add(directionalLight);
    }
  }

  addGUI() 
  {
    const gui = this.gui = new GUI({autoPlace: false, width: 260, hideable: true});

    const perfFolder = gui.addFolder('Performance');
    const perfLi = document.createElement('li');
    this.stats.dom.style.position = 'static';
    perfLi.appendChild(this.stats.dom);
    perfLi.classList.add('gui-stats');
    perfFolder.__ul.appendChild( perfLi );

    const guiWrap = document.createElement('div');
    this.el.appendChild( guiWrap );
    guiWrap.classList.add('gui-wrap');
    guiWrap.appendChild(gui.domElement);
    gui.open();
  }
  SetComponentMatrix(componentKey,matrix){
  }
};

