import { Viewer } from './viewer.js';

class App
{
  constructor (el) 
  {
    this.el = el;
    this.viewer = null;
    this.viewerEl = null;

    if (this.viewer) this.viewer.clear();

    var parseUrlParams = function()
    {
      var urlParams = window.location.href;
      var vars = {};
      var parts = urlParams.replace(/[?&]+([^=&]+)=([^&]*)/gi,
          function (m, key, value) {
              vars[key] = decodeURIComponent(value);
          });
          
      return vars;
    }

    var paramJson = parseUrlParams();

    this.createViewer(paramJson);
    
    var scenes = 
    [
      {url: 'assets\\models\\canting.zip', tag: 1},
	    {url: 'assets\\models\\SAM_Review_1.zip', tag: 2}
    ];//资源路径，每一个zip包对应一个glb中的scene对象
    

    if (paramJson.scene)
    {
      scenes = 
      [
        //{url: 'assets\\models\\' + paramJson.scene + '.zip', tag: 1}
      ]
      for(var i=0;i<=0;i++)//for(var i=0;i<=25;i++)//
        scenes.push(
          {url: 'assets/models/huayirvm0616-' +i+ '.zip', tag: 1}
        )
      
      // var scope=this
      // setTimeout(()=>{
      //   scenes = []
      //   for(var i=1;i<=5;i++)//for(var i=0;i<=25;i++)
      //     scenes.push(
      //       {url: 'assets/models/huayirvm0616-' +i+ '.zip', tag: 1}
      //     )
      //   scope.viewer.load(scenes);
      // },1000)
    }
    // this.viewer.load(scenes);

    
    window.viewer000=this.viewer
    window.hasLoadingTag=0
    console.log("这里应该只执行一次")
    window.myLoading=()=>{
      if(window.hasLoadingTag<=25){
        window.viewer000.load([{
          url:'assets/models/huayirvm0616-' +window.hasLoadingTag+ '.zip', 
          tag: 1
        }])
         window.hasLoadingTag=window.hasLoadingTag+1
		  }
      console.log("window.hasLoadingTag",window.hasLoadingTag)
    }
    window.myLoading()

    // window.viewer000.load([{
    //   url:'assets/models/huayirvm0616-' +window.hasLoadingTag+ '.zip', 
    //   tag: 1
    // }])

  }

  createViewer(paramJson) 
  {
    this.viewerEl = document.createElement('div');
    this.viewerEl.classList.add('viewer');
    this.el.appendChild(this.viewerEl);
    this.viewer = new Viewer(this.viewerEl, {
      baked: paramJson['baked'],
    });
    return this.viewer;
  }
}

var app = null;
document.addEventListener('DOMContentLoaded', () => {

  app = new App(document.body);

});
