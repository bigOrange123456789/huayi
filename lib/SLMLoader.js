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
  } from '../lib/three/build/three';
import { GLTFLoaderEx } from '../lib/three/examples/jsm/loaders/GLTFLoaderEx.js';
import { DRACOLoader } from '../lib/three/examples/jsm/loaders/DRACOLoader.js';
import {ZipLoader } from './ziploader.js';
import { SLMPicker } from './SLMPicker';


var SLMConstansts = SLMConstansts || {};
SLMConstansts.SceneLayerMask = 31;
SLMConstansts.OccluderLayerMask = 30;

SLMConstansts.ColorTables = 
[
	[1.0, 0.0, 0.0],
	[0.0, 1.0, 0.0],
	[0.0, 0.0, 1.0],
	[1.0, 1.0, 0.0],
	[1.0, 0.0, 0.0],
	[1.0, 0.5, 0.0],
	[1.0, 0.8, 0.0]
]

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

	this.sceneTag = options.sceneTag ? options.sceneTag : null;

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

				if (!this.propertiesData[i].prop["编码"])
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
			if (this.propertiesData[i].prop['名称'] == property.name && 
				this.propertiesData[i].prop['编码'] == property.code)
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
			slmSceneLoader.load(multiScenes[i].url, eachSceneCallback, multiScenes[i].tag);
		}

		// var myThis=this;
		// window.myLoading=(i)=>{
		// 	var slmSceneLoader = new SLMSceneParser(myThis);
		// 	slmSceneLoader.load(multiScenes[i].url, eachSceneCallback, multiScenes[i].tag);
		// }
		// window.myLoading(0)

	}
}

