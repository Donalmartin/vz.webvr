var canvas = document.getElementById("renderCanvas");
var MeshWriter, textW1, SPS;
var activeLocation = null,
	activeStyle = null,
	activeCapacity = null,
	activeAmbient = null;
var mx = window.innerWidth/2;
var my = window.innerHeight/2;
var tickCount = -240;
var cameraFov = 1.05;
var camera;
var orientationCamera;
var orientationCameraActive = false;
var locationDistance = 12;
var blend = 1;
var JSONData;
var loadingAssets = true;
var loadingAnim = false;
var engine = null;
var codes = "abcdef".split("");
var scene = null;
var sceneToRender = null;
var instantTransition = false;
var galleryPreviewHTML = document.getElementById("gallery-preview");
var loadingDivHTML = document.getElementById("loadingDiv");
var logoDivHTML = document.getElementById("logoDiv");
logoDivHTML.style.opacity = 1;
logoDivHTML.style.visibility = "visible";
var collapseTitleMenuHTML = document.getElementById("collapseTitleMenu");
var collapseMainMenuHTML = document.getElementById("collapseMainMenu");
var collapseCapacitiesHTML = document.getElementById("collapseCapacities");
var styleButtonsHTML = document.getElementById("styleButtons");
var galleryModalHTML = document.getElementById("galleryModal");
var title;

var lastTime = new Date();
var nowTime = new Date();
var transitionAnimTime = 1;

var cubeMat;
var faceMatA;
var faceMatB;
var faceMatC;
var faceMatD;
var faceMatE;
var faceMatF;

var skybox;
//var skyboxMaterial;
var text1;
var text2;
var assetsManager;
var panoAssetsManager;
var locationPlane;
var linkedLocation;
var ground;
var sphereOnGround;
var locationToSphereLine;

let actionManager;


var button;
var r = document.querySelector(':root');
    r.style.setProperty('--clientWidth', canvas.clientWidth);
    r.style.setProperty('--clientHeight', canvas.clientHeight);
r.style.setProperty('--collapseMainMenuMultiplier', 1);

var createDefaultEngine = function() {
	return new BABYLON.Engine(canvas, true, {
		preserveDrawingBuffer: true,
		stencil: true,
		disableWebGL2Support: false
	});
};

