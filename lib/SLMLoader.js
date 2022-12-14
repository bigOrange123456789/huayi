import {
	Vector3,
	Matrix4,
	Color,
	Vector4,
	FileLoader,
	LoadingManager,
	Object3D,
	MeshEx,
	InstancedMeshEx,
	MeshStandardMaterial,
	BufferGeometryEx,
	BufferAttribute,
  } from '../lib/three/build/three';
import { GLTFLoaderEx } from '../lib/three/examples/jsm/loaders/GLTFLoaderEx.js';
import { DRACOLoader } from '../lib/three/examples/jsm/loaders/DRACOLoader.js';
import {ZipLoader } from './ziploader.js';
import { SLMPicker } from './SLMPicker';
import { DynamicLoading } from './myThree/DynamicLoading.js';
// import { Network } from './myThree/Network';

var SLMConstansts = SLMConstansts || {};
SLMConstansts.SceneLayerMask = 31;
SLMConstansts.OccluderLayerMask = 30;

var SLMSceneMeta = function(slmSceneMgr, options)
{
	this.slmSceneMgr = slmSceneMgr;

	this.baseElementPickingId = slmSceneMgr.GetTotalElementCount();

	this.elementDesc = {};

	this.elementMatrix = {};

	this.elementMatrixGroup = {};

	this.srcMeshGeoInfo = options.geoInfo ? options.geoInfo: null;

	this.propertiesData = options.propInfo ? options.propInfo: null;

	this.elementInfo = options.elemInfo ? (options.elemInfo.components ? options.elemInfo.components : options.elemInfo) : null;

	this.elementKeyprefix = options.elemInfo ? (options.elemInfo.keyprefix ? options.elemInfo.keyprefix : null): null;

	this.elementProperty = options.elemInfo ? (options.elemInfo.properties ? options.elemInfo.properties : null): null;

	this.elementPropValue = options.elemInfo ? (options.elemInfo.propvalus ? options.elemInfo.propvalus : null): null;

	this.elementMaterialEx = options.elemInfo ? (options.elemInfo.mtlEx ? options.elemInfo.mtlEx : null): null;

	this.elementKeyToIdMap = {};

	this.elementPickingIds = [];

	this.sceneTag = options.sceneTag ? options.sceneTag : null;//1

	var scope = this;

	this.GetSourceKey = function(simKey)
	{
		var srcKey = simKey;
		if (this.elementKeyprefix) // Rebuild full key
		{
			var strs = simKey.split('_');

			if (strs.length == 2)
			{
				srcKey = this.elementKeyprefix[strs[0]] + '_' + strs[1];
			}
		}

		return srcKey;
	}

	this.SetElementDesc = function(elementId, desc, key = null)
	{
		this.elementDesc[elementId] = desc;

		if (key)
		{
			var srcKey = this.GetSourceKey(key);

			if (!this.elementKeyToIdMap[srcKey])
			{
				this.elementKeyToIdMap[srcKey] = [];
			}

			this.elementKeyToIdMap[srcKey].push(elementId + this.baseElementPickingId);
		}
	}

	this.SetElementMatrix = function(elementId, matrix)
	{
		this.elementMatrix[elementId] = matrix;
	}

	this.SetElementGroupMatrix = function(elementId, matrix)
	{
		this.elementMatrixGroup[elementId] = matrix;
	}

	this.AddElementWitId = function(elementId)
	{
		var elementPickingId = elementId + this.slmSceneMgr.GetTotalElementCount();

		this.elementPickingIds.push(elementPickingId);

		return elementPickingId;
	}

	this.GetElementPickingIdByKey = function(elementKey)
	{
		if (this.elementKeyToIdMap[elementKey] !== undefined)
		{
			return this.elementKeyToIdMap[elementKey];
		}

		return null;
	}

	this.GetElementKeyByPickingId = function(elementPickingId)
	{
		var elemDesc = this.elementDesc[elementPickingId - this.baseElementPickingId];

		return elemDesc.key;
	}

	this.GetElementGeometryDesc = function(elementPickingId)
	{
		var elemDesc = this.elementDesc[elementPickingId - this.baseElementPickingId];

		var geometryDesc = 
		{
			positionBuffer: elemDesc.mesh.geometry.attributes.position.data,
			indexBuffer: elemDesc.mesh.geometry.index,
			indexOffset: elemDesc.groupStart * 3,
			triangleCount: elemDesc.groupCount, 
			matrix: new Matrix4().multiplyMatrices(this.elementMatrix[elementPickingId - this.baseElementPickingId], this.elementMatrixGroup[elementPickingId - this.baseElementPickingId])
		}

		return geometryDesc;
	}

	this.GetElementBounds = function(elementPickingId)
	{
		if (this.elementInfo)
		{
			var elemItem = this.elementInfo[elementPickingId - this.baseElementPickingId];

			var bounds = {
				min: elemItem.minBoundary ? elemItem.minBoundary : {
					x: elemItem.a[0] ,
					y: elemItem.a[1] ,
					z: elemItem.a[2]
				},
				max: elemItem.maxBoundary ? elemItem.maxBoundary : {
					x: elemItem.b[0] ,
					y: elemItem.b[1] ,
					z: elemItem.b[2]
				}
			};
			
			return bounds;
		}

		return null;
	}

	this.GetMaterialEx = function(mtlKey)
	{
		if (this.elementMaterialEx)
		{
			return this.elementMaterialEx[mtlKey];
		}

		return null;
	}

	this.GetElementInfo = function(elementPickingId)
	{
		if (this.elementInfo)
		{
			var elemItem = this.elementInfo[elementPickingId - this.baseElementPickingId];

			if (this.elementProperty)
			{
				if (this.elementPropValue)
				{
					var elemProp = {};
				
					for(var sk in this.elementProperty[elemItem.k])
					{
						if (sk === 'bc' || sk === 'fn' || sk === 'fs' || sk === 't' || sk === 'n') 
						{
							elemProp[sk] = this.elementPropValue[this.elementProperty[elemItem.k][sk]];
						}
						else
						{
							elemProp[sk] = this.elementProperty[elemItem.k][sk];
						}
						
					}

					return elemProp;
				}
				else
				{
					return this.elementProperty[elemItem.k];
				}	
			}

			return elemItem;
		}
		
		return null;
	}

	this.GetElementCount = function()
	{
		return this.elementPickingIds.length;
	}

	this.GetElementDesc = function(elementPickingId)
	{
		return this.elementDesc[elementPickingId - this.baseElementPickingId];
	}

	this.GetElementDescWithInternalId = function(elementPickingId)
	{
		return this.elementDesc[elementPickingId];
	}

	this.GetElementPickingIdWithRelativeId = function(elementRelativeId)
	{
		return elementRelativeId + this.baseElementPickingId;
	}

	this.GetElementRelativeIdWithPickingId = function(elementPickingId)
	{
		return elementPickingId - this.baseElementPickingId;
	}

	this.GetElementGroupDesc = function(elementPickingId)
	{
		var accumCounter = 0;
		for (var i = 0; i < this.propertiesData.length; ++i)
		{
			if (this.propertiesData[i].g + accumCounter >= (elementPickingId - this.baseElementPickingId))
			{
				// Collect element dess
				var elemGroupDesc = [];
				var elemGroupIds = [];

				if (!this.propertiesData[i].prop["??????"])
				{
					return [];
				}
				
				var upbound = this.propertiesData[i].g + accumCounter;
				for (var ei = accumCounter; ei < upbound; ++ei)
				{
					elemGroupDesc.push(this.elementDesc[ei]);
					elemGroupIds.push(this.baseElementPickingId + ei);
				}

				var rt = {
					groupDescs: elemGroupDesc,
					groupIds: elemGroupIds
				};

				return rt;
			}

			accumCounter += this.propertiesData[i].g;
		}

		return [];
	}

	this.GetElementMatrix = function(elementPickingId)
	{
		return this.elementMatrix[elementPickingId - this.baseElementPickingId];
	}

	this.GetElementGroupMatrix = function(elementPickingId)
	{
		return this.elementMatrixGroup[elementPickingId - this.baseElementPickingId];
	}

	this.GetElementProperty = function(elementPickingId)
	{
		var accumCounter = 0;
		for (var i = 0; i < this.propertiesData.length; ++i)
		{
			if (this.propertiesData[i].g + accumCounter > (elementPickingId - this.baseElementPickingId))
			{
				return this.propertiesData[i].prop;
			}

			accumCounter += this.propertiesData[i].g;
		}

		return {};
	}

	this.GetElementGroupBoundsCenter = function(elementPickingId)
	{
		var accumCounter = 0;
		for (var i = 0; i < this.propertiesData.length; ++i)
		{
			if (this.propertiesData[i].g + accumCounter >= (elementPickingId - this.baseElementPickingId))
			{
				if (this.propertiesData[i].bounds && this.propertiesData[i].bounds.center)
				{
					return new Vector3(this.propertiesData[i].bounds.center[0], 
										this.propertiesData[i].bounds.center[1], 
										this.propertiesData[i].bounds.center[2]);
				}

				return null;
			}

			accumCounter += this.propertiesData[i].g;
		}

		return null;
	}

	this.GetElementGroupBounds = function(elementPickingId)
	{
		var accumCounter = 0;
		for (var i = 0; i < this.propertiesData.length; ++i)
		{
			if (this.propertiesData[i].g + accumCounter >= (elementPickingId - this.baseElementPickingId))
			{
				if (this.propertiesData[i].bounds && this.propertiesData[i].bounds.center)
				{
					return {center: new Vector3(this.propertiesData[i].bounds.center[0], this.propertiesData[i].bounds.center[1], this.propertiesData[i].bounds.center[2]), 
							size: new Vector3(this.propertiesData[i].bounds.size[0], this.propertiesData[i].bounds.size[1], this.propertiesData[i].bounds.size[2])
					}
				}

				return null;
			}

			accumCounter += this.propertiesData[i].g;
		}

		return null;
	}
	
	this.QueryElementFromProperty = function(property)
	{
		var accumCounter = 0;

		var elemRt = [];

		for (var i = 0; i < this.propertiesData.length; ++i)
		{
			if (this.propertiesData[i].prop['??????'] == property.name && 
				this.propertiesData[i].prop['??????'] == property.code)
			{
				elemRt.push(this.baseElementPickingId + accumCounter + 1);// + Math.floor(this.propertiesData[i].g / 2));
				//return this.baseElementPickingId + accumCounter + Math.floor(this.propertiesData[i].g / 2);
			}

			accumCounter += this.propertiesData[i].g;
		}

		if (elemRt.length > 0)
		{
			return elemRt;
		}

		return null;
	}
};

