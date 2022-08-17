import {
	Vector3,
	Matrix4,
	Color,
	Vector4,
	FileLoader,
	LoadingManager,
	Object3D,
	InstancedMeshEx,
	MeshStandardMaterial,
  } from '../three/build/three';
import { GLTFLoaderEx } from '../three/examples/jsm/loaders/GLTFLoaderEx.js';
import { DRACOLoader } from '../three/examples/jsm/loaders/DRACOLoader.js';
import {ZipLoader } from '../ziploader.js';
import { SLMPicker } from '../SLMPicker';

import{
    SLMLoader,
    SLMSceneMeta,
    SLMConstansts
} from'../SLMLoader.js'
var scenePicker = new SLMPicker({});
onmessage = function(ev) {
    loading_sim(ev.data.meshIndex)
}
function loading_sim(meshIndex){
    loadJson(
        "assets/models/huayiConfig/"+meshIndex+".json",
        (data)=>{
            var matrixConfig=data.matrixConfig
            var structdesc0=data.structdesc0
            // console.log({
            //     "meshIndex":meshIndex,
            //     "matrixConfig":matrixConfig,
            //     "structdesc0":structdesc0
            // })
            loadSubGLB(
                addModel2,
                meshIndex,
                matrixConfig,
                structdesc0
            )
        }
    )
}
function loadJson(url,cb){
	var request = new XMLHttpRequest();
	request.open("get", url);//请求方法,路径
	request.send(null);//不发送数据到服务器
	request.onload = function () {//XHR对象获取后
		if (request.status === 200) {//获取成功的状态码
			var data=JSON.parse(request.responseText)
			cb(data)
		}
	}
}
function loadSubGLB (back,meshIndex,matrixConfig,structdesc0)
{
	var url="assets/models/huayi/"+meshIndex+".glb"
	var loader=new LoadingManager()
	new Promise(function( resolve, reject) {
		var myGLTFLoaderEx=new GLTFLoaderEx(loader)
		myGLTFLoaderEx.load(url, (gltf)=>{
			resolve(gltf)
		},()=>{},()=>{
			console.log("加载失败："+meshIndex)
			setTimeout(()=>{
				loadSubGLB(meshIndex,matrixConfig,structdesc0)
			},1000*(0.5*Math.random()+1))
		})
	} ).then( function ( gltf ) {
		var m1 = gltf.scene.children[0].children[0]
		//var arr=gltf.scene.children[0].children
		// back(m1,meshIndex,matrixConfig,structdesc0)
        console.log(
            "m1,meshIndex,matrixConfig,structdesc0",
            m1,meshIndex,matrixConfig,structdesc0
        )
        back(m1,meshIndex,matrixConfig,structdesc0)
	} )
}