var createScene = function() {

	scene = new BABYLON.Scene(engine);

	cubeMat = new BABYLON.MultiMaterial("cubeMat", scene);

	
/******
	ground = BABYLON.MeshBuilder.CreateGround("ground", {
		width: 50,
		height: 50
	});
	ground.position.y = -1.75;
	ground.visibility = 0.0;
	***/
	actionManager = new BABYLON.ActionManager(scene);
	
    actionManager.registerAction(
		new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnLeftPickTrigger, function (ev) {
			//console.log(ev.meshUnderPointer.name);
            
                    //console.log(ev.meshUnderPointer.name);
                    //console.log(ev.meshUnderPointer._children[0].name);
                    
                    if(!loadingAssets && !loadingAnim) {
                        var newActiveLocation = ev.meshUnderPointer.name.split(" to ")[1];
                        
                        JSONData.locations[activeLocation].links.forEach( link => {
                            if(scene.getMeshByName(activeLocation + " to " + link.link) != null)
                            scene.getMeshByName(activeLocation + " to " + link.link).dispose();
                        })
                        
                        activeLocation = newActiveLocation;
                    updateActives("styles");
                    
                    //console.log(activeLocation + "_" + activeStyle + "_" + activeCapacity + "_" + activeAmbient);
                    loadPano(activeLocation, activeStyle, activeCapacity, activeAmbient);
                    }
                    
                    

            
        }))

	codes.forEach(ext => {
		eval("faceMat" + ext.toUpperCase() + " = " + "new BABYLON.CustomMaterial('faceMat" + ext.toUpperCase() + "', scene)");
	})

	texBlendA = new BABYLON.Texture("assets/textures/blend/a.jpg", scene);
	texBlendB = new BABYLON.Texture("assets/textures/blend/b.jpg", scene);

	codes.forEach(ext => {
		eval("text1" + ext.toUpperCase() + " = " + "texBlendA");
		eval("text2" + ext.toUpperCase() + " = " + "texBlendB");
		eval("faceMat" + ext.toUpperCase() + ".diffuseTexture = text1" + ext.toUpperCase());
		eval("faceMat" + ext.toUpperCase() + ".AddUniform('oldTxt','sampler2D')");
		eval("faceMat" + ext.toUpperCase() + ".AddUniform('newTxt','sampler2D')");
		eval("faceMat" + ext.toUpperCase() + ".AddUniform('blend','float')");
		eval("faceMat" + ext.toUpperCase() + ".onBindObservable.add(function () { faceMat" + ext.toUpperCase() + ".getEffect().setTexture('oldTxt',text1" + ext.toUpperCase() + "); faceMat" + ext.toUpperCase() + ".getEffect().setTexture('newTxt',text2" + ext.toUpperCase() + "); faceMat" + ext.toUpperCase() + ".getEffect().setFloat('blend',blend);});");
		eval("faceMat" + ext.toUpperCase() + ".Fragment_Before_FragColor(`vec4 oldColor = texture2D(oldTxt,vDiffuseUV); vec4 newColor = texture2D(newTxt,vDiffuseUV); color = newColor*blend + (1.-blend)*oldColor;`);");
	})

	cubeMat.subMaterials.push(faceMatC);
	cubeMat.subMaterials.push(faceMatB);
	cubeMat.subMaterials.push(faceMatF);
	cubeMat.subMaterials.push(faceMatE);
	cubeMat.subMaterials.push(faceMatA);
	cubeMat.subMaterials.push(faceMatD);

	assetsManager = new BABYLON.AssetsManager(scene);
	panoAssetsManager = new BABYLON.AssetsManager(scene);
	assetsManager.useDefaultLoadingScreen = false;
	panoAssetsManager.useDefaultLoadingScreen = false;

	assetsManager.addMeshTask("loadCube task", "", "", "Cube6Mat.babylon");
	assetsManager.addTextFileTask("load Data", "assets/data.json");
	assetsManager.load();
	assetsManager.onTaskSuccessObservable.add(function(task) {
		// //console.log(task.name);
		switch (task.name) {

			case "loadCube task":
				//console.log("Cube loaded");
               

				break;

			case "load Data":
				//console.log("loaded Data");
				JSONData = JSON.parse(task.text);

                document.getElementsByTagName("title")[0].innerText = JSONData.title;
                collapseTitleMenuHTML.getElementsByTagName("p")[0].innerText = JSONData.title;
                collapseTitleMenuHTML.getElementsByTagName("p")[1].innerText = JSONData.subTitle;
                
                loadingDivHTML.firstElementChild.style.color = JSONData.uiColor;
                collapseTitleMenuHTML.getElementsByTagName("a")[0].setAttribute("href", JSONData.logoLink);

				break;
		}
	});

	assetsManager.onFinish = function(tasks) {
        if ((typeof window.orientation !== 'undefined')) {
            
          document.getElementById("fullScButton").style.visibility = "collapse";
            
            document.getElementById("shareButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
            
            document.getElementById("galleryButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
            
            var r = document.querySelector(':root');
            r.style.setProperty('--visibleIcons', 4);
            
            var iFrameDetection = (window === window.parent) ? false : true;
      if (!(window === window.parent)) {
        window.location = "mobile.html";
        //console.log('mobile iframe')
      } else {
        //console.log('not iframed on mobile')
          
          if ( window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function' ){
                document.getElementById("beginBanner").style.visibility = "visible";
            } else {
                button.onPointerClickObservable._observers[0].callback();
            }
      }
            
          
            
        //console.log('mobile iframe')
      } else {
        //console.log('not iframed on mobile')
          document.getElementById("fullScButton").style.visibility = "visible";
      }
        
        

		//console.log("Done all Tasks");

		loadingAssets = false;
        
        loadingDivHTML.style.visibility = (!loadingAssets) ? "collapse" : "visible";

		scene.getNodeByName("Cube").material.subMaterials.forEach(m => {
			m.dispose();
		})

		scene.getNodeByName("Cube").material.dispose();
		scene.getNodeByName("Cube").material = cubeMat;
		cubeMat.subMaterials.forEach(subMat => {
			subMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
		})
        
        var hashes = [];
        
        if(typeof window.location.hash.split("#")[1] == "string") {
            hashes = atob(window.location.hash.split("#")[1]).split("___");
        }
        
        if(hashes.length == 4){
            activeLocation = hashes[0];
            activeStyle = hashes[1];
            activeCapacity = hashes[2];
            activeAmbient = hashes[3];
        }
        
        updateActives("locations");
        
        //console.log(activeLocation + "_" + activeStyle + "_" + activeCapacity + "_" + activeAmbient);
		loadPano(activeLocation, activeStyle, activeCapacity, activeAmbient);
        
      //  document.getElementById("babylonVRiconbtn").style.visibility = "collapse";
        
            
       
        
	}

	
	scene.registerAfterRender(function() {
		tickCount++;
		if (cameraFov == 1) {
			if (tickCount >= 0) {

				camera.fov = cameraFov;
                if(typeof orientationCamera !== "undefined")
                    orientationCamera.fov = cameraFov;
			}
		} else {

			camera.fov = cameraFov;
            if(typeof orientationCamera !== "undefined")
                orientationCamera.fov = cameraFov;
		}
	});

	scene.onPointerObservable.add(function(e) {

			cameraFov += e.event.wheelDelta * -0.0005;
			if (cameraFov < 0.5) {
				cameraFov = 0.5;
			}
			if (cameraFov > 2) {
				cameraFov = 2;
			}
			if (cameraFov == 1) {
				tickCount = -60;
			}

	}, BABYLON.PointerEventTypes.POINTERWHEEL);

	scene.registerBeforeRender(function() {
		nowTime = new Date();
		if (loadingAnim) {
			if (blend < 1) {
				blend = Math.min(1, blend + (nowTime - lastTime) / 1000 / transitionAnimTime);
			} else {
				loadingAnim = false;
                
                loadingDivHTML.style.visibility = (!loadingAssets) ? "collapse" : "visible";
			}
		}
        
        if(!loadingAnim && !loadingAssets) {
            if(logoDivHTML.style.visibility == "visible") {
                logoDivHTML.style.opacity = (Math.max(0, parseFloat(logoDivHTML.style.opacity) - (nowTime - lastTime) / 1000 / transitionAnimTime)).toString();
                
                
                if(parseFloat(logoDivHTML.style.opacity) == 0) {
                    logoDivHTML.style.visibility = "collapse";
                    
                 
                    
                    if (typeof window.orientation !== 'undefined') {
                      
                        }
                    
                    setTimeout(function(){
                        if(collapseTitleMenuHTML.classList.contains("out")) {
                            toggleTitleSlider();
                        }
                    }, 10000);
                }
            }
        }

        
		lastTime = nowTime;
	})

	
    //**************************

    var keycamera = new BABYLON.ArcRotationCamera("arcCamera", )
    
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene);
            camera.rotationQuaternion = new BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, Math.PI, Math.PI);
            camera.setTarget(new BABYLON.Vector3(camera.position.x, camera.position.y, camera.position.z+1));
        
            camera.attachControl(canvas, true);
    
            camera.inputs.attached.keyboard.keysRotateLeft[0] = 37;
            camera.inputs.attached.keyboard.keysRotateRight[0] = 39;
            camera.inputs.attached.keyboard.keysUpward[0] = 38;
            camera.inputs.attached.keyboard.keysDownward[0] = 40;

        
            
            button = BABYLON.GUI.Button.CreateSimpleButton("switch", "Switch");
            button.width = 0.2;
            button.height = "40px";
            button.color = "white";
            button.background = "green";
    
    
    
    

        
            
        
            button.onPointerClickObservable.add(
                function(){
                    //console.log("CLICKKK");
                    if(orientationCameraActive == false){
                        if(typeof orientationCamera !== "undefined")
                            orientationCamera.dispose();
                       
                        orientationCamera = new BABYLON.DeviceOrientationCamera("orientationCamera", new BABYLON.Vector3(0,0,0), scene);
            orientationCamera.enableHorizontalDragging();
            orientationCamera._initialQuaternion = new BABYLON.Quaternion();
        
        
        
            orientationCamera.inputs.attached.keyboard.keysLeft[0] = -1;
            orientationCamera.inputs.attached.keyboard.keysRight[0] = -1;
            orientationCamera.inputs.attached.keyboard.keysUp[0] = -1;
            orientationCamera.inputs.attached.keyboard.keysDown[0] = -1;
                        
                        
                        var camQuaTemp = camera.rotationQuaternion.clone();
                        var lastMainRotY = camQuaTemp.toEulerAngles().y;
        
                        scene.activeCamera.detachControl();
                        
                        orientationCamera.setTarget(camera.getTarget());
                        orientationCamera.cameraRotation.x = 0;
                        orientationCamera.cameraRotation.y = 0;
                     
        
                        orientationCamera.inputs.attached.deviceOrientation.checkInputs();
                        
                        
                        var tempOriQua = orientationCamera.rotationQuaternion.clone();
                        var currDeviceOrientation = tempOriQua.toEulerAngles().y;
        
                        BABYLON.Quaternion.FromEulerAnglesToRef(0, lastMainRotY - currDeviceOrientation, 0, orientationCamera._initialQuaternion);
        orientationCamera.fov = camera.fov;
                        orientationCameraActive = true;
                        scene.activeCamera = orientationCamera;
                        scene.activeCamera.attachControl(canvas, true);
                        
                    }else{
                        var oriQuaTemp = orientationCamera.rotationQuaternion.clone();
                        var lastOriRotY = oriQuaTemp.toEulerAngles().y;
                        scene.activeCamera.detachControl();
        
                        camera.setTarget(orientationCamera.getTarget());
                        camera.cameraRotation.x = 0;
                        camera.cameraRotation.y = 0;
                        
                        orientationCameraActive = false;
                        scene.activeCamera = camera;
                        scene.activeCamera.attachControl(canvas, true);
                    }
                }
            );
            
            
            //****************
    
    
    
    
	return scene;
};
window.initFunction = async function() {
	var asyncEngineCreation = async function() {
		try {
			return createDefaultEngine();
		} catch (e) {
			//console.log("the available createEngine function failed. Creating the default engine instead");
			return createDefaultEngine();
		}
	}
    
	window.engine = await asyncEngineCreation();
	if (!engine) throw 'engine should not be null.';
	window.scene = createScene();
};