var SLMLoader = function(options)
{
	var scope = this;

	this.options = options;

	this.MaxColorIdStep = (options && options.MaxColorIdStep !== undefined) ? options.MaxColorIdStep : 40;

	this.EnablePicking = (options && options.EnablePicking !== undefined) ? options.EnablePicking : false;

	this.EnableCulling = (options && options.EnableCulling !== undefined) ? options.EnableCulling : false;

	this.sceneMetas = [];

	this.totalElementCount = 0;
	
	this.pickingIdToSceneMeta = {};

	this.scenePicker = new SLMPicker(
	{
		EnablePicking: this.EnablePicking,
		renderer: (options && options.renderer != undefined) ? options.renderer : null,
		scene: (options && options.scene != undefined) ? options.scene : null,
		el:  (options && options.el != undefined) ? options.el : null,
	});
	// console.log({
	// 	EnablePicking: this.EnablePicking,
	// 	renderer: (options && options.renderer != undefined) ? options.renderer : null,
	// 	scene: (options && options.scene != undefined) ? options.scene : null,
	// 	el:  (options && options.el != undefined) ? options.el : null,
	// })

	this.sceneCullers = [];

	this.sceneTasks= [];

	this.managedGroups = [];

	this.ocGroups = [];

	this.render = function(camera, sceneModelToWorldMatrix)
	{
		for (var i = 0; i < this.sceneCullers.length; ++i)
		{
			//this.sceneCullers[i].render(camera, sceneModelToWorldMatrix);
		}
	}

	this.getAllSceneGroups = function()
	{
		return this.managedGroups;
	}

	this.getSceneGroup = function(groupIndex)
	{
		return this.managedGroups[groupIndex];
	}

	this.GetTotalElementCount = function()
	{
		return this.totalElementCount;
	}

	this.AddScene = function(slmSceneMeta, cullerOptions)
	{
		this.sceneMetas.push(slmSceneMeta);

		this.totalElementCount += slmSceneMeta.GetElementCount();

		for (var i = 0; i < slmSceneMeta.elementPickingIds.length; ++i)
		{
			this.pickingIdToSceneMeta[slmSceneMeta.elementPickingIds[i]] = this.sceneMetas[this.sceneMetas.length - 1];
		}

		if (cullerOptions)
		{
			var sceneCuller = new SLMCuller({
				EnableCulling: this.EnableCulling,
				renderer: (scope.options && scope.options.renderer != undefined) ? scope.options.renderer : null,
				el:  (scope.options && scope.options.el != undefined) ? scope.options.el : null,
				sceneOccluder: (scope.options &&scope. options.sceneOccluder != undefined) ? scope.options.sceneOccluder : null,
			});

			sceneCuller.setup(cullerOptions);

			this.sceneCullers.push(sceneCuller);

			this.managedGroups = cullerOptions.managedGroups;

			this.ocGroups = cullerOptions.ocGroups;
		}
	}

	this.GetMetaFromPickingId = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId];
	}

	this.GetElementDesc = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementDesc(elementPickingId);
	}

	this.GetElementDescWithInternalId = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementDescWithInternalId(elementPickingId);
	}

	this.GetElementMatrix = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementMatrix(elementPickingId);
	}

	this.GetElementGroupMatrix = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementGroupMatrix(elementPickingId);
	}

	this.GetElementBoundsCenter = function(elementPickingId)
	{
		var elemDesc = this.GetElementDesc(elementPickingId);
		var elementSrcId = elemDesc.sId;

		var meta = this.GetMetaFromPickingId(elementPickingId);
    	var center = new Vector3(meta.srcMeshGeoInfo[elementSrcId].c[0], meta.srcMeshGeoInfo[elementSrcId].c[1], meta.srcMeshGeoInfo[elementSrcId].c[2]);

    	center.applyMatrix4(this.GetElementMatrix(elementPickingId));

    	return center;
	}

	this.GetElementBounds = function(elementPickingId)
	{
		var sceneMeta = this.GetMetaFromPickingId(elementPickingId);

		return sceneMeta.GetElementBounds(elementPickingId);
	}

	this.GetElementInfo = function(elementPickingId)
	{
		var sceneMeta = this.GetMetaFromPickingId(elementPickingId);

		return sceneMeta.GetElementInfo(elementPickingId);
	}

	this.GetElementGroupBoundsCenter = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementGroupBoundsCenter(elementPickingId);
	}

	this.GetElementGroupBounds = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementGroupBounds(elementPickingId);
	}
	
	this.GetElementProperty = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementProperty(elementPickingId);
	}

	this.GetAllProperties = function()
	{
		var propList = [];

		for (var i = 0 ; i < this.sceneMetas.length; ++i)
		{
			propList.push(this.sceneMetas[i].propertiesData);
		}

		return propList;
	}

	this.GetElementPickingIdByKey = function(elementKey)
	{
		for (var i = 0 ; i < this.sceneMetas.length; ++i)
		{
			var elementPickingIds = this.sceneMetas[i].GetElementPickingIdByKey(elementKey)
			if (elementPickingIds !== undefined)
			{
				return elementPickingIds;
			}
		}

		return null;
	}

	this.GetElementKeyByPickingId = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementKeyByPickingId(elementPickingId);
	}

	this.GetElementGeometryDesc = function(elementPickingId)
	{
		return this.pickingIdToSceneMeta[elementPickingId].GetElementGeometryDesc(elementPickingId);
	}

	this.QueryElementFromProperty = function(property)
	{
		if (!property.name)
		{
			return null;
		}

		for (var i = 0 ; i < this.sceneMetas.length; ++i)
		{
			var elementPickingId = this.sceneMetas[i].QueryElementFromProperty(property)
			if (elementPickingId !== undefined)
			{
				return elementPickingId;
			}
		}

		return null;
	}

	this.SetElementGroupState = function(elementPickingId, isPicked)
	{
		if (!this.pickingIdToSceneMeta[elementPickingId])
		{
			return;
		}

		var elemGroup = this.pickingIdToSceneMeta[elementPickingId].GetElementGroupDesc(elementPickingId);

		var elemGroupDesc = elemGroup.groupDescs;
		var elemGroupId = elemGroup.groupIds;

		for (var i = 0; i < elemGroupDesc.length; ++i)
		{
			var color4 = new Vector4();
			elemGroupDesc[i].mesh.getInstanceColorAt(elemGroupDesc[i].gId, elemGroupDesc[i].iId, color4);

			elemGroupDesc[i].mesh.setInstanceColorAt(elemGroupDesc[i].gId, elemGroupDesc[i].iId, this.EncodeElementPickingId(elemGroupId[i], isPicked, color4.w < 0.0 ? false : true));
		}
	}

	this.SetElementState = function(elementPickingId, isPicked)
	{
		if (!this.pickingIdToSceneMeta[elementPickingId])
		{
			return;
		}

		var elemDesc = this.pickingIdToSceneMeta[elementPickingId].GetElementDesc(elementPickingId);

		var color4 = new Vector4();
		elemDesc.mesh.getInstanceColorAt(elemDesc.gId, elemDesc.iId, color4);

		elemDesc.mesh.setInstanceColorAt(elemDesc.gId, elemDesc.iId, this.EncodeElementPickingId(elementPickingId, isPicked, color4.w < 0.0 ? false : true));
	}

	this.GetElementSceneTag = function(elementPickingId)
	{
		if (!scope.pickingIdToSceneMeta[elementPickingId])
		{
			return;
		}

		return scope.pickingIdToSceneMeta[elementPickingId].sceneTag;
	}

	this.GetElementPickingId = function(elemId, sceneTag)
	{
		if (sceneTag)
		{
			for (var i = 0; i < scope.sceneMetas.length; ++i)
			{
				if (scope.sceneMetas[i].sceneTag === sceneTag)
				{
					return scope.sceneMetas[i].GetElementPickingIdWithRelativeId(elemId);
				}
			}
		}

		return null;
	}

	this.GetElementRelativeId = function(elementPickingId)
	{
		var relativeId = 
		{
			tag: this.pickingIdToSceneMeta[elementPickingId].sceneTag, 
			id: this.pickingIdToSceneMeta[elementPickingId].GetElementRelativeIdWithPickingId(elementPickingId)
		};

		return relativeId;
	}

	this.ShowElement = function(elementPickingId, isVisible, sceneTag)
	{
		if (Array.isArray(elementPickingId))
		{
			if (sceneTag)
			{
				for (var i = 0; i < scope.sceneMetas.length; ++i)
				{
					if (scope.sceneMetas[i].sceneTag === sceneTag)
					{
						for (var eindex = 0; eindex < elementPickingId.length; ++eindex)
						{
							var elemDesc = scope.sceneMetas[i].GetElementDescWithInternalId(elementPickingId[eindex]);
	
							elemDesc.mesh.setInstanceColorAt(elemDesc.gId, elemDesc.iId, scope.EncodeElementPickingId(elementPickingId[eindex], false, isVisible));
						}

						return;
					}
				}
			}
			else
			{
				for (var eindex = 0; eindex < elementPickingId.length; ++eindex)
				{
					if (!scope.pickingIdToSceneMeta[elementPickingId[eindex]])
					{
						return;
					}
	
					var elemDesc = scope.pickingIdToSceneMeta[elementPickingId[eindex]].GetElementDesc(elementPickingId[eindex]);
			
					elemDesc.mesh.setInstanceColorAt(elemDesc.gId, elemDesc.iId, scope.EncodeElementPickingId(elementPickingId[eindex], false, isVisible));
				}
			}
		}
		else
		{
			if (sceneTag)
			{
				for (var i = 0; i < scope.sceneMetas.length; ++i)
				{
					if (scope.sceneMetas[i].sceneTag === sceneTag)
					{
						var elemDesc = scope.sceneMetas[i].GetElementDescWithInternalId(elementPickingId);
	
						elemDesc.mesh.setInstanceColorAt(elemDesc.gId, elemDesc.iId, scope.EncodeElementPickingId(elementPickingId, false, isVisible));

						return;
					}
				}
			}
			else
			{
				if (!scope.pickingIdToSceneMeta[elementPickingId])
				{
					return;
				}

				var elemDesc = scope.pickingIdToSceneMeta[elementPickingId].GetElementDesc(elementPickingId);
		
				elemDesc.mesh.setInstanceColorAt(elemDesc.gId, elemDesc.iId, scope.EncodeElementPickingId(elementPickingId, false, isVisible));
			}
		}
	}

	this.SetGlobalEdgeColor = function(color)
	{
		scope.scenePicker.SetGlobalEdgeColor(color);
	}

	this.SetGlobalEdgeThickness = function(thickness)
	{
		scope.scenePicker.SetGlobalEdgeThickness(thickness);
	}

	// Geometry interaction
	this.RotateAroundPoint = function(elementPickingId, pointWoldPosition, axis, radian)
	{
		var mat0 = new Matrix4();
		mat0.multiply(this.GetElementMatrix(elementPickingId)).multiply(this.GetElementGroupMatrix(elementPickingId));

		var xAxis = axis.normalize();

		var trans0 = new Matrix4().makeTranslation(pointWoldPosition.x, pointWoldPosition.y, pointWoldPosition.z);
		var rot = new Matrix4().makeRotationAxis(xAxis, radian);
		var trans1 = new Matrix4().makeTranslation(-pointWoldPosition.x, -pointWoldPosition.y, -pointWoldPosition.z)

		var mat1 = new Matrix4();
		mat1.multiply(trans0).multiply(rot).multiply(trans1);

		var finalMat = new Matrix4();
		finalMat.multiply(mat1).multiply(mat0);

		var elemDesc = this.GetElementDesc(elementPickingId);
		elemDesc.mesh.setInstanceMatrixAt(elemDesc.gId, elemDesc.iId, finalMat);

		elemDesc.mesh.instanceMatrices[elemDesc.gId].needsUpdate = true;
	}

	this.RotateElement = function(elementPickingId, axis, radian)
	{
		var mat0 = new Matrix4();
		mat0.multiply(this.GetElementMatrix(elementPickingId)).multiply(this.GetElementGroupMatrix(elementPickingId));

		var center = this.GetElementBoundsCenter(elementPickingId);

		var xAxis = axis.normalize();

		var trans0 = new Matrix4().makeTranslation(center.x, center.y, center.z);
		var rot = new Matrix4().makeRotationAxis(xAxis, radian);
		var trans1 = new Matrix4().makeTranslation(-center.x, -center.y, -center.z)

		var mat1 = new Matrix4();
		mat1.multiply(trans0).multiply(rot).multiply(trans1);

		var finalMat = new Matrix4();
		finalMat.multiply(mat1).multiply(mat0);

		var elemDesc = this.GetElementDesc(elementPickingId);
		elemDesc.mesh.setInstanceMatrixAt(elemDesc.gId, elemDesc.iId, finalMat);

		elemDesc.mesh.instanceMatrices[elemDesc.gId].needsUpdate = true;
	}

	this.TranslateElement = function(elementPickingId, translation)
	{
		var mat0 = new Matrix4();
		mat0.multiply(this.GetElementMatrix(elementPickingId)).multiply(this.GetElementGroupMatrix(elementPickingId));

		var trans0 = new Matrix4().makeTranslation(translation.x, translation.y, translation.z);

		var mat1 = new Matrix4();
		mat1.multiply(trans0)

		var finalMat = new Matrix4();
		finalMat.multiply(mat1).multiply(mat0);

		var elemDesc = this.GetElementDesc(elementPickingId);
		elemDesc.mesh.setInstanceMatrixAt(elemDesc.gId, elemDesc.iId, finalMat);

		elemDesc.mesh.instanceMatrices[elemDesc.gId].needsUpdate = true;
	}

	this.SetComponentMatrix = function(elementPickingId, matrix)
	{
		var mat0 = new Matrix4();
		mat0.multiply(this.GetElementMatrix(elementPickingId)).multiply(this.GetElementGroupMatrix(elementPickingId));

		var center = this.GetElementBoundsCenter(elementPickingId);

		var trans0 = new Matrix4().makeTranslation(center.x, center.y, center.z);
		var rot = matrix;
		var trans1 = new Matrix4().makeTranslation(-center.x, -center.y, -center.z)

		var mat1 = new Matrix4();
		mat1.multiply(trans0).multiply(rot).multiply(trans1);

		var finalMat = new Matrix4();
		finalMat.multiply(mat1).multiply(mat0);

		var elemDesc = this.GetElementDesc(elementPickingId);
		elemDesc.mesh.setInstanceMatrixAt(elemDesc.gId, elemDesc.iId, finalMat);

		elemDesc.mesh.instanceMatrices[elemDesc.gId].needsUpdate = true;
	}
	
	this.EncodeElementPickingId = function(elementPickingId, isPicked, isVisible = true)
	{
	  return this.EncodeElementPickingIdEx(elementPickingId, isVisible, false, isPicked ? new Color(255, 0, 0) : new Color(0, 0, 0) );
	}

	this.EncodeElementPickingIdEx = function(elementPickingId, isVisible = true, isTransparent = false, color = new Color(0, 0, 0))
	{
	  var idColor = new Color(elementPickingId * this.MaxColorIdStep);

	  var colorValue =  Math.floor(color.r * 0.5) + Math.floor(color.g * 0.5) * 128.0  + Math.floor(color.b * 0.5) * 16384.0;

	  return new Vector4(idColor.r, idColor.g , idColor.b, isVisible ? ((isTransparent ? -1.0 : 1.0) * (1.0 + 4.0 * colorValue)): 0.0);
	}

	this.DecodeElementPickingId = function(pickedId)
	{
		var elementPickingId = pickedId / this.MaxColorIdStep;

		return elementPickingId;
	}

	this.PickElementByMouse = function(mouseX, mouseY/* 0 <= mouseX <=1, 0 <= mouseY <= 1*/, activeCamera, callback)
	{
		//var pickedId = this.scenePicker.GetPickedIdByMouse(mouseX, mouseY/* 0 <= mouseX <=1, 0 <= mouseY <= 1*/, activeCamera, callback);
		//if (pickedId < 0xffffff)
		{
			//return this.DecodeElementPickingId(pickedId);
		}
		return null;
	}

	this.PickElementByMouseEx = function(mouseX, mouseY/* 0 <= mouseX <=1, 0 <= mouseY <= 1*/, activeCamera, callback)
	{
		//var rt = this.scenePicker.GetPickedIdByMouseEx(mouseX, mouseY/* 0 <= mouseX <=1, 0 <= mouseY <= 1*/, activeCamera, callback);
		/*if (rt.pickedId < 0xffffff)
		{
			var elemEx = 
			{
				pickingId: this.DecodeElementPickingId(rt.pickedId),
				normal: rt.normal,
				position: rt.position,
			}

			return elemEx;
		}*/
		return null;
	}

	this.PushSceneTask = function(params)
	{
		this.sceneTasks.push(params);
	}

	this.BuildScene = function(singleSceneCallbackSync, allScenesCallbackSync)
	{
		for (var i = 0 ; i < this.sceneTasks.length; ++i)
		{
			var sceneBuilder = new SLMSceneBuilder(this);
			//this.sceneTasks[i].gltfScene.parent.position.set(0, 0.0, 0.0)
			sceneBuilder.BuildScene(this.sceneTasks[i], singleSceneCallbackSync);
		}
	}

	this.LoadScene = function(multiScenes, singleSceneCallbackAsync, allScenesCallbackAsync, singleSceneCallbackSync, allScenesCallbackSync)
	{
		this.multiScenes = multiScenes;
		this.multiSceneCounter = 0;

		function eachSceneCallback(slmScene, sceneTag)
		{
			if (singleSceneCallbackAsync)
			{
				singleSceneCallbackAsync(slmScene, sceneTag);
			}

			scope.multiSceneCounter++;
			
			if (scope.multiSceneCounter >= scope.multiScenes.length)
			{
				if (allScenesCallbackAsync)
				{
					allScenesCallbackAsync();
				}

				scope.BuildScene(singleSceneCallbackSync, allScenesCallbackSync);
			}
		}

		for (var i = 0 ; i < multiScenes.length; ++i)
		{
			var slmSceneLoader = new SLMSceneParser(this);
			window.addMoment("this.LoadScene ????????????"+multiScenes[i].url)
			slmSceneLoader.load(multiScenes[i].url, eachSceneCallback, multiScenes[i].tag);
		}

	}
}

