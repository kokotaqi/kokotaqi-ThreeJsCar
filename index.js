import * as CANNON from "./cannon-es.js";
let renderer, camera, scene, spotLight, height, width
let camera_x = 0, camera_z = 0
let world
function $(_) {
  return document.querySelector(_)
}
$("#startButton").onclick = start
function start() {
  startButton.innerHTML = '加载中...'
  loading.style.display = 'block'
  $("#gameMenu").style.opacity = "0.5"
  initAudio()
  initScene()
  initCamera()
  initLight()
  initRenderer()
  loadModel()
  CANNONWorld()
  render()
  // 车
  another_car()
  // 玩家操控
  player_move()
  another_car_control()
  gameMenuControl()
  window.addEventListener('resize', onWindowResize)
  startButton.innerHTML = '加载成功，进入中...'
  overplay.style.display = "none"
  loading.style.display = "none"
}
// 音乐设置
function initAudio() {
  let listener = new THREE.AudioListener()
  let audio = new THREE.Audio(listener)
  let audioLoader = new THREE.AudioLoader()
  audioLoader.load('backgroundMusic.mp3', (AudioBuffer) => {
    audio.setBuffer(AudioBuffer)
    audio.setVolume = "0.8"
    audio.play()
  })
}
// 初始化画布
function initScene() {
  scene = new THREE.Scene()
}
// 初始化相机
function initCamera() {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000)
  camera.position.set(camera_x, 2.5, camera_z)
  // 使相机具有矢量性
  camera.lookAt(camera.position.x + Math.sin(angle), 2.5, camera.position.z + Math.cos(angle))
  camera.updateProjectionMatrix();
}
// 初始化光
function initLight() {
  // 点射光
  spotLight = new THREE.SpotLight(0xffffff, 1.0);
  spotLight.decay = 1;
  spotLight.intensity = 1;
  spotLight.position.set(0, 0, 0)
  scene.add(spotLight);
  // 物体自己发光
  const ambient = new THREE.AmbientLight(0xffffff, 0.01);
  scene.add(ambient);
}
// 渲染设置
function initRenderer() {
  // 抗锯齿设置
  renderer = new THREE.WebGLRenderer({ antialias: true })
  width = window.innerWidth
  height = window.innerHeight
  renderer.setSize(width, height)
  // 其他设置
  renderer.autoClear = false;
  renderer.sortObjects = false;
  renderer.gammaOutput = true;
  renderer.shadowMapSoft = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMapAutoUpdate = true;
  renderer.localClippingEnabled = true;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.gammaFactor = 2.2;
  renderer.toneMappingExposure = 1.25;
  renderer.toneMappingWhitePoint = 1.0;
  renderer.setClearColor(0x000089, 1.0)
  // 渲染到画布上，画布在body上
  document.body.appendChild(renderer.domElement)
}
function loadModel() {
  // 环境加载
  new THREE.RGBELoader().load('./puresky.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    scene.environment = texture
  })
  // 模型加载
  const loader = new THREE.GLTFLoader()
  loader.load('./scene.glb', (gltf) => {
    gltf.scene.scale.set(1, 1, 1)
    gltf.scene.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.receiveShadow = true
        child.castShadow = true
      }
    });
    scene.add(gltf.scene)
    // trimeshbody
    const trimeshShape = new CANNON.Trimesh(
      gltf.scene.children[0].geometry.attributes.position.array,
      gltf.scene.children[0].geometry.index.array
    )
    let trimeshBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, 0, 0),
      shape: trimeshShape,
    })
    gltf.scene.position.copy(trimeshBody.position)
    gltf.scene.quaternion.copy(trimeshBody.quaternion)
    world.addBody(trimeshBody)
  })
  const Carloader = new THREE.GLTFLoader()
  Carloader.load('./Car.glb', (gltf) => {
    gltf.scene.scale.set(0.5, 0.5, 0.5)
    gltf.scene.rotation.x = -Math.PI / 4
    scene.add(gltf.scene)
    function followTheCar() {
      requestAnimationFrame(followTheCar)
      gltf.scene.position.copy(meshes[0].position)
      gltf.scene.quaternion.copy(meshes[0].quaternion)
    }
    followTheCar()
  })
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  renderer.setSize(window.innerWidth, window.innerHeight)
}
// 摄像头移动
let left_ = false, forward_ = false, right_ = false, back_ = false, up_ = false, down_ = false
let camera_damping_left_ = 360, camera_damping_right_ = 360
let camera_damping_left = false, camera_damping_right = false
let angle = Math.PI, speed = 0.0001, slow = false
let camera_position, y = 2.5
let freedomCamera = true, CarCamera = false
function player_move() {
  when_keydown()
  when_keyup()
}
// 按下方向键
function when_keydown() {
  document.onkeydown = function (e) {
    if (e.key === "a" || e.key === "A") { left_ = true }
    if (e.key === "w" || e.key === "W") { forward_ = true }
    if (e.key === "d" || e.key === "D") { right_ = true }
    if (e.key === "s" || e.key === "S") { back_ = true }
    if (e.key === "8") { up_ = true }
    if (e.key === "2") { down_ = true }
  }
}
// 弹起方向键
function when_keyup() {
  document.onkeyup = function (e) {
    if (e.key === "a") {
      left_ = false
      camera_damping_left = true
      camera_damping_left_ = 360
      setTimeout(() => {
        camera_damping_left = false
      }, 500);
    }
    if (e.key === "w") { forward_ = false }
    if (e.key === "d") {
      right_ = false
      camera_damping_right = true
      setTimeout(() => {
        camera_damping_right = false
        camera_damping_right_ = 360
      }, 500);
    }
    if (e.key === "s") { back_ = false }
    if (e.key === "8") { up_ = false }
    if (e.key === "2") { down_ = false }
  }
}
// 玩家控制
function playerinit() {
  if (left_) { angle += Math.PI / 360 }
  if (right_) { angle -= Math.PI / 360 }
  if (left_ || right_) {
    camera_position = { x: Math.sin(angle), y: 0, z: Math.cos(angle) }
    camera.lookAt(camera.position.x + Math.sin(angle), y, camera.position.z + Math.cos(angle))
  }
  if (forward_ || back_) {
    if (forward_) {
      if (speed < 0.15) {
        speed += 0.00005
      }
    }
    if (back_) {
      if (speed > -0.15)
        speed -= 0.00005
    }
    camera.lookAt(camera.position.x + Math.sin(angle), y, camera.position.z + Math.cos(angle))
    slow = false
  }
  else {
    slow = true
  }
  if (slow) {
    if (speed > 0.0001 || speed < -0.0001) {
      speed = speed * 0.99
    }
  }
  if (speed > 0.00001 || speed < -0.00001) {
    camera_position = { x: Math.sin(angle), y: 0, z: Math.cos(angle) }
    camera_z += camera_position.z * speed;
    camera_x += camera_position.x * speed;
    camera.position.set(camera_x, y, camera_z)
  }
  if (camera_damping_left || camera_damping_right) {
    camera.lookAt(camera.position.x + Math.sin(angle), y, camera.position.z + Math.cos(angle))
    if (camera_damping_left) {
      camera_damping_left_ /= 0.96
      angle += Math.PI / camera_damping_left_
    }
    if (camera_damping_right) {
      camera_damping_right_ /= 0.96
      angle -= Math.PI / camera_damping_right_
    }
  }
  if (up_) {
    y += 0.01
    camera.position.set(camera_x, y, camera_z)
  }
  if (down_) {
    y -= 0.01
    camera.position.set(camera_x, y, camera_z)
  }
}
// 车摄像头
function CarCameraFuc() {
  camera.position.set(meshes[2].position.x, meshes[2].position.y + 1.1, meshes[2].position.z)
  camera.lookAt(meshes[4].position.x, meshes[4].position.y + 1, meshes[4].position.z)
}
// 渲染
function render() {
  if (freedomCamera) {
    playerinit()
  }
  if (CarCamera) {
    CarCameraFuc()
  }
  TWEEN.update();
  renderer.render(scene, camera)
  requestAnimationFrame(render)
  world.step(1 / 45)
}
// 物理世界
function CANNONWorld() {
  world = new CANNON.World()
  world.gravity.set(0, -0.98, 0)
}
let vehicle_, another_car_left = false, another_car_right = false, another_car_toCenter = false
let another_car_direction = 0
let meshes = [], phyMeshes = []
// 另一辆车
function another_car() {
  phyMeshes = []
  // 车框
  // 物理车框
  const chassisShape = new CANNON.Box(new CANNON.Vec3(1.5, 0.5, 1))
  const chassisBody = new CANNON.Body({
    mass: 2000,
    shape: chassisShape
  })
  chassisBody.position.set(0, 5, 0)
  // 车框材质
  const chassisBodyMesh = new THREE.MeshBasicMaterial({})
  chassisBodyMesh.visible = false
  phyMeshes.push(chassisBody)
  const chassisMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0, 0, 0),
    chassisBodyMesh
  )
  meshes.push(chassisMesh)
  scene.add(chassisMesh)
  // 初始化交通工具
  vehicle_ = new CANNON.RaycastVehicle({
    chassisBody: chassisBody,
  })
  // 车轮配置
  const wheelOptions = {
    // 半径
    radius: 0.2,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 30,
    // 框高
    suspensionRestLength: 0.3,
    // 摩擦
    frictionSlip: 1.4,
    // 阻尼
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    maxSuspensionTravel: 0.2,
    axleLocal: new CANNON.Vec3(0, 0, 0)
  }
  vehicle_.addWheel({
    // 前左
    ...wheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(0.55, 0.15, -0.4)
  })
  vehicle_.addWheel({
    // 后右
    ...wheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(-0.5, 0.15, 0.4)
  })
  vehicle_.addWheel({
    // 后左
    ...wheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(-0.5, 0.15, -0.4)
  })
  vehicle_.addWheel({
    // 前右
    ...wheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(0.55, 0.15, 0.4)
  })
  vehicle_.addToWorld(world)
  // 轮子物理设置
  // 车轮组
  const wheelBodies = []
  const wheelShape = new CANNON.Cylinder(0.2, 0.2, 0.05, 20)
  // 轮子材质设置
  const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20)
  const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
  wheelMaterial.transparent = true
  wheelMaterial.opacity = "0.25"
  for (let i = 0; i < vehicle_.wheelInfos.length; i++) {
    const cylinderBody = new CANNON.Body({
      mass: 1,
      shape: wheelShape,
    })
    phyMeshes.push(cylinderBody)
    wheelBodies.push(cylinderBody)
    const cylinderMesh = new THREE.Mesh(wheelGeometry, wheelMaterial)
    cylinderMesh.rotation.x = -Math.PI / 2
    // 
    const wheelObj = new THREE.Object3D()
    wheelObj.add(cylinderMesh)
    scene.add(wheelObj)
    meshes.push(wheelObj)
  }
  world.addEventListener("postStep", () => {
    for (let i = 0; i < vehicle_.wheelInfos.length; i++) {
      // 更新
      vehicle_.updateWheelTransform(i)
      const t = vehicle_.wheelInfos[i].worldTransform
      const wheelBody = wheelBodies[i]
      wheelBody.position.copy(t.position)
      wheelBody.quaternion.copy(t.quaternion)
    }
  })
  // 
  function _() {
    vehicle_.setSteeringValue(another_car_direction, 0)
    vehicle_.setSteeringValue(another_car_direction, 3)
  }
  // 检测车的位置
  detectCarPosition()
  // 这里放模型要求模型索引是[0]
  function animate() {
    for (let i = 0; i < phyMeshes.length; i++) {
      meshes[i].position.copy(phyMeshes[i].position)
      meshes[i].quaternion.copy(phyMeshes[i].quaternion)
    }
    if (another_car_left) {
      another_car_direction += Math.PI / 360
      if (another_car_direction > Math.PI / 4) {
        another_car_direction = Math.PI / 4
      }
      if (another_car_direction < -Math.PI / 4) {
        another_car_direction = -Math.PI / 4
      }
      _()
    }
    if (another_car_right) {
      another_car_direction -= Math.PI / 360
      if (another_car_direction > Math.PI / 4) {
        another_car_direction = Math.PI / 4
      }
      if (another_car_direction < -Math.PI / 4) {
        another_car_direction = -Math.PI / 4
      }
      _()
    }
    if (another_car_toCenter) {
      if (another_car_direction > -0.01) {
        another_car_direction -= Math.PI / 360
        _()
      }
      if (another_car_direction < 0.01) {
        another_car_direction += Math.PI / 360
        _()
      }
    }
    requestAnimationFrame(animate)
  }
  animate()
}
// 添加引擎牵引力
function applyEngineForce(how_1, which_1, how_2, which_2) {
  vehicle_.applyEngineForce(how_1, which_1)
  vehicle_.applyEngineForce(how_2, which_2)
}
// 另一辆车的控制
let another_car_speed = 200
function another_car_control() {
  document.addEventListener("keydown", (e) => {
    if (e.key === 'ArrowUp') {
      applyEngineForce(another_car_speed, 1, another_car_speed, 2)
    }
    if (e.key === 'ArrowDown') {
      applyEngineForce(-another_car_speed, 1, -another_car_speed, 2)
    }
    // 0 3转向 setSteeringValue
    if (e.key === 'ArrowLeft') {
      another_car_left = true
      another_car_toCenter = false
    }
    if (e.key === 'ArrowRight') {
      another_car_right = true
      another_car_toCenter = false
    }
    if (e.code === 'Space') {
      another_car_speed = 800
    }
  })

  document.addEventListener("keyup", (e) => {
    if (e.key === 'ArrowUp') {
      applyEngineForce(0, 1, 0, 2)
    }
    if (e.key === 'ArrowDown') {
      applyEngineForce(0, 1, 0, 2)
    }
    if (e.key === 'ArrowLeft') {
      another_car_left = false
      another_car_toCenter = true
    }
    if (e.key === 'ArrowRight') {
      another_car_right = false
      another_car_toCenter = true
    }
    if (e.code === 'Space') {
      another_car_speed = new_another_speed
    }
  })
}
// 游戏菜单控制
let i = true
function camera_Fuc() {
  if (i) {
    i = false
    freedomCamera = false
    CarCamera = true
    camera.lookAt(meshes[0].position.x, meshes[0].position.y, meshes[0].position.z)
    $("#gameMenu button").innerHTML = "车摄像头"
    $("#leisile__").style.display = "block"
    $("#leisile_").style.display = "none"
  }
  else {
    i = true
    CarCamera = false
    freedomCamera = true
    $("#gameMenu button").innerHTML = "自由摄像"
    $("#leisile_").style.display = "block"
    $("#leisile__").style.display = "none"
    camera_x = meshes[2].position.x
    camera_z = meshes[2].position.z
  }
}
let new_another_speed = 200
function gameMenuControl() {
  $("#leisile__").style.display = "block"
  camera_Fuc()
  $("#gameMenu button").onclick = function () {
    camera_Fuc()
  }
  $("#_").oninput = () => {
    new_another_speed = $("#_").value
    another_car_speed = new_another_speed
  }
}
let billbill, QQ, Wechant
function detectCarPosition() {
  billbill = CreateIcons("./billbill.png", 5, 5, -1, "billbill")
  QQ = CreateIcons("./QQ.jpg", 5, 5, 0.2, "QQ")
  Wechant = CreateIcons("./Wechant.png", 5, 5, 1.4, "Wechant")
  Playerraycast()
  setInterval(() => {
    if (meshes[0].position.y < -5) {
      for (let i = 0; i < phyMeshes.length; i++) {
        phyMeshes[i].position.set(5, 2, 0)
        phyMeshes[i].quaternion.set(0, 0, 0, 1)
      }
    }
  }, 1000);
}
function CreateIcons(url, x, y, z, name) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const texLoader = new THREE.TextureLoader();
  const texture = texLoader.load(url);
  const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    map: texture,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z)
  mesh.rotation.y -= Math.PI / 2
  scene.add(mesh)
  mesh.name = name
  return mesh
}
function Playerraycast() {
  renderer.domElement.addEventListener('click', function (event) {
    const px = event.offsetX;
    const py = event.offsetY;
    const x = (px / width) * 2 - 1;
    const y = -(py / height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects([billbill, QQ, Wechant]);
    if(intersects[0].object.name === "billbill"){
      alert("billbill:暂不公开");
    }
    if(intersects[0].object.name === "QQ"){
      alert("QQ：1746059825");
    }
    if(intersects[0].object.name === "Wechant"){
      alert("Wechant:kokotaqi");
    }
  })
}