initFunction().then(() => {
	sceneToRender = scene
	engine.runRenderLoop(function() {
		if (sceneToRender && sceneToRender.activeCamera) {
			sceneToRender.render();
		}
	});
});

// Resize
window.addEventListener("resize", function() {
//console.log("TRIGGER");
    var r = document.querySelector(':root');
    
    r.style.setProperty('--clientWidth', canvas.clientWidth);
        r.style.setProperty('--clientHeight', canvas.clientHeight);
    
    for(var i in document.getElementById("collapseCapacities").getElementsByTagName("button")) {
        if(typeof document.getElementById("collapseCapacities").getElementsByTagName("button")[i] == "object") {
            ////console.log(document.getElementById("collapseCapacities").getElementsByTagName("button")[i]);
            
            document.getElementById("collapseCapacities").getElementsByTagName("button")[i].firstElementChild.setAttribute("width", (document.getElementById("toggleCapSliderButton").clientWidth/3).toString());
            
            document.getElementById("collapseCapacities").getElementsByTagName("button")[i].firstElementChild.setAttribute("height", (document.getElementById("toggleCapSliderButton").clientWidth/3).toString());
            /*
            document.getElementById("collapseCapacities").getElementsByTagName("span")[i].style.fontSize = (document.getElementById("toggleCapSliderButton").clientWidth/4).toString() + "px";
            document.getElementById("collapseCapacities").getElementsByTagName("span")[i].style.marginLeft = (document.getElementById("toggleCapSliderButton").clientWidth/4).toString() + "px";
            */
        }
    }
    
    if(document.getElementById("galleryButton").style.visibility == "visible") {
        document.getElementById("shareButton").style.borderTopLeftRadius = "0";
        
        if(document.getElementById("toggleAmbientButton").style.visibility == "visible" || document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
            document.getElementById("galleryButton").style.borderTopLeftRadius = "0";
            
            if(document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
                document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "0";
                if(document.getElementById("toggleAmbientButton").style.visibility == "visible"){
                    if (typeof window.orientation !== 'undefined') {
                        document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                        document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                    } else {
                        document.getElementById("toggleCapSliderButton").style.transform = "translateX(0px)";
                        document.getElementById("toggleAmbientButton").style.transform = "translateX(0px)";
                    }
                } else {
                    if (typeof window.orientation !== 'undefined') {
                            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
                        } else {
                            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                        }
                    
                }
            } else {
                document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "10px";
                if (typeof window.orientation !== 'undefined') {
                    document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                } else {
                    document.getElementById("toggleAmbientButton").style.transform = "translateX(0px)";
                }
            }
        } else {
            document.getElementById("galleryButton").style.borderTopLeftRadius = "10px";
        }
        
    } else if(document.getElementById("toggleAmbientButton").style.visibility == "visible") {
        document.getElementById("shareButton").style.borderTopLeftRadius = "0";
        if (typeof window.orientation !== 'undefined') {
            document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
        } else {
            document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
        }
        
        if(document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
            document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "0";
            if (typeof window.orientation !== 'undefined') {
                document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
            } else {
                document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
            }
        } else {
            document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "10px";
        }
        
    } else if(document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
        document.getElementById("shareButton").style.borderTopLeftRadius = "0";
        if (typeof window.orientation !== 'undefined') {
            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*3 + "px)";
        } else {
            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
        }
        
    } else {
        document.getElementById("shareButton").style.borderTopLeftRadius = "10px";
    }
    
   // var r = document.querySelector(':root');
            r.style.setProperty('--visibleIcons', (document.getElementById("toggleCapSliderButton").style.visibility == "visible") + (document.getElementById("toggleAmbientButton").style.visibility == "visible") + (document.getElementById("galleryButton").style.visibility == "visible") + (document.getElementById("fullScButton").style.visibility == "visible"));
  
    if(document.getElementById("collapseMainMenu").classList.contains("out")) {
        r.style.setProperty('--collapseMainMenuMultiplier', 1);
        
        var rect = document.getElementById("styleButtons").children[document.getElementById("styleButtons").childElementCount-1].getBoundingClientRect();
        
        
        while(rect.top < 0 || rect.left < 0 || (rect.bottom > (window.innerHeight || document.documentElement.clientHeight)) || (rect.right > (window.innerWidth || document.documentElement.clientWidth))) {
            r.style.setProperty('--collapseMainMenuMultiplier', parseInt(r.style.getPropertyValue('--collapseMainMenuMultiplier')) + 1);
            rect = document.getElementById("styleButtons").children[document.getElementById("styleButtons").childElementCount-1].getBoundingClientRect();
        }
    }
    
    
    
	engine.resize();
});

