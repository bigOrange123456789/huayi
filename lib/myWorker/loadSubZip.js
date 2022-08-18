import { GLTFLoaderEx } from '../three/examples/jsm/loaders/GLTFLoaderEx.js';//import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import JSZip from 'jszip'
import {
    FileLoader,
    LoaderUtils,
    LoadingManager,
    } from '../three/build/three';
class LoadModel {
  constructor(params) {
    this.url=params.url
    this.arrayBuffers=[] //二进制数据
    this.fileMap={} //储存原始路径和对应blob
    this.modelUrl='' //gltf文件路径
    this.init()
  }
  async init(){
    await this.loadZipFile()
    await this.fileToBlob()
    this.findFile()
    this.runLoader()
  }
  loadZipFile(){
    return new Promise(resolve => {
      const fileLoader = new FileLoader()
      fileLoader
        .setResponseType("arraybuffer")
        .load(
          this.url,
          data => {
            this.arrayBuffers=data
            resolve()
          },
        )
    })
  }
  async fileToBlob(){
    //zip.js加载文件流生成对应文件:
    const zip = new JSZip();
    const promise = JSZip.external.Promise;
    console.log(this.url)
    const baseUrl = 'blob:' + LoaderUtils.extractUrlBase(this.url);
    const pendings = [];
    await zip.loadAsync(this.arrayBuffers);
    //转成blob文件，用URL.createObjectURL创建文件的url
    for (let file in zip.files) {
      const entry = zip.file(file);
      if (entry === null) continue;
      pendings.push(entry.async('blob').then(((file, blob) => {
        this.fileMap[baseUrl + file] = URL.createObjectURL(blob);
      }).bind(this, file)))
    }
    //监听所有请求结束
    await promise.all(pendings);
  }
  findFile(){
    this.modelUrl = Object.keys(this.fileMap).find(item => /\.(glb)$/.test(item));//模型文件url
  }
  runLoader(){
    const manager = new LoadingManager();//转换处理，传入的是后台返回的路径，需找到对应blob
    manager.setURLModifier(url => {
      return this.fileMap[url] ? this.fileMap[url] : url;
    })
    const loader = new GLTFLoaderEx(manager)
    loader.load(this.modelUrl, gltf=> {
        postMessage({"myArray":loader.myArray})
    })

  }
}
onmessage=ev=>{
    new LoadModel({url:ev.data.url})
}