var SLMSceneBuilder = function(sceneMgr, options)
{
	var scope = this;

	this.sceneMgr = sceneMgr;
	
	function InstanceNode(gltfScene, iMatrix, structDesc, geoInfo, propInfo, elemInfo, groupInfo)
	{
		//gltfScene.parent.position.set(0, 0.0, 0.0)
		console.log('!!!!!*****',gltfScene.parent)
		var slmSceneMeta = new SLMSceneMeta(scope.sceneMgr, {geoInfo: geoInfo, propInfo: propInfo, elemInfo: elemInfo, sceneTag: scope.sceneTag, groupInfo: groupInfo});

		var instanceMatrixMap = iMatrix;
		var structDescription = structDesc;

		var instanceRoot = new Object3D();
		var rootGroupNode = gltfScene.children[0];
		var meshNodeList = (gltfScene.children.length == structDescription.length) ? gltfScene.children : rootGroupNode.children;

		if(meshNodeList.length != structDescription.length)
		{
			console.error('Mesh doesnt match description!');

			console.log(gltfScene);
			console.log(meshNodeList);
			console.log(structDescription);
		}
		else
		{
			var isSelfContained = scope.sceneMgr.EnablePicking ? true : false;

			var mLength = structDescription.length;

			var managedGroups = [];

			var unmanangedGroups = [];

			var ocGroups = [];

			for (var meshIndex = 0; meshIndex < mLength ; ++meshIndex)
			{
				var node = meshNodeList[meshIndex];

				//node.layers.set(SLMConstansts.OccluderLayerMask);

				var groupStruct = structDescription[meshIndex];
				var groups = [];
				var instanceCountList = [];

				var clonedMaterial = new MeshStandardMaterial({color:node.material.color})//node.material.clone();
				console.log("clonedMaterial",clonedMaterial)
				clonedMaterial.transparent=false

				var materialList = [clonedMaterial];
				
				if (isSelfContained)
				{
					node.visible = false;
				}

				var sceneCofigMeta = {
					id: (propInfo && propInfo[0] && propInfo[0].meta) ? propInfo[0].meta.id : null,
					wireframe: (propInfo && propInfo[0] && propInfo[0].meta) ? propInfo[0].meta.wireframe : false,
					lighting: (propInfo && propInfo[0] && propInfo[0].meta) ? propInfo[0].meta.lighting : false,
				};

				if (scope.sceneMgr.EnablePicking)
				{
					scope.sceneMgr.scenePicker.SetupInstancedShaderWithVertexColor(clonedMaterial, sceneCofigMeta);
				}

				for (var i = 0; i < groupStruct.length ; ++i)
				{
					var groupName = groupStruct[i].n;

					if (groupInfo && groupInfo.groupDesc[groupName])
					{
						for (var sgIdx = 0; sgIdx < groupInfo.groupDesc[groupName].length; ++sgIdx)
						{
							instanceCountList.push(groupInfo.groupDesc[groupName][sgIdx].c);
	
							var group = {
								start: groupStruct[i].s,
								count: groupStruct[i].c,
								instanceCount: groupInfo.groupDesc[groupName][sgIdx].c,
								name: groupName,
								subGroupOffset: groupInfo.groupDesc[groupName][sgIdx].s,
								bounds: groupInfo.groupDesc[groupName][sgIdx].b,
								oc: groupInfo.ocGroup[groupName] ? true : false,
							};
							groups.push(group);
						}
					}
					else
					{
						instanceMatrixMap[groupName].it.push([1,0,0,0,0,1,0,0,0,0,1,0]);
						instanceMatrixMap[groupName].id.push(parseInt(groupName));

						instanceCountList.push(instanceMatrixMap[groupName].id.length);
	
						var group = {
							start: groupStruct[i].s,
							count: groupStruct[i].c,
							instanceCount: instanceMatrixMap[groupName].id.length,
							subGroupOffset: 0,
							name: groupName,
							bounds: null,
							oc:false//oc: groupInfo.ocGroup&&groupInfo.ocGroup[groupName] ? true : false,
						};
						//console.log(false)
						groups.push(group);
					}
				}

				if(true){
					
					
					var instancedMesh = new InstancedMeshEx(node.geometry, materialList, 1, instanceCountList, sceneCofigMeta.lighting);
					console.log(instancedMesh)
					// instancedMesh.material.transparent=false
					instancedMesh.geometry.clearGroups();

					var instanceCounter = 0;

					for (var groupIndex = 0; groupIndex < groups.length ; ++groupIndex)
					{
						var group = groups[groupIndex];

						var instanceMatrixList = instanceMatrixMap[group.name].it;

						var instanceTcMatrixList = instanceMatrixMap[group.name].ic;
						
						var instancedElemIds = instanceMatrixMap[group.name].id;

						//if (instance.length > 0)
						{
							instanceCounter++;

							instancedMesh.geometry.addGroupInstanced(group.start * 3, group.count * 3, 0, groupIndex, false);

							if (group.bounds != null) // Ignore invalid groups
							{
								managedGroups.push({mesh: instancedMesh, index: groupIndex, bounds: group.bounds, visible: true, s: group.start});
							}
							else
							{
								unmanangedGroups.push({mesh: instancedMesh, index: groupIndex});
							}

							if (group.oc)
							{
								ocGroups.push({mesh: instancedMesh, index: groupIndex, bounds: group.bounds, visible: true, s: group.start});
							}

							for (var subInstanceIndex = 0; subInstanceIndex < group.instanceCount; subInstanceIndex++)
							{
								var mat4 = null;

								var backupMat = new Matrix4();

								var elementId = 0;

								var instanceDataOffset = group.subGroupOffset + subInstanceIndex;

								{
									var mat = instanceMatrixList[instanceDataOffset];

									var instanceMatrix = new Matrix4();
									
									instanceMatrix.set(
											mat[0], mat[1], mat[2], mat[3],
											mat[4], mat[5], mat[6], mat[7], 
											mat[8], mat[9], mat[10], mat[11],
											0, 0, 0, 1);

									backupMat.set(
										mat[0], mat[1], mat[2], mat[3],
										mat[4], mat[5], mat[6], mat[7], 
										mat[8], mat[9], mat[10], mat[11],
										0, 0, 0, 1);

									mat4 = instanceMatrix.multiply(rootGroupNode.matrix);

									// Instanced element
									elementId = instancedElemIds[instanceDataOffset];
								}

								var elementPickingId = slmSceneMeta.AddElementWitId(elementId);

								instancedMesh.setInstanceMatrixAt(groupIndex, subInstanceIndex, mat4);

								if (sceneCofigMeta.lighting)
								{
									instancedMesh.setInstanceTexcoordAt(groupIndex, subInstanceIndex, new Vector4(instanceTcMatrixList[instanceDataOffset]));

									instancedMesh.setInstanceTexcoordAt(groupIndex, subInstanceIndex, new Vector4(instanceTcMatrixList[instanceDataOffset][0], 
										instanceTcMatrixList[instanceDataOffset][1], instanceTcMatrixList[instanceDataOffset][2], instanceTcMatrixList[instanceDataOffset][3]));
								}

								if (scope.sceneMgr.EnablePicking)
								{
									var encodedColor = scope.sceneMgr.EncodeElementPickingId(elementPickingId, false);

									instancedMesh.setInstanceColorAt(groupIndex, subInstanceIndex, encodedColor);
								}

								if (elemInfo && elemInfo.components)
								{
									slmSceneMeta.SetElementDesc(elementId, {mesh: instancedMesh, gId: groupIndex, iId: subInstanceIndex, sId: group.name, groupStart: group.start, groupCount: group.count, key: (elemInfo ? elemInfo.components[elementId].k : null)}, (elemInfo ? elemInfo.components[elementId].k : null));
								}
								else
								{
									slmSceneMeta.SetElementDesc(elementId, {mesh: instancedMesh, gId: groupIndex, iId: subInstanceIndex, sId: group.name, groupStart: group.start, groupCount: group.count, key: (elemInfo ? elemInfo[elementId].key : null)}, (elemInfo ? elemInfo[elementId].key : null));
								}
								slmSceneMeta.SetElementMatrix(elementId, backupMat.clone());
								slmSceneMeta.SetElementGroupMatrix(elementId, rootGroupNode.matrix.clone());

								//console.log('================= instance node');
							}
						}
					}

					if (instanceCounter > 0)
					{
						instanceRoot.add(instancedMesh);

						instancedMesh.layers.set(SLMConstansts.SceneLayerMask);
					}
				}
			}
		}

		gltfScene.add(instanceRoot);
		
		var cullerOptions = null;

		if (groupInfo && groupInfo.bvh)
		{
			cullerOptions = {
				bvhJson: groupInfo.bvh,
				sceneOccluder: null, 
				managedGroups: managedGroups,
				unmanagedGroups: unmanangedGroups,
				ocGroups: ocGroups
			};
		}

		scope.sceneMgr.AddScene(slmSceneMeta, cullerOptions);

		if (scope.finishCallback)
		{
			scope.finishCallback(gltfScene, scope.sceneTag, scope.bvhScene);
		}

		SetupMaterials();

		//instanceNode
		window.hasLoadingTag++
		console.log(window.hasLoadingTag)
		// if(window.hasLoadingTag<=25){
		// 	window.myLoading(window.hasLoadingTag)
		// }
	}

	function SetupMaterials()
	{
		scope.sceneMgr.scenePicker.SetupMaterials();
	}

	this.BuildScene= function(task, finishCallback)
	{
		//task.gltfScene.parent.position.set(0, 0.0, 0.0)
		this.finishCallback = finishCallback;
		this.sceneTag = task.sceneTag;

		if (task.iMatrix && task.structDesc)// && task.geoInfo && task.propInfo)
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

			//console.log(data);
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
		//loader.setDRACOLoader( dracoLoader );

		const blobURLs = [];

		//console.log(configJson);

		loader.load(configJson.fileUrl, (gltf) => {
			const scene = gltf.scene || gltf.scenes[0];
			// console.log('@@@@@',scene)
			//scene.parent.position.set(0, 0.0, 0.0)
			/*
			for(var i=0;i<scene.children.length;i++){
				scene.children[i].position.set(0, 0.0, 0.0)
				var o=scene.children[i]
				for(var j=0;j<scene.children.length;j++){
					var oo=o.children[j]
					oo.position.set(0, 0.0, 0.0)
					console.log('oo',oo)
				}
			}*/

			blobURLs.forEach(URL.revokeObjectURL);

			if (configJson.matrixDesc && configJson.structDesc)
			{
				var _configList = [configJson.matrixDesc, configJson.structDesc, configJson.geoInfo, configJson.propInfo, configJson.elemInfo, configJson.groupDesc];

				console.log(_configList);

				loadJsonList(scene, _configList, loadingManager, function(targetScene, dataList)
				{
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
						//scene.parent.position.set(0, 0.0, 0.0)
					}

					//instanceNode(scene, dataList[0], dataList[1], dataList[2], dataList[3]);
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
		this.finishCallback = finishCallback;
		this.sceneTag = sceneTag;
		
		return new Promise((resolve, reject) => {
			if (url.toLowerCase().endsWith('.zip'))
			{
				new Promise( function( resolve, reject ) {
					if ( url.match( /\.zip$/ ) ) {
						new ZipLoader().load( url , function ( xhr ) 
						{
							//updateProgressBar(( xhr.loaded / xhr.total * 100 ).toFixed(1), 'loading...');
						}).then( function( zip )
						{
							loadingManager.setURLModifier( zip.urlResolver );
							var geoInfos = zip.find('geoinfo.json');
							var propInfos = zip.find('properties.json');
							var elemInfos = zip.find('components.json');
							var groupDescs = zip.find('groupdesc.json');
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
					} else 
					{
						resolve( url );
					}
				} ).then( function ( configJson ) 
				{
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
			else
			{
				loadScene({fileUrl: url});
			}
		});
	}
}

export { SLMLoader , SLMConstansts}