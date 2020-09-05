 (function(modules) {
 	var installedModules = {};
 	function __webpack_require__(moduleId) {
 		if(installedModules[moduleId])
 			return installedModules[moduleId].exports;
 		var module = installedModules[moduleId] = {
 			exports: {},
 			id: moduleId,
 			loaded: false
 		};
 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
 		module.loaded = true;
 		return module.exports;
 	}

 	__webpack_require__.m = modules;
 	__webpack_require__.c = installedModules;
 	__webpack_require__.p = "";
 	return __webpack_require__(0);
 })
 ([
(function(module, exports, __webpack_require__) {
	var cylinderTexture = __webpack_require__(1);
	var parabolicCurve = __webpack_require__(2);
	var RayCurve = __webpack_require__(3);

	if (typeof AFRAME === 'undefined') {
		throw new Error('Component attempted to register before AFRAME was available.');
	}

	if (!Element.prototype.matches) {
		Element.prototype.matches =
			Element.prototype.matchesSelector ||
			Element.prototype.mozMatchesSelector ||
			Element.prototype.msMatchesSelector ||
			Element.prototype.oMatchesSelector ||
			Element.prototype.webkitMatchesSelector ||
			function (s) {
				var matches = (this.document || this.ownerDocument).querySelectorAll(s);
				var i = matches.length;
				while (--i >= 0 && matches.item(i) !== this) { /* no-op */ }
				return i > -1;
			};
	}

	AFRAME.registerComponent('teleport-controls', {
		schema: {
			type: {default: 'line', oneOf: ['parabolic', 'line']},
			button: {default: 'xbutton', oneOf: ['xbutton','trigger']},
			startEvents: {type: 'array'},
			endEvents: {type: 'array'},
			collisionEntities: {default: ''},
			hitEntity: {type: 'selector'},
			cameraRig: {type: 'selector'},
			teleportOrigin: {type: 'selector'},
			hitCylinderColor: {type: 'color', default: '#99ff99'},
			hitCylinderRadius: {default: 0.25, min: 0},
			hitCylinderHeight: {default: 0.1, min: 0},
			interval: {default: 0},
			maxLength: {default: 3, min: 0, if: {type: ['line']}},
			curveNumberPoints: {default: 30, min: 2, if: {type: ['parabolic']}},
			curveLineWidth: {default: 0.025},
			curveHitColor: {type: 'color', default: '#99ff99'},
			curveMissColor: {type: 'color', default: '#ff0000'},
			curveShootingSpeed: {default: 5, min: 0, if: {type: ['parabolic']}},
			defaultPlaneSize: { default: 100 },
			landingNormal: {type: 'vec3', default: '0 1 0'},
			landingMaxAngle: {default: '45', min: 0, max: 360},
			drawIncrementally: {default: false},
			incrementalDrawMs: {default: 700},
			missOpacity: {default: 1.0},
			hitOpacity: {default: 1.0},
			game: {type:'selector'}
		},

		init: function () {
			var data = this.data;
			var el = this.el;
			var teleportEntity;
			var i;

			this.active = false;
			this.obj = el.object3D;
			this.hitPoint = new THREE.Vector3();
			this.rigWorldPosition = new THREE.Vector3();
			this.newRigWorldPosition = new THREE.Vector3();
			this.teleportEventDetail = {
				oldPosition: this.rigWorldPosition,
				newPosition: this.newRigWorldPosition,
				hitPoint: this.hitPoint
			};

			this.data.game = document.querySelector("#game");
			this.hit = false;
			this.prevCheckTime = undefined;
			this.prevHitHeight = 0;
			this.referenceNormal = new THREE.Vector3();
			this.curveMissColor = new THREE.Color();
			this.curveHitColor = new THREE.Color();
			this.raycaster = new THREE.Raycaster();

			this.defaultPlane = createDefaultPlane(this.data.defaultPlaneSize);
			this.defaultCollisionMeshes = [this.defaultPlane];

			teleportEntity = this.teleportEntity = document.createElement('a-entity');
			teleportEntity.classList.add('teleportRay');
			teleportEntity.setAttribute('visible', false);
			el.sceneEl.appendChild(this.teleportEntity);

			this.onButtonDown = this.onButtonDown.bind(this);
			this.onButtonUp = this.onButtonUp.bind(this);
			if (this.data.startEvents.length && this.data.endEvents.length) {

				for (i = 0; i < this.data.startEvents.length; i++) {
					el.addEventListener(this.data.startEvents[i], this.onButtonDown);
				}
				for (i = 0; i < this.data.endEvents.length; i++) {
					el.addEventListener(this.data.endEvents[i], this.onButtonUp);
				}
			} else {
				el.addEventListener(data.button + 'down', this.onButtonDown);
				el.addEventListener(data.button + 'up', this.onButtonUp);
			}

			this.queryCollisionEntities();
		},

		update: function (oldData) {
			var data = this.data;
			var diff = AFRAME.utils.diff(data, oldData);
			this.referenceNormal.copy(data.landingNormal);
			this.curveMissColor.set(data.curveMissColor);
			this.curveHitColor.set(data.curveHitColor);
			if (!this.line ||
					'curveLineWidth' in diff || 'curveNumberPoints' in diff || 'type' in diff) {

				this.line = createLine(data);
				this.line.material.opacity = this.data.hitOpacity;
				this.line.material.transparent = this.data.hitOpacity < 1;
				this.numActivePoints = data.curveNumberPoints;
				this.teleportEntity.setObject3D('mesh', this.line.mesh);
			}
			if (data.hitEntity) {
				this.hitEntity = data.hitEntity;
			} else if (!this.hitEntity || 'hitCylinderColor' in diff || 'hitCylinderHeight' in diff ||
								 'hitCylinderRadius' in diff) {
				// Remove previous entity, create new entity (could be more performant).
				if (this.hitEntity) { this.hitEntity.parentNode.removeChild(this.hitEntity); }
				this.hitEntity = createHitEntity(data);
				this.el.sceneEl.appendChild(this.hitEntity);
			}
			this.hitEntity.setAttribute('visible', false);

			if ('collisionEntities' in diff) { this.queryCollisionEntities(); }
		},

		remove: function () {
			var el = this.el;
			var hitEntity = this.hitEntity;
			var teleportEntity = this.teleportEntity;

			if (hitEntity) { hitEntity.parentNode.removeChild(hitEntity); }
			if (teleportEntity) { teleportEntity.parentNode.removeChild(teleportEntity); }

			el.sceneEl.removeEventListener('child-attached', this.childAttachHandler);
			el.sceneEl.removeEventListener('child-detached', this.childDetachHandler);
		},

		tick: (function () {
			var p0 = new THREE.Vector3();
			var v0 = new THREE.Vector3();
			var g = -9.8;
			var a = new THREE.Vector3(0, g, 0);
			var next = new THREE.Vector3();
			var last = new THREE.Vector3();
			var quaternion = new THREE.Quaternion();
			var translation = new THREE.Vector3();
			var scale = new THREE.Vector3();
			var shootAngle = new THREE.Vector3();
			var lastNext = new THREE.Vector3();
			var auxDirection = new THREE.Vector3();
			var timeSinceDrawStart = 0;

			return function (time, delta) {
				this.data.maxLength = this.data.game.components.game.data.battery/10;
				if (!this.active) { return; }
				if (this.data.drawIncrementally && this.redrawLine){
					this.redrawLine = false;
					timeSinceDrawStart = 0;
				}
				timeSinceDrawStart += delta;
				this.numActivePoints = this.data.curveNumberPoints*timeSinceDrawStart/this.data.incrementalDrawMs;
				if (this.numActivePoints > this.data.curveNumberPoints){
					this.numActivePoints = this.data.curveNumberPoints;
				}
				if (this.prevCheckTime && (time - this.prevCheckTime < this.data.interval)) { return; }
				this.prevCheckTime = time;

				var matrixWorld = this.obj.matrixWorld;
				matrixWorld.decompose(translation, quaternion, scale);

				var direction = shootAngle.set(0, 0, -1)
					.applyQuaternion(quaternion).normalize();
				this.line.setDirection(auxDirection.copy(direction));
				this.obj.getWorldPosition(p0);

				last.copy(p0);

				this.teleportEntity.setAttribute('visible', true);
				this.line.material.color.set(this.curveMissColor);
				this.line.material.opacity = this.data.missOpacity;
				this.line.material.transparent = this.data.missOpacity < 1;
				this.hitEntity.setAttribute('visible', false);
				this.hit = false;


					next.copy(last).add(auxDirection.copy(direction).multiplyScalar(this.data.maxLength));
					this.raycaster.far = this.data.maxLength;
					this.raycaster.set(p0, direction);
					this.line.setPoint(0, p0);

					this.checkMeshCollisions(1, next);
			};
		})(),

		queryCollisionEntities: function () {
			var collisionEntities;
			var data = this.data;
			var el = this.el;

			if (!data.collisionEntities) {
				this.collisionEntities = [];
				return;
			}
			console.log(el.sceneEl.querySelectorAll(data.collisionEntities));
			collisionEntities = [].slice.call(el.sceneEl.querySelectorAll(data.collisionEntities));
			this.collisionEntities = collisionEntities;

			this.childAttachHandler = function childAttachHandler (evt) {
				if (!evt.detail.el.matches(data.collisionEntities)) { return; }
				collisionEntities.push(evt.detail.el);
			};
			el.sceneEl.addEventListener('child-attached', this.childAttachHandler);

			this.childDetachHandler = function childDetachHandler (evt) {
				var index;
				if (!evt.detail.el.matches(data.collisionEntities)) { return; }
				index = collisionEntities.indexOf(evt.detail.el);
				if (index === -1) { return; }
				collisionEntities.splice(index, 1);
			};
			el.sceneEl.addEventListener('child-detached', this.childDetachHandler);
		},

		onButtonDown: function () {
			this.active = true;
			this.redrawLine = true;
		},

		/**
		 * Jump!
		 */
		onButtonUp: (function () {
			const teleportOriginWorldPosition = new THREE.Vector3();
			const newRigLocalPosition = new THREE.Vector3();
			const newHandPosition = [new THREE.Vector3(), new THREE.Vector3()]; // Left and right
			const handPosition = new THREE.Vector3();

			return function (evt) {
				if (!this.active) { return; }

				this.active = false;
				this.hitEntity.setAttribute('visible', false);
				this.teleportEntity.setAttribute('visible', false);

				if (!this.hit) {
					return;
				}

				const rig = document.querySelector("#rig") || this.data.cameraRig || this.el.sceneEl.camera.el;
				rig.object3D.getWorldPosition(this.rigWorldPosition);
				this.newRigWorldPosition.copy(this.hitPoint);

				const teleportOrigin = this.data.teleportOrigin;
				if (teleportOrigin) {
					teleportOrigin.object3D.getWorldPosition(teleportOriginWorldPosition);
					this.newRigWorldPosition.sub(teleportOriginWorldPosition).add(this.rigWorldPosition);
				}

				this.newRigWorldPosition.y = this.rigWorldPosition.y + this.hitPoint.y - this.prevHitHeight;
				this.prevHitHeight = this.hitPoint.y;

				var distance = this.rigWorldPosition.distanceTo(this.newRigWorldPosition);
				newRigLocalPosition.copy(this.newRigWorldPosition);
				if (rig.object3D.parent) {
					rig.object3D.parent.worldToLocal(newRigLocalPosition);
				}
				rig.setAttribute('position', newRigLocalPosition);
				checkWin(this.newRigWorldPosition);

				this.data.game.components.game.data.battery-=(distance*10);
				if(this.data.game.components.game.data.battery<0)this.data.game.components.game.data.battery=0;
				this.el.emit('teleported', this.teleportEventDetail);
			};
		})(),

		checkMeshCollisions: function (i, next) {
			var meshes;
			if (!this.data.collisionEntities) {
				meshes = this.defaultCollisionMeshes;
			} else {
				meshes = this.collisionEntities.map(function (entity) {
					return entity.getObject3D('mesh');
				}).filter(function (n) { return n; });
				meshes = meshes.length ? meshes : this.defaultCollisionMeshes;
			}
			console.log(meshes);
			var intersects = this.raycaster.intersectObjects(meshes, true);
			if (intersects.length > 0 && !this.hit &&
					this.isValidNormalsAngle(intersects[0].face.normal)) {
				var point = intersects[0].point;

				this.line.material.color.set(this.curveHitColor);
				this.line.material.opacity = this.data.hitOpacity;
				this.line.material.transparent= this.data.hitOpacity < 1;
				this.hitEntity.setAttribute('position', point);
				this.hitEntity.setAttribute('visible', true);

				this.hit = true;
				this.hitPoint.copy(intersects[0].point);

				for (var j = i; j < this.line.numPoints; j++) {
					this.line.setPoint(j, this.hitPoint);
				}
				return true;
			} else {
				this.line.setPoint(i, next);
				return false;
			}
		},

		isValidNormalsAngle: function (collisionNormal) {
			var angleNormals = this.referenceNormal.angleTo(collisionNormal);
			return (THREE.Math.RAD2DEG * angleNormals <= this.data.landingMaxAngle);
		},
	});

	function checkWin(newRigWorldPosition) {
		teleporterPosition = document.querySelector("#game").components.game.data.teleporterPosition.split(' ');
		if ((newRigWorldPosition.x <= teleporterPosition[0] + .6) && (newRigWorldPosition.x >= teleporterPosition[0] - .6) &&
		(newRigWorldPosition.z <= teleporterPosition[2] + .6) && (newRigWorldPosition.z >= teleporterPosition[2] - .6)) win();
	}

	function createLine (data) {
		var numPoints = data.type === 'line' ? 2 : data.curveNumberPoints;
		return new RayCurve(numPoints, data.curveLineWidth);
	}

	function createHitEntity (data) {
		var cylinder;
		var hitEntity;
		var torus;

		hitEntity = document.createElement('a-entity');
		hitEntity.className = 'hitEntity';

		torus = document.createElement('a-entity');
		torus.setAttribute('geometry', {
			primitive: 'torus',
			radius: data.hitCylinderRadius,
			radiusTubular: 0.01
		});
		torus.setAttribute('rotation', {x: 90, y: 0, z: 0});
		torus.setAttribute('material', {
			shader: 'flat',
			color: data.hitCylinderColor,
			side: 'double',
			depthTest: false
		});
		hitEntity.appendChild(torus);

		cylinder = document.createElement('a-entity');
		cylinder.setAttribute('position', {x: 0, y: data.hitCylinderHeight / 2, z: 0});
		cylinder.setAttribute('geometry', {
			primitive: 'cylinder',
			segmentsHeight: 1,
			radius: data.hitCylinderRadius,
			height: data.hitCylinderHeight,
			openEnded: true
		});
		cylinder.setAttribute('material', {
			shader: 'flat',
			color: data.hitCylinderColor,
			side: 'double',
			src: cylinderTexture,
			transparent: true,
			depthTest: false
		});
		hitEntity.appendChild(cylinder);

		return hitEntity;
	}

	function createDefaultPlane (size) {
		var geometry;
		var material;

		geometry = new THREE.PlaneBufferGeometry(100, 100);
		geometry.rotateX(-Math.PI / 2);
		material = new THREE.MeshBasicMaterial({color: 0xffff00});
		return new THREE.Mesh(geometry, material);
	}


 }),
 (function(module, exports) {

	module.exports = '';


 }),
 (function(module, exports) {

	module.exports = '';


 }),
 (function(module, exports) {

	var RayCurve = function (numPoints, width) {
		this.geometry = new THREE.BufferGeometry();
		this.vertices = new Float32Array(numPoints * 3 * 2);
		this.uvs = new Float32Array(numPoints * 2 * 2);
		this.width = width;

		this.geometry.addAttribute('position', new THREE.BufferAttribute(this.vertices, 3).setDynamic(true));

		this.material = new THREE.MeshBasicMaterial({
			side: THREE.DoubleSide,
			color: 0xff0000
		});

		this.mesh = new THREE.Mesh(this.geometry, this.material);

		this.mesh.frustumCulled = false;
		this.mesh.vertices = this.vertices;

		this.direction = new THREE.Vector3();
		this.numPoints = numPoints;
	};

	RayCurve.prototype = {
		setDirection: function (direction) {
			var UP = new THREE.Vector3(0, 1, 0);
			this.direction
				.copy(direction)
				.cross(UP)
				.normalize()
				.multiplyScalar(this.width / 2);
		},

		setWidth: function (width) {
			this.width = width;
		},

		setPoint: (function () {
			var posA = new THREE.Vector3();
			var posB = new THREE.Vector3();

			return function (i, point) {
				posA.copy(point).add(this.direction);
				posB.copy(point).sub(this.direction);

				var idx = 2 * 3 * i;
				this.vertices[idx++] = posA.x;
				this.vertices[idx++] = posA.y;
				this.vertices[idx++] = posA.z;

				this.vertices[idx++] = posB.x;
				this.vertices[idx++] = posB.y;
				this.vertices[idx++] = posB.z;

				this.geometry.attributes.position.needsUpdate = true;
			};
		})()
	};

	module.exports = RayCurve;


 })
 ]);