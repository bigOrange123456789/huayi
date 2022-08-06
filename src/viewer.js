import {
  Box3,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRendererEx,
  sRGBEncoding,
  Object3D
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

    const fov = 60;
    this.defaultCamera = new PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.1, 700);
    this.activeCamera = this.defaultCamera;
    this.scene.add(this.defaultCamera);
    this.activeCamera.layers.enableAll();

    this.sceneEx = new Scene();
    this.sceneEx.add(this.defaultCamera);

    this.renderer = window.renderer = new WebGLRendererEx({antialias: true});
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.setClearColor(0xcccccc);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(el.clientWidth, el.clientHeight);
    this.renderer.autoClear = false;

    new PlayerControl(this.activeCamera)
    window.camera=this.activeCamera
    //this.controls = new OrbitControls(this.defaultCamera, this.renderer.domElement);
    //this.controls.autoRotate = false;
    //this.controls.autoRotateSpeed = -10;
    //this.controls.screenSpacePanning = true;

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

    //this.controls.update();
    this.stats.update();

    this.render();

    this.prevTime = time;
  }

  render() 
  {
    this.slmLoader.render(this.activeCamera, this.sceneRootNodeEx ? this.sceneRootNodeEx.matrixWorld: null);

    this.renderer.clear();
    
    this.renderer.render(this.scene, this.activeCamera);//不知为啥有两个render

    this.renderer.render(this.sceneEx, this.activeCamera);
  }

  resize() 
  {
    const {clientHeight, clientWidth} = this.el.parentElement;

    this.defaultCamera.aspect = clientWidth / clientHeight;
    this.defaultCamera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  }

  //被app.js调用
  load(scenes, finishCallback)//scenes
  {
    window.hasLoadingTag=0
    var scope = this;
    this.slmLoader.LoadScene(scenes, function(slmScene, _tag, bvhScene)
      {
        // console.log('get scene: ' + _tag);

        // console.log(slmScene);
        
        scope.addSceneModel(slmScene,_tag);
      }, function()
      {
        // console.log('all scene loaded');

        if (finishCallback)
        {
          finishCallback();
        }
      }, function(slmScene, _tag)
      {
        // console.log(slmScene);
        
      });
  }

  addSceneModel(sceneModel,tag)
  {
    //alert(tag)
    if (!this.sceneRootNode)
    {
      this.sceneRootNode = new Object3D();//只创建一次
	    this.sceneRootNode2 = new Object3D();
      this.sceneRootNodeEx = new Object3D();

      this.scene.add(this.sceneRootNode);
	    this.scene.add(this.sceneRootNode2);
      this.sceneEx.add(this.sceneRootNodeEx);
    }
    // console.log("addSceneModel_tag",tag)

    if(tag==1)
    {
      this.uniformScene(sceneModel, 50,this.sceneRootNode);
      this.uniformScene(sceneModel, 50,this.sceneRootNodeEx);

      //this.sceneRootNodeEx.position.x += 3.6;
      //this.sceneRootNodeEx.position.y += 8.8;
      //this.sceneRootNodeEx.scale.copy(this.sceneRootNode.scale);

      this.sceneRootNode.add(sceneModel);
      this.sceneRootNode.position.set(0,0,0)
	  }
	  /*else if(tag==2)
    {
      this.uniformScene(sceneModel, 50,this.sceneRootNode2);
      this.sceneRootNode2.add(sceneModel);
	  }
    */
    // window.hasLoadingTag++
		// console.log(window.hasLoadingTag)
		// if(window.hasLoadingTag<=25){
		// 	window.myLoading(window.hasLoadingTag)
		// }
  }

  uniformScene(sceneModel, _uniforSize, sceneRootNode)////////////////////!!!!!!!!!!
  {
    // Uniform model
    var uniformSize = _uniforSize ? _uniforSize : 20;

    var objBox3 = new Box3().setFromObject(sceneModel);

    var centerOffset = new Vector3();
    centerOffset.x = -(objBox3.min.x + objBox3.max.x) * 0.5;
    centerOffset.y = -(objBox3.min.y + objBox3.max.y) * 0.5;
    centerOffset.z = -(objBox3.min.z + objBox3.max.z) * 0.5;

    var maxSize = Math.max((objBox3.max.x - objBox3.min.x), Math.max((objBox3.max.y - objBox3.min.y), (objBox3.max.z - objBox3.min.z)));
    var scale = uniformSize / maxSize;

    //alert(scale)
    sceneRootNode.scale.x = 0.01;//scale;
    sceneRootNode.scale.y = 0.01;//scale;
    sceneRootNode.scale.z = 0.01;//scale;

    //sceneRootNode.translateX(centerOffset.x * scale);
    //sceneRootNode.translateY(centerOffset.y * scale);
    //sceneRootNode.translateZ(centerOffset.z * scale);

    //console.log(sceneRootNode);
  }

  setupScene() 
  {
    this.setCamera();

    this.addLights();

    window.content = this.content;
  }

  setCamera() 
  {
    //this.controls.reset();

    var scope=this
    //setInterval(()=>{
      scope.defaultCamera.position.set(
        -1.8179346293719774, 
         1.3528086227387572, 
          22.524586172269363);
      scope.defaultCamera.rotation.set(
        -1.4087594547664113, 
        1.3142458758626443, 
        1.4033769709588264)
    //},100)
    

    //this.controls.target = new Vector3(0.0, 0.0, 0.0);

    //this.controls.enabled = true;
    this.activeCamera = this.defaultCamera;

    //this.controls.saveState();
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