var SLMSceneBuilder = function(sceneMgr, options)
{
	var scope = this;

	this.sceneMgr = sceneMgr;
	
	function InstanceNode(gltfScene, iMatrix, structDesc)//??????
	{
		window.addMoment("instanceNode start")
		
		
		// structDesc=structDesc[0]
		window.meshes={}//??????????????????
		window.loadedLZC={}
		console.log("gltfScene:",gltfScene)		//Group //scene:[group:<MeshEx, MeshEx>]
		console.log("iMatrix:",iMatrix,Object.keys(iMatrix).length) //???it???id?????????it???id???????????? ??????????????????????????? //it???????????????????????????????????????????????????id??????????????????????????????
		console.log("structDesc:",structDesc)	//????????????,???????????????????????????(MeshEx),??????????????????????????? //????????????????????? i:, n:, c: , s:  //{"i":262,"n":"18708","c":12,"s":12}
		var count=0
		for(var i=0;i<structDesc.length;i++){
			count=count+structDesc[i].length
		}
		console.log("iMatrix.length",count)

		var slmSceneMeta = new SLMSceneMeta(scope.sceneMgr, {geoInfo: null, propInfo: null, elemInfo: null, sceneTag: scope.sceneTag, groupInfo: null});

		var instanceRoot = new Object3D(); //InstancedMeshEx???????????? ??????rootGroupNode??????
		gltfScene.add(instanceRoot);
		// var dataParse=new DataParse({
		// 	parent:instanceRoot,
		// 	sceneMgr:scope.sceneMgr,
		// 	SLMConstansts:SLMConstansts
		// })
		var rootGroupNode = gltfScene.children[0]; // MeshEx????????????
		var meshNodeList = rootGroupNode.children; // MeshEx??????:<MeshEx, MeshEx>
		console.log("meshNodeList.length",meshNodeList.length)
		for (var meshIndex = 0; meshIndex < meshNodeList.length ; ++meshIndex)//meshNodeList.length == structDesc.length
		{
			if(window.loadedLZC[meshIndex]) return;
			else window.loadedLZC[meshIndex]=1;
			addModel2(meshNodeList[meshIndex],meshIndex,
				iMatrix,
				structDesc[meshIndex]
				)
			
			// meshNodeList[meshIndex].visible=false
		}
		
		scope.sceneMgr.AddScene(slmSceneMeta, null);
		
		if (scope.finishCallback)
			scope.finishCallback(gltfScene, scope.sceneTag, scope.bvhScene);
		
		SetupMaterials();
		for(var i=0;i<=267;i++){//for(var i=0;i<240;i++){
			// loading(i)
		}
		console.log("?????????")
		function loading(meshIndex) {//????????????
			if(!window.loadedLZC)window.loadedLZC={}
			if(window.loadedLZC[meshIndex]) return;
			else window.loadedLZC[meshIndex]=1;
			loadSubZip3(addModel2,meshIndex)
			// loadSubZip2(addModel2,meshIndex)
		}

		function addModel2(m1,meshIndex,matrixConfig,structdesc0){
			if(window.loadSubZip_test){
				if(window.loadSubZip_test.addModel2_first_time===-1){//???????????????addmodels
					window.loadSubZip_test.addModel2_first_time=
						performance.now()-window.loadSubZip_test.time0
					
				}
				window.loadSubZip_test.addModel2_last_time=
					performance.now()-window.loadSubZip_test.time0
				window.loadSubZip_test.addModel_count++
			}
			var m2=processMesh(
				m1, //mesh
				structdesc0,//?????????????????????
				matrixConfig,
				m1.parent.matrix,//rootGroupNode.matrix,//mesh??????????????????
				// new SLMSceneMeta(
				// 	new SLMLoader({}),//scope.sceneMgr, 
				// 	{geoInfo: null, propInfo: null, elemInfo: null, sceneTag: scope.sceneTag, groupInfo: null}
				// ),//slmSceneMeta//
				slmSceneMeta //????????????
			)	

			instanceRoot.add(m2);
			window.meshes[meshIndex]=m2;
			m1.visible=false
			console.log("addModel",meshIndex)
			if(window.dynamicLoading)
				window.dynamicLoading.prePoint2=Math.random()//???????????????????????????
				
		}
		
		window.addMoment("InstanceNode end")

		window.addMoment("loadZipJson start")
		loadZipJson("assets/models/6.ls_d.json.zip",(data)=>{
			if(false){//????????????????????????
				console.log("?????????loadSubZip????????????")
				window.loadSubZip_test={
					time0:performance.now(),
					addModel2_first_time:-1,
					addModel_count:0,
					result:[],
					result_arr:[]
				}
				var frame_count=0
				function test(){
					frame_count++
					requestAnimationFrame(test)
				}test()
				var min_FPS=100
				var min_FPS_all=100
				var frame_count_pre=frame_count
				setInterval(()=>{
					var fps=frame_count-frame_count_pre
					if(fps<min_FPS)min_FPS=fps
					if(fps<min_FPS_all)min_FPS_all=fps
					frame_count_pre=frame_count
				},1000)
				var stage_start_time=performance.now()
				function print0(ID){
					var now_time=performance.now()-window.loadSubZip_test.time0
					var result={
						ID:ID,
						stage_time:Math.round(performance.now()-stage_start_time),
						now_time:Math.round(now_time),
						addModel_count:window.loadSubZip_test.addModel_count,
						addModel2_first_time: 
							Math.round(window.loadSubZip_test.addModel2_first_time),
						addModel2_last_time:
							Math.round(window.loadSubZip_test.addModel2_last_time),
						all_frame_count:frame_count,
						all_FPS_AVE:
							Math.round(1000*frame_count/now_time,3),
						stage_min_FPS:min_FPS,
						min_FPS_all:min_FPS_all,
					}
					window.loadSubZip_test.result.push(result)
					if(window.loadSubZip_test.result_arr.length===0)
					window.loadSubZip_test.result_arr.push([
						'ID',
						'stage_time',
						'now_time',
						'addModel_count',
						'addModel2_first_time',
						'addModel2_last_time',
						'all_frame_count',
						'all_FPS_AVE',
						'stage_min_FPS',
						'min_FPS_all',
					])
					window.loadSubZip_test.result_arr.push([
						result.ID,
						result.stage_time,
						result.now_time,
						result.addModel_count,
						result.addModel2_first_time,
						result.addModel2_last_time,
						
						result.all_frame_count,
						result.all_FPS_AVE,
						result.stage_min_FPS,
						result.min_FPS_all,
					])

					console.log(
						result,
						window.loadSubZip_test,
						window.loadSubZip_test.result_arr
						)
					stage_start_time=performance.now()
					min_FPS=100
					
				}
				setTimeout(()=>{
					print0("0.5s")
				},500)
				setTimeout(()=>{
					print0("1s")
				},1000)
				setTimeout(()=>{
					print0("3s")
				},3000)
				setTimeout(()=>{
					print0("5s")
				},5000)
				setTimeout(()=>{
					print0("10s")
				},10*1000)
				setTimeout(()=>{
					print0("15s")
				},15*1000)
				setTimeout(()=>{
					print0("25s")
				},25*1000)
				setTimeout(()=>{
					print0("30s")
				},30*1000)
				setTimeout(()=>{
					print0("35s")
				},35*1000)
				setTimeout(()=>{
					print0("40s")
				},40*1000)
				setTimeout(()=>{
					print0("45s")
				},45*1000)

			}
			window.addMoment("loadZipJson start")
			window.dynamicLoading=new DynamicLoading({"loading":loading,"data_test":data})
			
		})
	}
	
	function processMesh(
			node,  		//mesh
			groupStruct,//???mesh?????????????????????????????????
			instanceMatrixMap,
			rootGroupNode_matrix,//mesh??????????????????
			slmSceneMeta//????????????
		){
			
			//console.log("rootGroupNode_matrix",rootGroupNode_matrix.elements)
			var groups = [];
			var instanceCountList = [];

			var clonedMaterial = new MeshStandardMaterial({color:node.material.color})//node.material.clone();
			clonedMaterial.transparent=false  //??????????????????  //node.material????????????????????????
			var materialList = [clonedMaterial];
			var sceneCofigMeta = {
				id:  null,
				wireframe:  false,
				lighting:  false,
			};
			if (scope.sceneMgr.EnablePicking)
			{
				scope.sceneMgr.scenePicker.SetupInstancedShaderWithVertexColor(clonedMaterial, sceneCofigMeta);
			}
			for (var i = 0; i < groupStruct.length ; ++i)//?????????????????????????????????
			{//groupStruct??????????????????????????????i???n???c???s????????????????????? //{i: 3278???id????????????, n: '313350', c: 12, s: 0}
				var groupName = groupStruct[i].n;  //???????????????name
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
				instanceMatrixMap[groupName].it.push([1,0,0,0, 0,1,0,0, 0,0,1,0]);//????????????
				instanceMatrixMap[groupName].id.push(parseInt(groupName));
				instanceCountList.push(instanceMatrixMap[groupName].id.length);

				var group = {//???????????????????????????
					name: groupStruct[i].n,//name ?????????groupName,
					start: groupStruct[i].s,  // ???????????????
					count: groupStruct[i].c,  // ??????
					instanceCount: instanceMatrixMap[groupName].id.length, //???????????????????????????
					
					bounds: null,
					oc:false//??????????????? //oc: groupInfo.ocGroup&&groupInfo.ocGroup[groupName] ? true : false,
				};
				groups.push(group);
			}
		var instancedMesh = new InstancedMeshEx(
			node.geometry, 
			materialList, 
			1, 
			instanceCountList, 
			false//??????????????????sceneCofigMeta.lighting
		);
		instancedMesh.geometry.clearGroups();

		for (var groupIndex = 0; groupIndex < groups.length ; ++groupIndex)//????????????????????????????????? //????????????mesh??????????????????
		{
			var group = groups[groupIndex];
			var instanceMatrixList = instanceMatrixMap[group.name].it; //?????????????????????????????????
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
						scope.sceneMgr.EncodeElementPickingId(//encodedColor
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

	function SetupMaterials()
	{
		scope.sceneMgr.scenePicker.SetupMaterials();
	}

	this.BuildScene= function(task, finishCallback)
	{
		window.scene.add(task.gltfScene)
		window.addMoment("BuildScene ???????????????????????????")
		//task.gltfScene.parent.position.set(0, 0.0, 0.0)
		this.finishCallback = finishCallback;
		this.sceneTag = task.sceneTag;sceneMgr

		if (task.iMatrix && task.structDesc)
		{
			InstanceNode(task.gltfScene, task.iMatrix, task.structDesc, task.geoInfo, task.propInfo, task.elemInfo, task.groupDesc);
		}
		else
		{
			if (scope.finishCallback)
			{
				scope.finishCallback(task.gltfScene, scope.sceneTag, scope.bvhScene);
			}
		}
	}
}

var SLMSceneParser = function(sceneMgr)
{
	var scope = this;

	this.sceneMgr = sceneMgr;

	this.finishCallback = null;

	var loadingManager = new LoadingManager();
	// Intercept and override relative URLs.
	loadingManager.setURLModifier((url, path) => 
	{
	  return (path || '') + url;
	});

	loadingManager.onProgress = function ( url, itemsLoaded, itemsTotal )
	{
	  //console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
	};

	function loadJsonList(targetScene, urls, mananger, callback)
	{
		var dataList = [];
		var counter = 0;
		var urlList = urls;

		function addLoad(data)
		{
			dataList.push(data);
			
			counter++;

			if (counter < urlList.length)
			{
				loadUrl(urlList[counter], loadingManager);
			}
			else
			{
				if (callback)
				{
					callback(targetScene, dataList);
				}
			}
		}

		function loadUrl(url, manager)
		{
			if (url)
			{
				var loader = new FileLoader(manager);
				loader.load(url , function(data) 
				{
					addLoad(JSON.parse(data));
				}, null, function()
				{
					addLoad(null);
				});
			}
			else
			{
				addLoad(null);
			}
		}

		loadUrl(urlList[counter], loadingManager);
	}

    function loadScene(configJson)
	{
		const loader = new GLTFLoaderEx(loadingManager);
		loader.setCrossOrigin('anonymous');

		const dracoLoader = new DRACOLoader();
		dracoLoader.setDecoderPath( 'lib/draco/' );

		const blobURLs = [];

		window.addMoment("??????GLB??????:"+configJson.fileUrl)
		loader.load(configJson.fileUrl, (gltf) => {
			window.addMoment("??????GLB??????:"+configJson.fileUrl)
			const scene = gltf.scene || gltf.scenes[0];
			blobURLs.forEach(URL.revokeObjectURL);

			if (configJson.matrixDesc && configJson.structDesc)
			{
				var _configList = [configJson.matrixDesc, configJson.structDesc, configJson.geoInfo, configJson.propInfo, configJson.elemInfo, configJson.groupDesc];

				console.log(_configList);
				window.addMoment("??????json??????")
				loadJsonList(scene, _configList, loadingManager, function(targetScene, dataList)
				{
					window.addMoment("??????json??????")
					scope.sceneMgr.PushSceneTask(
						{
							gltfScene: targetScene,
							iMatrix: dataList[0],
							structDesc: dataList[1], 
							geoInfo: dataList[2],
							propInfo: dataList[3],
							elemInfo: dataList[4],
							groupDesc: dataList[5],
							sceneTag: scope.sceneTag
						}
					);

					if (scope.finishCallback)
					{
						scope.finishCallback(scene, scope.sceneTag);
					}
				});
			}
			else
			{
				scope.sceneMgr.PushSceneTask(
					{
						gltfScene: scene,
						iMatrix: null,
						structDesc: null,
						geoInfo: null,
						propInfo: null,
						sceneTag: scope.sceneTag
					}
				);

				if (scope.finishCallback)
				{
					scope.finishCallback(scene, scope.sceneTag);
				}
			}
		}, 
		function ( xhr ) 
		{
			//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), configJson.isFromZip ? 'parsing...':'loading...');
		}, null);
	}

	this.load = function(url, finishCallback, sceneTag, isSync) 
	{
		console.log("this.load",url)//url.match( /\.zip$/ ) 
		window.addMoment("this.load start")
		this.finishCallback = finishCallback;
		this.sceneTag = sceneTag;
		
		return new Promise( function( resolve, reject ) {
						window.addMoment("ZipLoader.load start")
						new ZipLoader().load( url , function ( xhr ) 
						{
							//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), 'loading...');
						}).then( function( zip )
						{
							window.addMoment("ZipLoader.load finish")
							loadingManager.setURLModifier( zip.urlResolver );
							var geoInfos = zip.find('geoinfo.json');
							var propInfos = zip.find('properties.json');
							var elemInfos = zip.find('components.json');
							var groupDescs = zip.find('groupdesc.json');
							window.addMoment("ZipLoader.load return")
							resolve({
								fileUrl: zip.find( /\.(gltf|glb)$/i )[0], 
								matrixDesc: zip.find('smatrix.json')[0], 
								structDesc: zip.find('structdesc.json')[0],
								geoInfo: geoInfos.length > 0 ? geoInfos[0]:null,
								propInfo: propInfos.length > 0 ? propInfos[0]:null,
								elemInfo: elemInfos.length > 0 ? elemInfos[0]:null,
								groupDesc: groupDescs.length > 0 ? groupDescs[0]:null
							});
						} );
				}).then( function ( configJson ) 
				{
					window.addMoment("loadScene start")
					loadScene({
						fileUrl: configJson.fileUrl,
						matrixDesc: configJson.matrixDesc, 
						structDesc: configJson.structDesc, 
						geoInfo: configJson.geoInfo,
						propInfo: configJson.propInfo,
						elemInfo: configJson.elemInfo,
						groupDesc: configJson.groupDesc,
						isFromZip: true});
				} );
	}
}

export { SLMLoader , SLMConstansts,SLMSceneMeta}
function loadJson(url,cb){
	var request = new XMLHttpRequest();
	request.open("get", url);//????????????,??????
	request.send(null);//???????????????????????????
	request.onload = function () {//XHR???????????????
		if (request.status === 200) {//????????????????????????
			var data=JSON.parse(request.responseText)
			cb(data)
		}
	}
}
var loadingManager = new LoadingManager();
function loadZipJson(url,cb){
	new ZipLoader()
		.load( 
				url ,  
				xhr =>{},//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), 'loading...');
				()=>{
					console.log("????????????:"+url)
					setTimeout(()=>{//????????????
						loadZipJson(url,cb)
					},1000*(0.5*Math.random()+1))//1~1.5??????????????????
				}
			)
		.then( 
				function( zip ){
							loadingManager.setURLModifier( zip.urlResolver );
							parseJson(
								zip.find( /\.(json)$/i )[0],
								cb
							)
					}
			)
	function parseJson(url_json,cb_json){
		var loader = new FileLoader(loadingManager);
		loader.load(
			url_json , 
			data=> cb_json(JSON.parse(data))
		)
	}
	
							
}
function loadSubGLB (back,meshIndex,matrixConfig,structdesc0)
{
	// var projectName=window.param.projectName;
	var url="assets/models/huayi/"+meshIndex+".glb"
	var loader=new LoadingManager()
	new Promise(function( resolve, reject) {
		var myGLTFLoaderEx=new GLTFLoaderEx(loader)
		myGLTFLoaderEx.load(url, (gltf)=>{
			resolve(gltf)
		},()=>{},()=>{
			console.log("???????????????"+meshIndex)
			setTimeout(()=>{
				loadSubGLB(back,meshIndex,matrixConfig,structdesc0)
			},1000*(0.5*Math.random()+1))
		})
	} ).then( function ( gltf ) {
		var m1 = gltf.scene.children[0].children[0]
		//var arr=gltf.scene.children[0].children
		back(m1,meshIndex,matrixConfig,structdesc0)
	} )
}
function loadSubZip (back,meshIndex,matrixConfig,structdesc0)
{//assets\models\SAM_Review_1\output1.zip
	var url="assets/models/huayi/"+meshIndex+".zip"
	var loader=new LoadingManager()
	new Promise( function( resolve, reject ) {
		//?????????????????????
		new ZipLoader().load( url,()=>{
		},()=>{
			console.log("???????????????"+meshIndex)
			setTimeout(()=>{//????????????
				loadSubZip (back,meshIndex,matrixConfig,structdesc0)
			},1000*(0.5*Math.random()+1))//1~1.5??????????????????
		}).then( ( zip )=>{//???????????????
			loader.setURLModifier( zip.urlResolver );//????????????
			resolve({//???????????????????????????????????????
				fileUrl: zip.find( /\.(gltf|glb)$/i )
			});
		});
	} ).then( function ( configJson ) {
		var myGLTFLoaderEx=new GLTFLoaderEx(loader)
		myGLTFLoaderEx.load(configJson.fileUrl[0], (gltf) => {
			var m1 = gltf.scene.children[0].children[0]
			back(m1,meshIndex,matrixConfig,structdesc0)
		});

	} );
}

function loadSubZip2 (back,meshIndex){//??????????????????????????????????????????????????? ????????????????????????????????????
	var url="assets/models/huayi/"+meshIndex+".zip"
	var zipLoader=new ZipLoader()
	zipLoader.crossOrigin=true
	zipLoader.load( 
				url ,  
				xhr =>{},//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), 'loading...');
				()=>{
					console.log("????????????:"+url)
					setTimeout(()=>{//????????????
						loadSubZip2 (back,meshIndex)
					},1000*(0.5*Math.random()+1))//1~1.5??????????????????
				}
			)
		.then( 
				zip=>{	
					var loadingManager = new LoadingManager();
					loadingManager.setURLModifier( zip.urlResolver );
					var loader = new FileLoader(loadingManager);
					loader.load(
						zip.find( /\.(json)$/i )[0] , 
						data0=>{
							var data=JSON.parse(data0)
							var matrixConfig=data.matrixConfig
							var structdesc0=data.structdesc0
							// console.log(data)

							var loader=new LoadingManager()
							loader.setURLModifier( zip.urlResolver );//????????????
							var myGLTFLoaderEx=new GLTFLoaderEx(loader)
							myGLTFLoaderEx.load(zip.find( /\.(glb)$/i )[0], (gltf) => {
								var m1 = gltf.scene.children[0].children[0]
								// console.log(m1)
								back(m1,meshIndex,matrixConfig,structdesc0)
							});

						}
					)

				}
		)					
}

function loadSubZip3 (back,meshIndex){
	if(!window.loadSubZip3_worker){
		window.loadSubZip3_worker=new Worker("./myWorker/loadSubZip.js")
		window.loadSubZip3_worker.onmessage=ev=>{
			var matrixConfig=ev.data.matrixConfig
			var structdesc0=ev.data.structdesc0
			var meshIndex=ev.data.meshIndex
			const manager = new LoadingManager();
			var loader=new GLTFLoaderEx(manager)
			loader.parse( 
				ev.data.myArray, 
				"./",
				gltf=>{
					var m1 = gltf.scene.children[0].children[0]
					// console.log("!!!!!!!!!!!!m1",m1)
					// console.log("(m1,meshIndex,matrixConfig,structdesc0):",m1,meshIndex,matrixConfig,structdesc0)
					back(m1,meshIndex,matrixConfig,structdesc0)
			})
		}
	}
	window.loadSubZip3_worker.postMessage({
		meshIndex:meshIndex,
		url:"assets/models/huayi/"+meshIndex+".zip"
	})
}
// loadSubZip3 (()=>{},10)