window.addEventListener("orientationchange", function() {
  window.dispatchEvent(new Event('resize'));
}, false);


            collapseMainMenuHTML.style.visibility = "visible";
            collapseTitleMenuHTML.style.visibility = "visible";


function addGalleryDiv(link) {
    const galleryLi = document.createElement("li");
    galleryLi.setAttribute("data-target", "#carouselGallery");
    galleryLi.setAttribute("data-slide-to", galleryModalHTML.getElementsByTagName("ol")[0].childElementCount.toString());
    
    galleryModalHTML.getElementsByTagName("ol")[0].appendChild(galleryLi);
    
    
    const carouselItem = document.createElement("div");
    carouselItem.setAttribute("class", "carousel-item");
    
    const carouselImg = document.createElement("img");
    carouselImg.setAttribute("src", link);
    
    carouselItem.appendChild(carouselImg);
    carouselImg.style.width = "100%";
    carouselImg.style.height = "auto";
    
    galleryModalHTML.getElementsByClassName("carousel-inner")[0].appendChild(carouselItem);
    
    
    if(galleryModalHTML.getElementsByTagName("ol")[0].childElementCount == 1) {
        galleryLi.classList.add("active");
        carouselItem.classList.add("active");
    }
}

function updateUI() {
    //console.log("UPDATE UI");
           
    if (activeAmbient == "ambient1") {
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z")
            
        } else {
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5z")
        }
    
    if(typeof JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].gallery[0] == "undefined") {
        document.getElementById("galleryButton").style.visibility = "collapse";
    } else {
        document.getElementById("galleryButton").style.visibility = "visible";
    }
    
    if(typeof JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].ambients.ambient2 == "undefined") {
        document.getElementById("toggleAmbientButton").style.visibility = "collapse";
    } else {
        document.getElementById("toggleAmbientButton").style.visibility = "visible";
    }
    
    if(collapseCapacitiesHTML.childElementCount <=1) {
        document.getElementById("toggleCapSliderButton").style.visibility = "collapse";
    } else {
        document.getElementById("toggleCapSliderButton").style.visibility = "visible";
    }
    
    if(document.getElementById("galleryButton").style.visibility == "visible") {
        document.getElementById("shareButton").style.borderTopLeftRadius = "0";
        
        if(document.getElementById("toggleAmbientButton").style.visibility == "visible" || document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
            document.getElementById("galleryButton").style.borderTopLeftRadius = "0";
            
            if(document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
                document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "0";
                if(document.getElementById("toggleAmbientButton").style.visibility == "visible"){
                    if (typeof window.orientation !== 'undefined') {
                        document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                        document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                    } else {
                        document.getElementById("toggleCapSliderButton").style.transform = "translateX(0px)";
                        document.getElementById("toggleAmbientButton").style.transform = "translateX(0px)";
                    }
                } else {
                    if (typeof window.orientation !== 'undefined') {
                            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
                        } else {
                            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                        }
                    
                }
            } else {
                document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "10px";
                if (typeof window.orientation !== 'undefined') {
                    document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
                } else {
                    document.getElementById("toggleAmbientButton").style.transform = "translateX(0px)";
                }
            }
        } else {
            document.getElementById("galleryButton").style.borderTopLeftRadius = "10px";
        }
        
    } else if(document.getElementById("toggleAmbientButton").style.visibility == "visible") {
        document.getElementById("shareButton").style.borderTopLeftRadius = "0";
        if (typeof window.orientation !== 'undefined') {
            document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
        } else {
            document.getElementById("toggleAmbientButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
        }
        
        if(document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
            document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "0";
            if (typeof window.orientation !== 'undefined') {
                document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
            } else {
                document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth + "px)";
            }
        } else {
            document.getElementById("toggleAmbientButton").style.borderTopLeftRadius = "10px";
        }
        
    } else if(document.getElementById("toggleCapSliderButton").style.visibility == "visible") {
        document.getElementById("shareButton").style.borderTopLeftRadius = "0";
        if (typeof window.orientation !== 'undefined') {
            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*3 + "px)";
        } else {
            document.getElementById("toggleCapSliderButton").style.transform = "translateX(" + document.getElementById("fullScButton").clientWidth*2 + "px)";
        }
        
    } else {
        document.getElementById("shareButton").style.borderTopLeftRadius = "10px";
    }
    
    var r = document.querySelector(':root');
            r.style.setProperty('--visibleIcons', (document.getElementById("toggleCapSliderButton").style.visibility == "visible") + (document.getElementById("toggleAmbientButton").style.visibility == "visible") + (document.getElementById("galleryButton").style.visibility == "visible") + (document.getElementById("fullScButton").style.visibility == "visible"));
    
    
    if(collapseCapacitiesHTML.classList.contains("in")) {
        document.getElementById("toggleCapSliderButton").style.borderTopLeftRadius = "0px";
    }  else {
        document.getElementById("toggleCapSliderButton").style.borderTopLeftRadius = "10px";
    }
}

