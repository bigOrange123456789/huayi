class Network{
    constructor(){
        this.ips=[
            "localhost"//"100.67.7.193"//"101.34.166.68",
            //"101.34.166.68",
            //"110.40.255.87",
            //"101.34.161.225",
            //"81.71.38.168"
        ]
        this.count= {}//记录每一个地址承担请求的个数
        for(var i=0;i<this.ips.length;i++)
            this.count[this.ips[i]]=0
    }
    getIP(){
        return this.ips[Math.floor(Math.random()*this.ips.length)]
    }
    myRequest(path,callback) {
        var ip=this.getIP()
        this.count[ip]++
        var oReq = new XMLHttpRequest();
        oReq.open("POST", "http://"+ip+":8081", true);
        oReq.responseType = "arraybuffer";
        oReq.onload = ()=>{
            this.count[ip]--
            var data=oReq.response;//ArrayBuffer
            var imageType = oReq.getResponseHeader("Content-Type");
            var blob = new Blob([data], { type: imageType });//用于图片解析
            var unityArray=new Uint8Array(data)//用于glb文件解析
            callback(unityArray,blob)
        }//接收数据
        oReq.onerror=(e)=>{
            console.log(e,path)//异常处理
        }
        oReq.send(path);//发送请求

    }
    getGlb(path,cb) {
        /*this.myRequest(path,unitArray=>{
            new THREE.GLTFLoader().parse(unitArray.buffer, './',glb=>
                cb(glb)
            );
        })*/
        new THREE.GLTFLoader().load(path,glb=>cb(glb))
    }
    getTexture(path,cb) {
        /*this.myRequest(path,(unityArray,blob)=>{
            var image = document.createElement('img')
            image.src =(window.URL || window.webkitURL).createObjectURL(blob);
            image.onload=function(){
                var texture = new THREE.Texture();
                texture.image =image;
                texture.needsUpdate = true;
                cb(texture)
            }
        })*/
        new THREE.TextureLoader().load(
            path,
            texture=>cb(texture)
        );
    }
    send(json0,cb) {
        var oReq = new XMLHttpRequest();
        oReq.open("POST", "http://localhost:8888", true);
        oReq.responseType = "arraybuffer";
        oReq.onload = function () {//接收数据
            var unitArray=new Uint8Array(oReq.response) //网络传输基于unit8Array
            //解析为文本
            var str=String.fromCharCode.apply(null,unitArray)
            cb(str)
        };
        oReq.send(JSON.stringify(json0));//发送请求
    }
}
export{Network};