function addModel2(m1,meshIndex,matrixConfig,structdesc0){
    // console.log(new SLMLoader({}))
    var m2=processMesh(
        m1, //mesh
        structdesc0,//实例化的矩阵？
        matrixConfig,
        m1.parent.matrix,//rootGroupNode.matrix,//mesh父节点的矩阵
        new SLMSceneMeta(
            new SLMLoader({}),//sceneMgr, 
            {geoInfo: null, propInfo: null, elemInfo: null, sceneTag: 1, groupInfo: null})//slmSceneMeta//slmSceneMeta //处理器？
        )
    console.log("finish:",m2)
    postMessage({
        // "normal":m2.geometry.attributes.normal.array,
        // "normal2":m2.geometry.attributes.normal,
        "geometry_attributes":m1.geometry.attributes,
        "geometry_groups":m1.geometry.groups,

        "color":m1.material.color,
        "meshIndex":meshIndex,
        "geometry":m1.geometry,
        "instanceCountList":m1.instanceCountList,

        "structdesc0":structdesc0,
        "matrixConfig":matrixConfig,
    })

    // instanceRoot.add(m2);
    // window.meshes[meshIndex]=m2;
    // m1.visible=false
    // console.log("addModel",meshIndex)
    // if(window.dynamicLoading)
    //     window.dynamicLoading.prePoint2=Math.random()//接下来进行遮挡剔除
        
}
function processMesh(
    node,  		//mesh
    groupStruct,//将mesh分成多段，每一段是一组
    instanceMatrixMap,
    rootGroupNode_matrix,//mesh父节点的矩阵
    slmSceneMeta//处理器？
){
    
    //console.log("rootGroupNode_matrix",rootGroupNode_matrix.elements)
    var groups = [];
    var instanceCountList = [];

    var clonedMaterial = new MeshStandardMaterial({color:node.material.color})//node.material.clone();
    clonedMaterial.transparent=false  //不是透明材质  //node.material的材质是透明材质
    var materialList = [clonedMaterial];
    var sceneCofigMeta = {
        id:  null,
        wireframe:  false,
        lighting:  false,
    };
    
    scenePicker.SetupInstancedShaderWithVertexColor(clonedMaterial, sceneCofigMeta);
    
    for (var i = 0; i < groupStruct.length ; ++i)//当前实例组中对象的个数
    {//groupStruct数组的每一个元素由‘i、n、c、s’四个部分构成 //{i: 3278（id无意义）, n: '313350', c: 12, s: 0}
        var groupName = groupStruct[i].n;  //实例化组的name
        // console.log("instanceMatrixMap[groupName]",instanceMatrixMap[groupName])
        if(!instanceMatrixMap[groupName]){
            instanceMatrixMap[groupName]={
                id:[],it:[]
            }
        }else{
            instanceMatrixMap[groupName]={
                id:instanceMatrixMap[groupName][0],
                it:instanceMatrixMap[groupName][1]
            }
        }
        // console.log("instanceMatrixMap[groupName]",instanceMatrixMap[groupName])
        instanceMatrixMap[groupName].it.push([1,0,0,0, 0,1,0,0, 0,0,1,0]);//加上本身
        instanceMatrixMap[groupName].id.push(parseInt(groupName));
        instanceCountList.push(instanceMatrixMap[groupName].id.length);

        var group = {//每一个实例组的参数
            name: groupStruct[i].n,//name 名字，groupName,
            start: groupStruct[i].s,  // 开始的位置
            count: groupStruct[i].c,  // 数量
            instanceCount: instanceMatrixMap[groupName].id.length, //示例组中对象的个数
            
            bounds: null,
            oc:false//不知道作用 //oc: groupInfo.ocGroup&&groupInfo.ocGroup[groupName] ? true : false,
        };
        groups.push(group);
    }
var instancedMesh = new InstancedMeshEx(
    node.geometry, 
    materialList, 
    1, 
    instanceCountList, 
    false//关闭光线？，sceneCofigMeta.lighting
);
instancedMesh.instanceCountList=instanceCountList
instancedMesh.geometry.clearGroups();

for (var groupIndex = 0; groupIndex < groups.length ; ++groupIndex)//每个实例组对应一个对象 //遍历这个mesh对应的实例组
{
    var group = groups[groupIndex];
    var instanceMatrixList = instanceMatrixMap[group.name].it; //实例组中每个对象的矩阵
    var instancedElemIds = instanceMatrixMap[group.name].id;
    instancedMesh.geometry.addGroupInstanced(group.start * 3, group.count * 3, 0, groupIndex, false);
    for (var i = 0; i < group.instanceCount; i++)
    {
            var mat = instanceMatrixList[i];
            var instanceMatrix = new Matrix4();
            instanceMatrix.set(
                        mat[0], mat[1], mat[2], mat[3],
                        mat[4], mat[5], mat[6], mat[7], 
                        mat[8], mat[9], mat[10], mat[11],
                        0, 0, 0, 1);
            instancedMesh.setInstanceMatrixAt(
                groupIndex, 
                i, 
                instanceMatrix.multiply(rootGroupNode_matrix)
            );
            var elementId = instancedElemIds[i];// Instanced element
            instancedMesh.setInstanceColorAt(
                groupIndex, 
                i, 
                new SLMLoader({}).EncodeElementPickingId(//encodedColor
                    slmSceneMeta.AddElementWitId(elementId),//elementPickingId, 
                    false
                )
            );					
            slmSceneMeta.SetElementDesc(elementId, {mesh: instancedMesh, gId: groupIndex, iId: i, sId: group.name, groupStart: group.start, groupCount: group.count, key: ( null)}, ( null));
            slmSceneMeta.SetElementMatrix(elementId, instanceMatrix.clone());
            slmSceneMeta.SetElementGroupMatrix(elementId, rootGroupNode_matrix.clone());
            //console.log('================= instance node');
    }
    
}

if (groups.length > 0)
{
    instancedMesh.layers.set(SLMConstansts.SceneLayerMask);
}
return instancedMesh
}