function loadPano(location, style, capacity, ambient) {
    
	//	if ((activeLocation != location)|| (activeStyle != style) || (activeCapacity != capacity) || (activeAmbient != ambient)) {
    //btoa atob(window.location.hash)
    window.location.hash = btoa(activeLocation + "___" + activeStyle + "___" + activeCapacity + "___" + activeAmbient);
	if (true) {
		loadingAssets = true;
        
        loadingDivHTML.style.visibility = (!loadingAssets) ? "collapse" : "visible";
        
		var loadLinkSuccess = true;
        
		try {
			if (typeof JSONData.locations[location] == "undefined") throw "no Location";
			if (typeof JSONData.locations[location].styles[style] == "undefined") throw "no Style";
			if (typeof JSONData.locations[location].styles[style].capacities[capacity] == "undefined") throw "no Capacity";
			if (typeof JSONData.locations[location].styles[style].capacities[capacity].ambients[ambient] == "undefined") throw "no Ambient";
			if (typeof JSONData.locations[location].styles[style].capacities[capacity].ambients[ambient].source == "undefined") throw "no Source";
            
			if (JSONData.locations[location].styles[style].capacities[capacity].ambients[ambient].loaded) {
				//console.log("FOUND");
                
				scene.textures.forEach(tex => {
					codes.forEach(ext => {
						if (tex.name == JSONData.locations[location].styles[style].capacities[capacity].ambients[ambient].source.replace("/a/", "/b/").replace("/b/", "/c/").replace("/c/", "/d/").replace("/d/", "/e/").replace("/e/", "/f/").replace("/f/", "/" + ext + "/")) {
							if (instantTransition) {
								switch (ext) {
									case "a":
										text1A = text2A = tex;
										break;
									case "b":
										text1B = text2B = tex;
										break;
									case "c":
										text1C = text2C = tex;
										break;
									case "d":
										text1D = text2D = tex;
										break;
									case "e":
										text1E = text2E = tex;
										break;
									case "f":
										text1F = text2F = tex;
										break;
								}

							} else {
								switch (ext) {
									case "a":
										text1A = text2A;
										text2A = tex;
										break;
									case "b":
										text1B = text2B;
										text2B = tex;
										break;
									case "c":
										text1C = text2C;
										text2C = tex;
										break;
									case "d":
										text1D = text2D;
										text2D = tex;
										break;
									case "e":
										text1E = text2E;
										text2E = tex;
										break;
									case "f":
										text1F = text2F;
										text2F = tex;
										break;
								}
							}
						}
					})
				})
                
				blend = instantTransition;
				panoAssetsManager.reset();

				loadingAssets = false;
				loadingAnim = true;
                
                loadingDivHTML.style.visibility = (!loadingAssets) ? "collapse" : "visible";
			} else {
				//console.log("LOAD");
				codes.forEach(ext => {
					panoAssetsManager.addTextureTask(ext, JSONData.locations[location].styles[style].capacities[capacity].ambients[ambient].source.replace("/a/", "/b/").replace("/b/", "/c/").replace("/c/", "/d/").replace("/d/", "/e/").replace("/e/", "/f/").replace("/f/", "/" + ext + "/"));
				})
				panoAssetsManager.load();
			}
		} catch (err) {
			//console.log("skipped JSON check");
			text1A = text2A;
			text2A = texBlendB;
			text1B = text2B;
			text2B = texBlendB;
			text1C = text2C;
			text2C = texBlendB;
			text1D = text2D;
			text2D = texBlendB;
			text1E = text2E;
			text2E = texBlendB;
			text1F = text2F;
			text2F = texBlendB;
            
			blend = 1;
			panoAssetsManager.reset();
			loadingAssets = false;
			loadingAnim = true;
            
            loadingDivHTML.style.visibility = (!loadingAssets) ? "collapse" : "visible";
		}
	}
    
	panoAssetsManager.onProgress = function(remainingCount, totalCount, lastFinishedTask) {
		//console.log((totalCount - remainingCount) + " of " + totalCount);
		if (remainingCount == 0) {
			JSONData.locations[location].styles[style].capacities[capacity].ambients[ambient].loaded = loadLinkSuccess;
		}
	};

	panoAssetsManager.onTaskSuccessObservable.add(function(task) {
        
	});

	panoAssetsManager.onFinish = function(tasks) {
		//console.log("End Load Faces");
		if (loadLinkSuccess) {
			tasks.forEach(task => {
				if (instantTransition) {
					switch (task.name) {
						case "a":
							text1A = text2A = task.texture;
							break;
						case "b":
							text1B = text2B = task.texture;
							break;
						case "c":
							text1C = text2C = task.texture;
							break;
						case "d":
							text1D = text2D = task.texture;
							break;
						case "e":
							text1E = text2E = task.texture;
							break;
						case "f":
							text1F = text2F = task.texture;
							break;
					}
				} else {
					switch (task.name) {
						case "a":
							text1A = text2A;
							text2A = task.texture;
							break;
						case "b":
							text1B = text2B;
							text2B = task.texture;
							break;
						case "c":
							text1C = text2C;
							text2C = task.texture;
							break;
						case "d":
							text1D = text2D;
							text2D = task.texture;
							break;
						case "e":
							text1E = text2E;
							text2E = task.texture;
							break;
						case "f":
							text1F = text2F;
							text2F = task.texture;
							break;
					}
				}
			})
		} else {
			text1A = text2A;
			text2A = texBlendB;
			text1B = text2B;
			text2B = texBlendB;
			text1C = text2C;
			text2C = texBlendB;
			text1D = text2D;
			text2D = texBlendB;
			text1E = text2E;
			text2E = texBlendB;
			text1F = text2F;
			text2F = texBlendB;
		}

		blend = instantTransition;
		panoAssetsManager.reset();

		loadingAssets = false;
		loadingAnim = true;
        
        loadingDivHTML.style.visibility = (!loadingAssets) ? "collapse" : "visible";
	}

	panoAssetsManager.onTaskErrorObservable.add(function(task) {
		//console.log('task failed', task.errorObject.message, task.errorObject.exception);
		loadLinkSuccess = false;
	});

	panoAssetsManager.onError = function(task, message, exception) {
		//console.log(message, exception);
	}
}
function clearGalleryElements(){
    while (typeof galleryModalHTML.getElementsByTagName("ol")[0].children[0] != "undefined") {
		galleryModalHTML.getElementsByTagName("ol")[0].removeChild(galleryModalHTML.getElementsByTagName("ol")[0].children[0]);
	}
        
        while (typeof galleryModalHTML.getElementsByClassName("carousel-inner")[0].children[0] != "undefined") {
		galleryModalHTML.getElementsByClassName("carousel-inner")[0].removeChild(galleryModalHTML.getElementsByClassName("carousel-inner")[0].children[0]);
	}
}

function updateActives(from){
    //console.log("clear " + from);
    if(from == "locations") {
        clearGalleryElements();
        if (typeof JSONData.locations[activeLocation] == "undefined") {
            activeLocation = null;
            activeStyle = null;
            activeCapacity = null;
        }
        for (var location in JSONData.locations) {
            if (activeLocation == null) {
                activeLocation = location;
            }
        }
        
        if(activeLocation != null) {
            updateActives("styles");
        } else {
            clearGalleryElements();
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z")
            
        
            
            while (styleButtonsHTML.firstElementChild != null) {
                styleButtonsHTML.removeChild(styleButtonsHTML.firstElementChild);
            }
            
            while (collapseCapacitiesHTML.firstElementChild != null) {
                collapseCapacitiesHTML.removeChild(collapseCapacitiesHTML.firstElementChild);
            }
            
            updateUI();
            
        }
    }
    
    if(from == "styles") {
        
        JSONData.locations[activeLocation].links.forEach( link => {
            locationPlane = BABYLON.MeshBuilder.CreatePlane(activeLocation + " to " + link.link, {
            height: 1,
            width: 1
            });
            
            
            
            locationPlane.actionManager = actionManager;
            var locationPlaneMat = new BABYLON.StandardMaterial("locationPlaneMat", scene);
            locationPlaneMat.opacityTexture = new BABYLON.Texture("assets/textures/locationtex.png", scene);
            locationPlaneMat.emissiveColor = new BABYLON.Color3.FromHexString(JSONData.uiColor);
            locationPlane.material = locationPlaneMat;
            locationPlane.renderingGroupId = 1;

            fauxLoad();

            var Writer = BABYLON.MeshWriter(scene, {
                scale: 0.01,
                defaultFont: "Arial"
            });
            textW1 = new Writer(
                link.name.toUpperCase(), {
                    //  anchor: "center",
                    "letter-height": 28,
                    "font-family":"Arial",
                    //"font-style" : "italic",
                    "letter-thickness": 2,

                    colors: {
                        diffuse: "#000000",
                        specular: "#000000",
                        ambient: "#000000",
                        emissive: JSONData.uiColor
                    },
                    position: {
                        x: 0,
                        y: 0,
                        z: 500
                    }

                }
            );
            textW1.getMesh().name = link.name;
            textW1.getMesh().parent = locationPlane;
            textW1.getMesh().position.x = -textW1.getMesh()._boundingInfo.boundingBox.extendSize.x
            textW1.getMesh().position.y = -0.8;
            textW1.getMesh().position.z = 0.0;
            textW1.getMesh().rotation.x = -Math.PI / 2;
            textW1.getMesh().renderingGroupId = 1;
            locationPlane.position.x = link.x;
            locationPlane.position.y = link.y;
            locationPlane.position.z = link.z;
            locationPlane.lookAt(new BABYLON.Vector3(0, locationPlane.position.y, 0), 0, Math.PI, Math.PI);
        })
        
        
        clearGalleryElements();
        
        
        if (typeof JSONData.locations[activeLocation].styles[activeStyle] == "undefined") {
            activeStyle = null;
            activeCapacity = null;
        }
        for (var style in JSONData.locations[activeLocation].styles) {
            if (activeStyle == null) {
                activeStyle = style;
            }
            
            
        }
        if(activeStyle != null) {
            updateActives("capacities");
        } else {
           
            clearGalleryElements();
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z")
            
        
            
            while (styleButtonsHTML.firstElementChild != null) {
                styleButtonsHTML.removeChild(styleButtonsHTML.firstElementChild);
            }
            
            while (collapseCapacitiesHTML.firstElementChild != null) {
                collapseCapacitiesHTML.removeChild(collapseCapacitiesHTML.firstElementChild);
            }
            
            updateUI();
            
        }
        
        window.dispatchEvent(new Event('resize'));
    }
    
    if(from == "capacities") {
        clearGalleryElements();
        
        while (styleButtonsHTML.firstElementChild != null) {
            styleButtonsHTML.removeChild(styleButtonsHTML.firstElementChild);
        }
        
        
        
         for (var style in JSONData.locations[activeLocation].styles) {
            const styleImg = document.createElement("img");
                styleImg.setAttribute("class", "styleImage");
                styleImg.setAttribute("src", "assets/textures/" + style + ".png");
                styleImg.setAttribute("alt", "style");
             
                const styleButton = document.createElement("button");
                styleButton.setAttribute("type", "button");
                styleButton.setAttribute("class", "styleButton");
           
             
             styleButton.setAttribute("title", style);
             
                styleButton.setAttribute("onclick", "clickedStyle(this)");
                
                styleButton.appendChild(styleImg);
            
                styleButtonsHTML.appendChild(styleButton);
                
                styleButton.style.setProperty("--i", Array.from(styleButtonsHTML.children).indexOf(styleButton));
         }
        
        for(var styleButton in styleButtonsHTML.children) {
            if (typeof styleButtonsHTML.children[styleButton] == "object") {
                if(styleButtonsHTML.children[styleButton].getAttribute("title") == activeStyle) {
                    var r = document.querySelector(':root');
                    r.style.setProperty('--activeStyleIndex', styleButton);
                }
            }
        }
        
        if(styleButtonsHTML.childElementCount <=1) {
            while (styleButtonsHTML.firstElementChild != null) {
                styleButtonsHTML.removeChild(styleButtonsHTML.firstElementChild);
            }
            
            if(collapseMainMenuHTML.classList.contains("out")) {
                collapseMainMenuHTML.classList.remove('out');
                collapseMainMenuHTML.classList.add('activeForward');
                iterationCount = 0;
                collapseMainMenuHTML.getElementsByTagName('path')[0].setAttribute("d", "M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z");
                document.getElementById("toggleStylesButon").setAttribute("title", "Show Styles");
                
            }
            document.getElementById("toggleStylesButon").style.visibility = "collapse";
        } else {
                    document.getElementById("toggleStylesButon").style.visibility = "visible";
                }
        
        
        if (typeof JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity] == "undefined") {
            activeCapacity = null;
        }
        for (var capacity in JSONData.locations[activeLocation].styles[activeStyle].capacities) {
            if (activeCapacity == null) {
                activeCapacity = capacity;
            }
            
        }
        if(activeCapacity != null) {
            updateActives("galleryLinks");
        } else {
            
            clearGalleryElements();
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z")
            
            while (collapseCapacitiesHTML.firstElementChild != null) {
                collapseCapacitiesHTML.removeChild(collapseCapacitiesHTML.firstElementChild);
            }
            
            updateUI();
            
        }
    }
    
    if(from == "galleryLinks") {
        
        JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].gallery.forEach(imageLink => {
            addGalleryDiv(imageLink);
        })
        
        while (collapseCapacitiesHTML.firstElementChild != null) {
                collapseCapacitiesHTML.removeChild(collapseCapacitiesHTML.firstElementChild);
            }
        
        for (var capacity in JSONData.locations[activeLocation].styles[activeStyle].capacities) {
            const capacityPath = document.createElementNS('http://www.w3.org/2000/svg', "path");
            capacityPath.setAttribute("d", "M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z");
            
            const capacitySVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          //  const capacitySVG = document.createElement("svg");
         //   capacitySVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            capacitySVG.setAttribute("width", (document.getElementById("toggleCapSliderButton").clientWidth/3).toString());
            capacitySVG.setAttribute("height", (document.getElementById("toggleCapSliderButton").clientWidth/3).toString());
            capacitySVG.setAttribute("fill", "currentColor");
            capacitySVG.setAttribute("class", "bi bi-people");
            capacitySVG.setAttribute("viewBox", "0 0 16 16");
            capacitySVG.appendChild(capacityPath);
           // capacitySVG.style.height = "100%";
             
            
            const capacitySpan = document.createElement("span");
          //  capacitySpan.style.fontSize = (document.getElementById("toggleCapSliderButton").clientWidth/3).toString() + "px";
          //  capacitySpan.style.marginLeft = (document.getElementById("toggleCapSliderButton").clientWidth/4).toString() + "px";
            capacitySpan.innerText = capacity;
           // capacitySpan.style.height = "100%";
          //  capacitySpan.style.verticalAlign = "sub";
            
                const capacityButton = document.createElement("button");
                capacityButton.setAttribute("type", "button");
                capacityButton.setAttribute("class", "capacityButton");
                capacityButton.setAttribute("onclick", "clickedCapacity(this)");
            
            capacityButton.appendChild(capacitySVG);
            capacityButton.appendChild(capacitySpan);
          //  capacitySVG.style.float = "left";
            
            const cDiv = document.createElement("div");
            cDiv.appendChild(capacityButton);
            
                collapseCapacitiesHTML.appendChild(cDiv);
                
                capacityButton.style.setProperty("--i", Array.from(collapseCapacitiesHTML.children).indexOf(cDiv));
         }
        
        for(var capacityButtonP in collapseCapacitiesHTML.children) {
            if (typeof collapseCapacitiesHTML.children[capacityButtonP] == "object") {
                if(collapseCapacitiesHTML.children[capacityButtonP].getElementsByTagName("span")[0].innerText == activeCapacity) {
                    var r = document.querySelector(':root');
                    r.style.setProperty('--activeCapacityIndex', capacityButtonP);
                }
            }
        }
        
        if(collapseCapacitiesHTML.childElementCount <=1) {
                while (collapseCapacitiesHTML.firstElementChild != null) {
                    collapseCapacitiesHTML.removeChild(collapseCapacitiesHTML.firstElementChild);
                }
            
            if(collapseCapacitiesHTML.classList.contains("in")) {
                collapseCapacitiesHTML.classList.remove('in');
                collapseCapacitiesHTML.classList.add('activeBackward');
                iterationCount = 0;
                document.getElementById("toggleCapSliderButton").setAttribute("title", "Switch Capacity");

            }
        }
        
        updateActives("ambients");
    }
        
        if(from == "ambients") {
            
            if (typeof JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].ambients[activeAmbient] == "undefined") {
                activeAmbient = null;
            }
            for (var ambient in JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].ambients) {
                if (activeAmbient == null) {
                    activeAmbient = ambient;
                    if(JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].gallery.length > 0) {
                        
                    } else {
                        
                    }
                    
                }
                
										}
            updateUI();
            
            
    }
}

function focusedLocation(field) {
    if(!loadingAssets && !loadingAnim) {
        //console.log("focus " + field.value);
        
        JSONData.locations[activeLocation].links.forEach( link => {
            if(scene.getMeshByName(activeLocation + " to " + link.link) != null)
            scene.getMeshByName(activeLocation + " to " + link.link).dispose();
        })
                
        
        activeLocation = field.value;

        updateActives("styles");

        //console.log(activeLocation + "_" + activeStyle + "_" + activeCapacity + "_" + activeAmbient);
        loadPano(activeLocation, activeStyle, activeCapacity, activeAmbient);
    }
}


function toggleAmbient(button) {
    if(!loadingAssets && !loadingAnim) {
        if(activeAmbient == "ambient1") {
            activeAmbient = "ambient2";
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13h-5a.5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm3 8.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1-.5-.5z");
        } else {
            activeAmbient = "ambient1";
            document.getElementById("toggleAmbientButton").firstElementChild.firstElementChild.setAttribute("d", "M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z");
        }
        
        //console.log("focus " + JSONData.locations[activeLocation].styles[activeStyle].capacities[activeCapacity].ambients[activeAmbient]);
        
        //console.log(activeLocation + "_" + activeStyle + "_" + activeCapacity + "_" + activeAmbient);
        loadPano(activeLocation, activeStyle, activeCapacity, activeAmbient);
    }
}


let iterationCount = 0;

collapseTitleMenuHTML.addEventListener('animationstart', () => {
  //console.log("animation started");
});

collapseTitleMenuHTML.addEventListener('animationiteration', () => {
  iterationCount++;
  //console.log("animation iterations: " + iterationCount);
});

collapseTitleMenuHTML.addEventListener('animationend', () => {
  //console.log("animation ended");
    if(collapseTitleMenuHTML.classList.contains("activeForward")) {
        collapseTitleMenuHTML.classList.remove('activeForward');
         collapseTitleMenuHTML.classList.add("in");
    } else if(collapseTitleMenuHTML.classList.contains("activeBackward")) {
        collapseTitleMenuHTML.classList.remove('activeBackward');
         collapseTitleMenuHTML.classList.add("out");
    }
});

collapseTitleMenuHTML.addEventListener('animationcancel', () => {
  //console.log("animation canceled");
});

function toggleTitleSlider() {
    let active = collapseTitleMenuHTML.classList.contains('activeForward');
    if (active) {
        
    } else {
        if(collapseTitleMenuHTML.classList.contains("out")) {
            collapseTitleMenuHTML.classList.remove('out');
            collapseTitleMenuHTML.classList.add('activeForward');
            iterationCount = 0;
            collapseTitleMenuHTML.getElementsByTagName('path')[0].setAttribute("d", "M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753z");
            collapseTitleMenuHTML.getElementsByTagName("button")[0].setAttribute("title", "Show Details");
            
            
        } else if(collapseTitleMenuHTML.classList.contains("in")) {
            collapseTitleMenuHTML.classList.remove('in');
            collapseTitleMenuHTML.classList.add('activeBackward');
            iterationCount = 0;
            collapseTitleMenuHTML.getElementsByTagName('path')[0].setAttribute("d", "M10 12.796V3.204L4.519 8 10 12.796zm-.659.753-5.48-4.796a1 1 0 0 1 0-1.506l5.48-4.796A1 1 0 0 1 11 3.204v9.592a1 1 0 0 1-1.659.753z");
            collapseTitleMenuHTML.getElementsByTagName("button")[0].setAttribute("title", "Hide Details");
        }
    }
}

collapseMainMenuHTML.addEventListener('animationstart', () => {
  //console.log("animation started");
});

collapseMainMenuHTML.addEventListener('animationiteration', () => {
  iterationCount++;
  //console.log("animation iterations: " + iterationCount);
});

collapseMainMenuHTML.addEventListener('animationend', () => {
  //console.log("animation ended");
    if(collapseMainMenuHTML.classList.contains("activeForward")) {
        collapseMainMenuHTML.classList.remove('activeForward');
         collapseMainMenuHTML.classList.add("in");
    } else if(collapseMainMenuHTML.classList.contains("activeBackward")) {
        collapseMainMenuHTML.classList.remove('activeBackward');
         collapseMainMenuHTML.classList.add("out");
        window.dispatchEvent(new Event('resize'));
    }
});

collapseMainMenuHTML.addEventListener('animationcancel', () => {
  //console.log("animation canceled");
});

function toggleMainSlider(button) {
    let active = collapseMainMenuHTML.classList.contains('activeForward');
    if (active) {
        
    } else {
        if(collapseMainMenuHTML.classList.contains("out")) {
            collapseMainMenuHTML.classList.remove('out');
            collapseMainMenuHTML.classList.add('activeForward');
            iterationCount = 0;
            collapseMainMenuHTML.getElementsByTagName('path')[0].setAttribute("d", "M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z");
            button.setAttribute("title", "Show Styles");
            
            
        } else if(collapseMainMenuHTML.classList.contains("in")) {
            collapseMainMenuHTML.classList.remove('in');
            collapseMainMenuHTML.classList.add('activeBackward');
            iterationCount = 0;
            collapseMainMenuHTML.getElementsByTagName('path')[0].setAttribute("d", "M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z");
            button.setAttribute("title", "Hide Styles");
            
        }
    }
}


function toggleCapSlider(button) {
    if(collapseCapacitiesHTML.childElementCount > 1) {
         let active = collapseCapacitiesHTML.classList.contains('activeForward');
        if (active) {

        } else {
            if(collapseCapacitiesHTML.classList.contains("out")) {
                collapseCapacitiesHTML.classList.remove('out');
                collapseCapacitiesHTML.classList.add('activeForward');
                iterationCount = 0;
                button.setAttribute("title", "Hide List");


            } else if(collapseCapacitiesHTML.classList.contains("in")) {
                collapseCapacitiesHTML.classList.remove('in');
                collapseCapacitiesHTML.classList.add('activeBackward');
                iterationCount = 0;
                button.setAttribute("title", "Switch Capacity");

            }
        }
    }
}

collapseCapacitiesHTML.addEventListener('animationstart', () => {
  //console.log("animation started");
    if(collapseCapacitiesHTML.classList.contains("activeBackward")) {
        document.getElementById("toggleCapSliderButton").style.borderTopLeftRadius = "10px";
    } else if(collapseCapacitiesHTML.classList.contains("activeForward")) {
        document.getElementById("toggleCapSliderButton").style.borderTopLeftRadius = "0px";
    }
});

collapseCapacitiesHTML.addEventListener('animationiteration', () => {
  iterationCount++;
  //console.log("animation iterations: " + iterationCount);
});

collapseCapacitiesHTML.addEventListener('animationend', () => {
  //console.log("animation ended");
    if(collapseCapacitiesHTML.classList.contains("activeForward")) {
        collapseCapacitiesHTML.classList.remove('activeForward');
         collapseCapacitiesHTML.classList.add("in");
    } else if(collapseCapacitiesHTML.classList.contains("activeBackward")) {
        collapseCapacitiesHTML.classList.remove('activeBackward');
         collapseCapacitiesHTML.classList.add("out");
    }
});

collapseCapacitiesHTML.addEventListener('animationcancel', () => {
  //console.log("animation canceled");
});


function clickedStyle(button){
    if(!loadingAssets && !loadingAnim) {
        var r = document.querySelector(':root');
        if(button.style.getPropertyValue("--i") != r.style.getPropertyValue('--activeStyleIndex')) {
            activeStyle = button.getAttribute("title");
            
            //console.log("focus " + activeStyle);
            
            updateActives("capacities");
            
            //console.log(activeLocation + "_" + activeStyle + "_" + activeCapacity + "_" + activeAmbient);
            loadPano(activeLocation, activeStyle, activeCapacity, activeAmbient);
        }
    }
}

function clickedCapacity(button){
    if(!loadingAssets && !loadingAnim) {
        var r = document.querySelector(':root');
        if(button.style.getPropertyValue("--i") != r.style.getPropertyValue('--activeCapacityIndex')) {
            clearGalleryElements();
            activeCapacity = button.getElementsByTagName("span")[0].innerText; 
            
            //console.log("focus " + activeCapacity);
            
            updateActives("galleryLinks");
            //console.log(activeLocation + "_" + activeStyle + "_" + activeCapacity + "_" + activeAmbient);
            loadPano(activeLocation, activeStyle, activeCapacity, activeAmbient);
        }
    } 
}

function share() {
    document.getElementById("inputShare").value = window.location.href;
}

function showGallery() {
    var multipleImages = galleryModalHTML.getElementsByClassName("carousel-indicators")[0].childElementCount > 1;
    
    galleryModalHTML.getElementsByClassName("carousel-control-prev")[0].style.visibility = (!multipleImages) ? "collapse" : "visible";
    galleryModalHTML.getElementsByClassName("carousel-control-next")[0].style.visibility = (!multipleImages) ? "collapse" : "visible";
    galleryModalHTML.getElementsByClassName("carousel-indicators")[0].style.visibility = (!multipleImages) ? "collapse" : "visible";
}

function copyLink() {
    document.getElementById("inputShare").select();
    document.getElementById("inputShare").setSelectionRange(0, 99999); /* For mobile devices */
    document.execCommand("copy");
}

var elem = document.documentElement;
function fullSc(button, forward) {
    if(forward) {
        if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
        
        button.setAttribute('onclick','fullSc(this, false)');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
          }
        
        button.setAttribute('onclick','fullSc(this, true)');
    }
    
}

function ClickRequestDeviceMotionEvent() {
    button.onPointerClickObservable._observers[0].callback();
    document.getElementById("beginBanner").style.visibility = "collapse";
}
