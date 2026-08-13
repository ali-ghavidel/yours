import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    vColor = color;
    vAlpha = aAlpha * (0.82 + 0.18 * sin(uTime * 1.4 + position.x * 8.0));
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (260.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 2.35);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

function GalaxyParticles({ count = 5500 }) {
  const points = useRef()
  const material = useRef()

  const geometry = useMemo(() => {
    const random = seededRandom(9427)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const inside = new THREE.Color('#a9c8ff')
    const middle = new THREE.Color('#b565c8')
    const outside = new THREE.Color('#315fbe')

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = Math.pow(random(), 0.63) * 8.4
      const branch = i % 4
      const branchAngle = branch / 4 * Math.PI * 2
      const spin = radius * 1.03
      const spread = 0.24 + radius * 0.075
      const scatter = (random() - 0.5) * spread * 2.2
      const angle = branchAngle + spin + scatter
      const radialNoise = (random() - 0.5) * (0.25 + radius * 0.1)
      const r = radius + radialNoise

      positions[i3] = Math.cos(angle) * r
      positions[i3 + 1] = (random() - 0.5) * (0.18 + radius * 0.065) * (0.35 + random())
      positions[i3 + 2] = Math.sin(angle) * r

      const color = radius < 1.5
        ? inside.clone().lerp(middle, radius / 1.5)
        : middle.clone().lerp(outside, (radius - 1.5) / 6.9)
      color.offsetHSL((random() - 0.5) * 0.055, (random() - 0.5) * 0.12, (random() - 0.5) * 0.2)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
      sizes[i] = radius < 1.1 ? 2.5 + random() * 3.5 : 1.2 + random() * 2.8
      alphas[i] = 0.12 + random() * 0.4
    }

    const buffer = new THREE.BufferGeometry()
    buffer.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    buffer.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    buffer.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    buffer.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    return buffer
  }, [count])

  useFrame((state, delta) => {
    points.current.rotation.y += delta * 0.018
    material.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <points ref={points} geometry={geometry} rotation={[0.08, 0, -0.05]}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function DustLanes({ count = 500 }) {
  const points = useRef()
  const data = useMemo(() => {
    const random = seededRandom(421)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = ['#32185f', '#3f2c98', '#264b9a', '#752d87']

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = 1.1 + Math.pow(random(), 0.72) * 8.2
      const branch = i % 4
      const angle = branch / 4 * Math.PI * 2 + radius * 1.03 + (random() - 0.5) * (0.65 + radius * 0.08)
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = (random() - 0.5) * (0.45 + radius * 0.06)
      positions[i3 + 2] = Math.sin(angle) * radius
      const c = new THREE.Color(palette[Math.floor(random() * palette.length)])
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b
    }
    return { positions, colors }
  }, [count])

  useFrame((_, delta) => { points.current.rotation.y += delta * 0.012 })

  return (
    <points ref={points} rotation={[0.08, 0, -0.05]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.13} vertexColors transparent opacity={0.11} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Universe({ count = 700 }) {
  const points = useRef()
  const geometry = useMemo(() => {
    const random = seededRandom(7331)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = 14 + random() * 32
      const theta = random() * Math.PI * 2
      const phi = Math.acos(2 * random() - 1)
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.cos(phi)
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
      const c = new THREE.Color(random() > .82 ? '#8fb7ff' : random() > .88 ? '#ffd6e9' : '#ffffff')
      colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [count])

  useFrame((_, delta) => { points.current.rotation.y -= delta * 0.003 })
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.64} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function CoreGlow() {
  const group = useRef()
  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.85) * 0.045
    group.current.scale.setScalar(pulse)
  })
  return (
    <group ref={group} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial color="#557ac9" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <ringGeometry args={[0.55, 1.55, 64]} />
        <meshBasicMaterial color="#a554bb" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function SpiralClouds({ count = 650 }) {
  const points = useRef()
  const geometry = useMemo(() => {
    const random = seededRandom(8123)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const alphas = new Float32Array(count)
    const blue = new THREE.Color('#416bc9')
    const violet = new THREE.Color('#7950b4')
    const pink = new THREE.Color('#b55b9c')

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const arm = i % 3
      const radius = 2.1 + Math.pow(random(), .78) * 7.1
      const angle = arm * Math.PI * 2 / 3 + radius * .83 + (random() - .5) * (.42 + radius * .055)
      const width = (random() - .5) * (.45 + radius * .075)
      const r = radius + width
      positions[i3] = Math.cos(angle) * r
      positions[i3 + 1] = (random() - .5) * (.13 + radius * .025)
      positions[i3 + 2] = Math.sin(angle) * r
      const color = radius < 4.2 ? pink.clone().lerp(violet, radius / 4.2) : violet.clone().lerp(blue, (radius - 4.2) / 5)
      colors[i3] = color.r; colors[i3 + 1] = color.g; colors[i3 + 2] = color.b
      sizes[i] = 5 + random() * 9
      alphas[i] = .012 + random() * .025
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
    return geo
  }, [count])

  useFrame((state, delta) => {
    points.current.rotation.y += delta * .009
    points.current.material.uniforms.uTime.value = state.clock.elapsedTime
  })
  return (
    <points ref={points} geometry={geometry} rotation={[.08, 0, -.05]}>
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={{ uTime: { value: 0 } }} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#010106']} />
      <Universe />
      <DustLanes />
      <SpiralClouds />
      <GalaxyParticles />
      <CoreGlow />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.045}
        minDistance={11}
        maxDistance={32}
        autoRotate
        autoRotateSpeed={0.12}
        target={[0, 0, 0]}
      />
    </>
  )
}

const JOURNEY_STAGES = [
  'فضای میان‌کهکشانی', 'هالهٔ راه شیری', 'کهکشان راه شیری', 'بازوی شکارچی',
  'حباب محلی', 'ابر میان‌ستاره‌ای محلی', 'منظومهٔ شمسی', 'خورشید',
  'هلیوسفر', 'ابر اورت', 'کمربند کویپر', 'نپتون', 'اورانوس', 'زحل',
  'مشتری', 'کمربند سیارک‌ها', 'مریخ', 'زمین و ماه', 'مگنتوسفر زمین',
  'اگزوسفر', 'ترموسفر', 'مزوسفر', 'استراتوسفر', 'تروپوسفر و ابرها', 'سطح زمین',
]

const BODY_DATA = {
  7: { texture: assetPath('textures/sun.jpg'), size: 2.65, sun: true },
  11: { texture: assetPath('textures/neptune.jpg'), size: 2.05 },
  12: { texture: assetPath('textures/uranus.jpg'), size: 2.1, tilt: 1.7 },
  13: { texture: assetPath('textures/saturn.jpg'), size: 1.75, ring: true },
  14: { texture: assetPath('textures/jupiter.jpg'), size: 2.55 },
  16: { texture: assetPath('textures/mars.jpg'), size: 1.85 },
}

const SOLAR_BODIES = [
  { id: 'mercury', label: 'عطارد', texture: assetPath('textures/mercury.jpg'), size: 1.7 },
  { id: 'venus', label: 'زهره', texture: assetPath('textures/venus.jpg'), size: 1.95 },
  { id: 'earth', label: 'زمین و ماه', texture: assetPath('textures/earth.jpg'), size: 2.1, earth: true },
  { id: 'mars', label: 'مریخ', texture: assetPath('textures/mars.jpg'), size: 1.85 },
  { id: 'jupiter', label: 'مشتری', texture: assetPath('textures/jupiter.jpg'), size: 2.55 },
  { id: 'saturn', label: 'زحل', texture: assetPath('textures/saturn.jpg'), size: 1.75, ring: true },
  { id: 'uranus', label: 'اورانوس', texture: assetPath('textures/uranus.jpg'), size: 2.1, tilt: 1.7 },
  { id: 'neptune', label: 'نپتون', texture: assetPath('textures/neptune.jpg'), size: 2.05 },
]

const SUN_BODY = { id: 'sun', label: 'خورشید', texture: assetPath('textures/sun.jpg'), size: 2.65, sun: true }

const LOVE_QUOTES = [
  { text: 'Doubt thou the stars are fire; but never doubt I love.', author: 'William Shakespeare' },
  { text: 'Whatever our souls are made of, his and mine are the same.', author: 'Emily Brontë' },
  { text: 'How do I love thee? Let me count the ways.', author: 'Elizabeth Barrett Browning' },
  { text: 'I love thee to the depth and breadth and height my soul can reach.', author: 'Elizabeth Barrett Browning' },
  { text: 'Love is fire.', author: 'Elizabeth Barrett Browning' },
  { text: 'I shall but love thee better after death.', author: 'Elizabeth Barrett Browning' },
]

function SunBloom({ scale = 1 }) {
  const group = useRef()
  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * .018
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.35) * .022
    group.current.scale.setScalar(scale * pulse)
  })
  return (
    <group ref={group} scale={scale}>
      <mesh scale={1.06}><sphereGeometry args={[1, 48, 48]} /><meshBasicMaterial color="#ff7a16" transparent opacity={.13} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh scale={1.13}><sphereGeometry args={[1, 48, 48]} /><meshBasicMaterial color="#ff9d2f" transparent opacity={.075} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh scale={1.24}><sphereGeometry args={[1, 40, 40]} /><meshBasicMaterial color="#ffc766" transparent opacity={.035} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <pointLight intensity={18} distance={scale * 11} decay={1.45} color="#ffb34d" />
    </group>
  )
}

function JourneyCamera({ step, focus }) {
  const { camera } = useThree()
  const settling = useRef(2)
  useEffect(() => { settling.current = 1.7 }, [step, focus])
  useFrame((_, delta) => {
    if (settling.current <= 0) return
    settling.current -= delta
    const target = step < 6
      ? new THREE.Vector3(7.5 - step * .7, 5.5 - step * .35, 15 - step * 1.25)
      : focus
        ? new THREE.Vector3(0, .65, focus === 'saturn' ? 8.4 : 6.8)
      : step < 17
        ? new THREE.Vector3(0, 1.15 + Math.sin(step) * .28, step === 6 ? 15 : 7.4)
        : step < 24
          ? new THREE.Vector3(0, 1.1, 8.6 - (step - 17) * .82)
          : new THREE.Vector3(0, 1.25, 3.8)
    camera.position.lerp(target, 1 - Math.exp(-delta * 1.45))
    camera.lookAt(0, step === 18 ? .3 : 0, 0)
  })
  return null
}

function SolarOverview({ onSelect }) {
  const group = useRef()
  const sunMap = useTexture(assetPath('textures/sun.jpg'))
  const maps = useTexture([
    assetPath('textures/mercury.jpg'), assetPath('textures/venus.jpg'), assetPath('textures/earth.jpg'), assetPath('textures/mars.jpg'),
    assetPath('textures/jupiter.jpg'), assetPath('textures/saturn.jpg'), assetPath('textures/uranus.jpg'), assetPath('textures/neptune.jpg'),
  ])
  const planets = [
    [-3.4, .13, SOLAR_BODIES[0]], [-2.8, .19, SOLAR_BODIES[1]], [-2.05, .2, SOLAR_BODIES[2]], [-1.35, .16, SOLAR_BODIES[3]],
    [.25, .52, SOLAR_BODIES[4]], [1.65, .44, SOLAR_BODIES[5]], [2.7, .3, SOLAR_BODIES[6]], [3.55, .29, SOLAR_BODIES[7]],
  ]
  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * .04 })
  return (
    <group ref={group} rotation={[.16, 0, 0]}>
      <pointLight color="#fff2cf" intensity={30} distance={20} decay={1.5} />
      <group onClick={(event) => { event.stopPropagation(); onSelect('sun') }}>
        <mesh><sphereGeometry args={[.72, 40, 40]} /><meshBasicMaterial map={sunMap} color="#fff2cf" /></mesh>
        <mesh scale={1.12}><sphereGeometry args={[.72, 32, 32]} /><meshBasicMaterial color="#ff9b37" transparent opacity={.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
        <SunBloom scale={.78} />
      </group>
      {planets.map(([x, size, planet], index) => (
        <group key={x}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[Math.abs(x), Math.abs(x) + .006, 96]} /><meshBasicMaterial color="#596176" transparent opacity={.2} side={THREE.DoubleSide} /></mesh>
          <group position={[x, 0, (index % 2 ? .25 : -.2)]} onClick={(event) => { event.stopPropagation(); onSelect(planet.id) }}>
            <mesh><sphereGeometry args={[size, 24, 24]} /><meshStandardMaterial map={maps[index]} roughness={.82} /></mesh>
            <mesh><sphereGeometry args={[Math.max(size * 2.4, .28), 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

function TexturedBody({ data }) {
  const body = useRef()
  const arrival = useRef()
  const texture = useTexture(data.texture)
  const ringTexture = useTexture(assetPath('textures/saturn-ring.png'))
  useFrame((_, delta) => {
    if (body.current) body.current.rotation.y += delta * (data.sun ? .018 : .07)
    if (arrival.current) {
      const scale = THREE.MathUtils.damp(arrival.current.scale.x, 1, 1.7, delta)
      arrival.current.scale.setScalar(scale)
    }
  })
  return (
    <group ref={arrival} scale={.08} rotation={[0, 0, data.tilt || 0]}>
      {!data.sun && <><ambientLight intensity={.18} /><directionalLight position={[-4, 3, 6]} intensity={4.4} color="#fff4df" /></>}
      <mesh ref={body}>
        <sphereGeometry args={[data.size, 64, 64]} />
        {data.sun
          ? <meshBasicMaterial map={texture} color="#fff0c2" />
          : <meshStandardMaterial map={texture} roughness={.88} metalness={0} />}
      </mesh>
      {data.sun && <mesh scale={1.055}><sphereGeometry args={[data.size, 48, 48]} /><meshBasicMaterial color="#ff8a25" transparent opacity={.13} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>}
      {data.sun && <mesh scale={1.13}><sphereGeometry args={[data.size, 48, 48]} /><meshBasicMaterial color="#ffbc55" transparent opacity={.055} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>}
      {data.sun && <pointLight intensity={42} distance={30} decay={1.3} color="#fff0c8" />}
      {data.sun && <SunBloom scale={data.size * 1.06} />}
      {data.ring && <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[2.15, 3.65, 128]} /><meshBasicMaterial map={ringTexture} transparent opacity={.92} side={THREE.DoubleSide} depthWrite={false} /></mesh>}
    </group>
  )
}

function RegionVisual({ step }) {
  const points = useRef()
  const isShell = step === 9
  const count = isShell ? 1100 : 760
  const positions = useMemo(() => {
    const random = seededRandom(1800 + step)
    const data = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      if (isShell) {
        const radius = 3.1 + random() * 1.5
        const theta = random() * Math.PI * 2
        const phi = Math.acos(2 * random() - 1)
        data[i3] = radius * Math.sin(phi) * Math.cos(theta)
        data[i3 + 1] = radius * Math.cos(phi)
        data[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
      } else {
        const radius = (step === 10 ? 2.6 : 2.15) + (random() - .5) * (step === 10 ? 1.2 : .65)
        const angle = random() * Math.PI * 2
        data[i3] = Math.cos(angle) * radius
        data[i3 + 1] = (random() - .5) * (step === 10 ? .7 : .28)
        data[i3 + 2] = Math.sin(angle) * radius
      }
    }
    return data
  }, [count, isShell, step])
  useFrame((_, delta) => { if (points.current) points.current.rotation.y += delta * .035 })
  if (![8, 9, 10, 15].includes(step)) return null
  if (step === 8) return (
    <group>
      <mesh><sphereGeometry args={[3.25, 48, 48]} /><meshBasicMaterial color="#3f79ad" transparent opacity={.045} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
      <mesh><sphereGeometry args={[.35, 32, 32]} /><meshBasicMaterial color="#ffd67a" /></mesh>
      <pointLight intensity={12} color="#ffdbaa" distance={9} />
    </group>
  )
  return (
    <points ref={points} rotation={[.18, 0, 0]}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={step === 15 ? .035 : .025} color={step === 9 ? '#b8c3d1' : '#8e7c69'} transparent opacity={.72} depthWrite={false} />
    </points>
  )
}

function Earth({ step }) {
  const earthGroup = useRef()
  const earth = useRef()
  const clouds = useRef()
  const moonOrbit = useRef()
  const [earthMap, nightMap, cloudMap, moonMap] = useTexture(['earth.jpg', 'earth-night.jpg', 'earth-clouds.jpg', 'moon.jpg'].map((name) => assetPath(`textures/${name}`)))
  const targetLongitude = step <= 17 ? 230.688 : 230.688
  const targetLatitude = step <= 17 ? 5.428 : 0.428
  const targetQuaternion = useMemo(() => {
    const lat = THREE.MathUtils.degToRad(targetLatitude)
    const lon = THREE.MathUtils.degToRad(targetLongitude)
    const location = new THREE.Vector3(-Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).normalize()
    return new THREE.Quaternion().setFromUnitVectors(location, new THREE.Vector3(0, 0, 1))
  }, [targetLatitude, targetLongitude])
  useFrame((state, delta) => {
    if (earthGroup.current) earthGroup.current.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 1.35))
    if (clouds.current) clouds.current.rotation.y += delta * .073
    if (moonOrbit.current) moonOrbit.current.rotation.y = state.clock.elapsedTime * .22
  })
  if (step < 17 || step >= 24) return null
  return (
    <group>
      <ambientLight intensity={.15} />
      <directionalLight position={[-6, 2, -5]} intensity={1.2} color="#b7c9ff" />
      <group ref={earthGroup}>
        <mesh ref={earth}><sphereGeometry args={[2.1, 64, 64]} /><meshStandardMaterial map={nightMap} emissiveMap={nightMap} emissive="#d7b275" emissiveIntensity={.75} roughness={.9} /></mesh>
        <mesh ref={clouds} scale={1.012}><sphereGeometry args={[2.1, 64, 64]} /><meshStandardMaterial map={cloudMap} transparent opacity={.22} depthWrite={false} /></mesh>
      </group>
      <mesh scale={1.045}><sphereGeometry args={[2.1, 64, 64]} /><meshBasicMaterial color="#59baff" transparent opacity={.09 + (step - 17) * .018} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
      <group ref={moonOrbit}><mesh position={[3.25, .55, .1]} rotation={[0, -.55, .08]}><sphereGeometry args={[.48, 64, 64]} /><meshStandardMaterial map={moonMap} bumpMap={moonMap} bumpScale={.028} roughness={1} metalness={0} /></mesh></group>
    </group>
  )
}

const SCORPIO_STARS = [
  [-5.25, 4.35], [-4.7, 4.72], [-5.18, 3.58], [-4.55, 2.92], [-3.55, 2.58],
  [-2.45, 2.58], [-1.72, 4.12], [-1.35, 5.18], [-.48, 6.02], [.55, 6.72],
  [1.72, 7.18], [2.72, 7.28], [4.22, 7.95], [4.18, 7.28], [3.88, 6.38],
]

const STAR_MEMORIES = [
  assetPath('memories/memory-1.jpg'), assetPath('memories/memory-2.jpg'), assetPath('memories/memory-3.jpg'),
  assetPath('memories/memory-4.jpg'), assetPath('memories/memory-5.jpg'), assetPath('memories/memory-6.jpg'),
  assetPath('memories/memory-7.png'), assetPath('memories/memory-8.jpg'), assetPath('memories/memory-9.jpg'),
]

function ScorpioSky({ revealed, onReveal }) {
  const line = useRef()
  const reveal = useRef(0)
  const starPoints = useMemo(() => SCORPIO_STARS.map(([x, y]) => new THREE.Vector3(x * 1.55, y * 1.55 - 2.4, -48)), [])
  const lineGeometry = useMemo(() => {
    const positions = []
    const links = [[0,1],[0,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[11,13],[11,14]]
    links.forEach(([a,b]) => positions.push(...starPoints[a].toArray(), ...starPoints[b].toArray()))
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [starPoints])
  useFrame((_, delta) => {
    reveal.current = THREE.MathUtils.damp(reveal.current, revealed ? 1 : 0, 1.3, delta)
    const lineCount = lineGeometry.attributes.position.count
    lineGeometry.setDrawRange(0, Math.max(1, Math.floor(lineCount * reveal.current)))
    if (line.current) line.current.material.opacity = reveal.current * .58
  })
  return (
    <group visible>
      <lineSegments ref={line} geometry={lineGeometry}><lineBasicMaterial color="#36caff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} /></lineSegments>
      {starPoints.map((position, index) => (
        <group key={index} position={position} onClick={(event) => { event.stopPropagation(); onReveal(index) }}>
          <mesh><sphereGeometry args={[index === 9 ? .3 : .2 + (index % 3) * .025, 18, 18]} /><meshBasicMaterial color={index % 5 === 0 ? '#fff3d8' : '#f5f8ff'} /></mesh>
          <mesh scale={2.4}><sphereGeometry args={[index === 9 ? .3 : .2 + (index % 3) * .025, 12, 12]} /><meshBasicMaterial color={index % 4 === 0 ? '#b8ccff' : '#dce8ff'} transparent opacity={.055} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
          <mesh scale={4}><sphereGeometry args={[.34, 8, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
        </group>
      ))}
    </group>
  )
}

function ValleyFog() {
  const group = useRef()
  const banks = useMemo(() => {
    const random = seededRandom(6319)
    return Array.from({ length: 18 }, () => ({
      x: (random() - .5) * 25, y: -.1 + random() * 1.25, z: -5 - random() * 20,
      sx: 2.8 + random() * 5.5, sy: .22 + random() * .48, speed: .025 + random() * .035,
    }))
  }, [])
  useFrame((state) => {
    if (!group.current) return
    group.current.children.forEach((cloud, index) => {
      const bank = banks[index]
      cloud.position.x = bank.x + Math.sin(state.clock.elapsedTime * bank.speed + index) * 1.4
      cloud.material.opacity = .018 + (Math.sin(state.clock.elapsedTime * .16 + index * .7) + 1) * .012
    })
  })
  return <group ref={group}>{banks.map((bank, index) => (
    <mesh key={index} position={[bank.x, bank.y, bank.z]} scale={[bank.sx, bank.sy, 1.5]}>
      <sphereGeometry args={[1, 24, 10]} />
      <meshBasicMaterial color="#bac8d4" transparent opacity={.025} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  ))}</group>
}

function MountainTerrain({ z, height, width, color, seed }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, 8, 72, 18)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      const ridge = Math.max(0, 1 - Math.abs(x) / (width * .55))
      const noise = Math.sin(x * .7 + seed) * .42 + Math.sin(x * 1.73 + seed * 2) * .18
      const base = -2.9 + ridge * height + noise * ridge
      pos.setY(i, y < 0 ? -3 : THREE.MathUtils.lerp(-3, base, Math.min(1, (y + 4) / 8)))
      pos.setZ(i, Math.sin(x * .34 + y * .8 + seed) * .22)
    }
    geo.computeVertexNormals()
    return geo
  }, [height, seed, width])
  return <mesh geometry={geometry} position={[0, 2.2, z]}><meshStandardMaterial color={color} roughness={1} flatShading /></mesh>
}

function ValleyVillage() {
  const houses = useMemo(() => {
    const random = seededRandom(7712)
    return Array.from({ length: 42 }, () => ({ x: (random() - .5) * 19, y: -.12 + random() * 1.4, z: -5 - random() * 12, s: .12 + random() * .16 }))
  }, [])
  return houses.map((house, index) => <group key={index} position={[house.x, house.y, house.z]} scale={house.s}>
    <mesh><boxGeometry args={[1.3,.75,1]} /><meshStandardMaterial color="#1b1b19" roughness={1} /></mesh>
    <mesh position={[0,.48,0]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[.95,.55,4]} /><meshStandardMaterial color="#301b16" /></mesh>
    <pointLight position={[0,.15,.7]} intensity={.7} distance={2.4} color="#ffc46b" />
    <mesh position={[0,.1,.51]}><planeGeometry args={[.45,.25]} /><meshBasicMaterial color="#ffca73" /></mesh>
  </group>)
}

function EarthSurface({ lookAtSky, scorpioRevealed, onStarClick }) {
  const { camera } = useThree()
  const moonMap = useTexture(assetPath('textures/moon.jpg'))
  const cameraTransition = useRef(2)
  useEffect(() => { cameraTransition.current = 2 }, [lookAtSky])
  useFrame((_, delta) => {
    if (cameraTransition.current <= 0) return
    cameraTransition.current -= delta
    const targetPosition = new THREE.Vector3(0, 1, 5.2)
    camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 1.25))
    const target = new THREE.Vector3(0, 7.8, -18)
    camera.lookAt(target)
  })
  return (
    <group>
      <color attach="background" args={['#010713']} />
      <fog attach="fog" args={['#020611', 30, 85]} />
      <Universe count={1500} />
      <ScorpioSky revealed={scorpioRevealed} onReveal={onStarClick} />
      <group position={[-5.7,12.2,-80]} onClick={(event) => { event.stopPropagation(); onStarClick('moon') }}>
        <mesh rotation={[0,-.08,.02]}><sphereGeometry args={[1.55,96,96]} /><meshBasicMaterial map={moonMap} color="#f1f1ed" toneMapped={false} /></mesh>
        <mesh scale={2.3}><sphereGeometry args={[1.35,16,16]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      </group>
    </group>
  )
}

function JourneyScene({ step, focusedBody, onSelectBody, lookAtSky, scorpioRevealed, onStarClick }) {
  const selected = focusedBody === 'sun' ? SUN_BODY : SOLAR_BODIES.find((body) => body.id === focusedBody)
  return (
    <>
      <color attach="background" args={['#000006']} />
      {step < 18 && <Universe count={520} />}
      {step < 6 && <group scale={step < 3 ? 1 : 1.6 + step * .2}><GalaxyParticles count={3200} /><SpiralClouds count={360} /><CoreGlow /></group>}
      {step === 6 && !selected && <SolarOverview onSelect={onSelectBody} />}
      {step === 6 && selected && (selected.earth ? <Earth step={17} /> : <TexturedBody key={selected.id} data={selected} />)}
      {BODY_DATA[step] && <TexturedBody key={step} data={BODY_DATA[step]} />}
      <RegionVisual step={step} />
      <Earth step={step} />
      {step === 24 && <EarthSurface lookAtSky={lookAtSky} scorpioRevealed={scorpioRevealed} onStarClick={onStarClick} />}
      {step !== 24 && <JourneyCamera step={step} focus={focusedBody} />}
      {step !== 24 && <OrbitControls enablePan={false} enableDamping dampingFactor={.055} minDistance={3.8} maxDistance={28} target={[0, 0, 0]} />}
      {step === 24 && <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={.075} rotateSpeed={.34} minPolarAngle={.18} maxPolarAngle={Math.PI / 2.02} minAzimuthAngle={-.9} maxAzimuthAngle={.9} target={[0, .85, -8]} />}
    </>
  )
}

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [phase, setPhase] = useState('eye')
  const [journeyStep, setJourneyStep] = useState(0)
  const [introFlight, setIntroFlight] = useState(false)
  const [focusedBody, setFocusedBody] = useState(null)
  const [landing, setLanding] = useState(false)
  const [lookAtSky, setLookAtSky] = useState(false)
  const [scorpioRevealed, setScorpioRevealed] = useState(false)
  const [selectedStar, setSelectedStar] = useState(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (phase !== 'warp') return undefined
    const timer = window.setTimeout(() => setPhase('galaxy'), 3000)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (!landing) return undefined
    const steps = [18, 19, 20, 21, 22, 23, 24]
    const timers = steps.map((step, index) => window.setTimeout(() => setJourneyStep(step), (index + 1) * 850))
    return () => timers.forEach(window.clearTimeout)
  }, [landing])

  useEffect(() => {
    if (journeyStep !== 24) return undefined
    const timer = window.setTimeout(() => setLookAtSky(true), 2000)
    return () => window.clearTimeout(timer)
  }, [journeyStep])

  const nextQuote = () => {
    if (journeyStep < 5) setJourneyStep((value) => value + 1)
    else { setJourneyStep(6); setIntroFlight(false) }
  }

  const handleSkyStar = (index) => {
    if (index === 'moon') {
      if (!scorpioRevealed) setScorpioRevealed(true)
      else setSelectedStar('moon-memory')
      return
    }
    if (index < STAR_MEMORIES.length) setSelectedStar(index)
  }

  const unlockExperience = (event) => {
    event.preventDefault()
    if (password === 'Azar') {
      setUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
      setPassword('')
    }
  }

  const toggleMusic = async () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      await audioRef.current.play()
      setMusicPlaying(true)
    } else {
      audioRef.current.pause()
      setMusicPlaying(false)
    }
  }

  const stopMusic = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    setMusicPlaying(false)
  }

  const enterGalaxy = () => {
    if (phase === 'eye') setPhase('warp')
  }

  return (
    <main className={`experience phase-${phase}`}>
      {!unlocked && (
        <section className="password-gate">
          <form onSubmit={unlockExperience}>
            <span className="gate-star">✦</span>
            <label htmlFor="story-password" dir="rtl">رمز ورود به این دنیا</label>
            <input id="story-password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(false) }} autoComplete="off" autoFocus spellCheck="false" aria-invalid={passwordError} />
            <button type="submit">ورود</button>
            {passwordError && <p dir="rtl">رمز درست نیست</p>}
          </form>
        </section>
      )}
      {unlocked && <>
      {(phase === 'eye' || phase === 'warp') && (
        <section className="eye-intro" aria-label="ورود به کهکشان">
          <img className="eye-image" src={assetPath('eye-honey-v2.png')} alt="چشم قهوه‌ای عسلی" />
          <div className="eye-shade" />
          <div className="eye-copy" dir="rtl">
            <p>سیاهی چشمان تو آغاز دنیاهایی دیگر است</p>
          </div>
          <button className="eye-trigger" type="button" onClick={enterGalaxy} aria-label="ورود به چشم و آغاز سفر به کهکشان">
            <span />
          </button>
          {phase === 'warp' && (
            <div className="space-voyage" aria-hidden="true">
              <div className="space-dust" />
              <div className="star-field">
              {Array.from({ length: 54 }, (_, index) => (
                <i className="flight-star" key={index} style={{ '--angle': `${index * 137.508}deg`, '--delay': `${0.62 + (index % 12) * 0.052}s`, '--size': `${1 + (index % 4) * 0.55}px`, '--travel': `${28 + (index % 9) * 8}vmax` }} />
              ))}
              </div>
              <div className="helmet-vignette" />
            </div>
          )}
        </section>
      )}
      {phase === 'galaxy' && (
        <section className="galaxy-app">
          <Canvas
            camera={{ position: [10.5, 10.2, 17.2], fov: 52, near: 0.1, far: 100 }}
            dpr={1}
            gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
            fallback={<div className="webgl-error">مرورگر نتوانست کهکشان سه‌بعدی را اجرا کند.</div>}
          >
            <Scene />
          </Canvas>
          <div className="vignette" />
          <div className="galaxy-hint">برای گردش در کهکشان، بکشید و اسکرول کنید</div>
          <button className="begin-earth-journey" type="button" onClick={() => { setJourneyStep(0); setFocusedBody(null); setIntroFlight(true); setPhase('journey') }}>ادامهٔ سفر تا زمین</button>
        </section>
      )}
      {phase === 'journey' && (
        <section className={`journey-stage${introFlight ? ' is-intro-flight' : ''}`}>
          <Canvas camera={{ position: [7.5, 5.5, 15], fov: 52, near: .05, far: 120 }} dpr={1} gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}>
            <JourneyScene step={journeyStep} focusedBody={focusedBody} onSelectBody={setFocusedBody} lookAtSky={lookAtSky} scorpioRevealed={scorpioRevealed} onStarClick={handleSkyStar} />
          </Canvas>
          <div className="journey-vignette" />
          {journeyStep < 6 && <button className="journey-caption love-quote quote-button" type="button" dir="ltr" key={journeyStep} onClick={nextQuote}>
            <strong>“{LOVE_QUOTES[journeyStep].text}”</strong>
            <small>— {LOVE_QUOTES[journeyStep].author}</small>
            <em>Click to continue</em>
          </button>}
          {journeyStep < 6 && <div className="journey-progress"><span style={{ width: `${(journeyStep + 1) / 6 * 100}%` }} /></div>}
          {journeyStep === 6 && !focusedBody && <div className="planet-tip" dir="rtl">برای نزدیک‌شدن، روی خورشید یا هر سیاره کلیک کن</div>}
          {journeyStep === 6 && focusedBody && <button className="solar-back" type="button" onClick={() => setFocusedBody(null)}>بازگشت به منظومه شمسی</button>}
          {journeyStep === 6 && focusedBody === 'earth' && !landing && <button className="journey-next land-button" type="button" onClick={() => { setFocusedBody(null); setJourneyStep(17); setLanding(true) }}>فرود روی زمین</button>}
          {journeyStep === 24 && lookAtSky && !scorpioRevealed && <div className="sky-tip" dir="rtl">روی ماه کلیک کن</div>}
          {journeyStep === 24 && scorpioRevealed && (
            <div className="music-player" dir="rtl">
              <audio ref={audioRef} src={assetPath('audio/chashme-bi-baraabar.mp3')} preload="metadata" onEnded={() => setMusicPlaying(false)} />
              <button type="button" onClick={toggleMusic}>{musicPlaying ? 'مکث' : 'پخش'}</button>
              <button type="button" onClick={stopMusic}>توقف</button>
              <span>چشم بی‌برابر</span>
            </div>
          )}
          {selectedStar !== null && (
            <div className="memory-modal" role="dialog" aria-modal="true" aria-label="خاطره ستاره" onClick={() => setSelectedStar(null)}>
              <button className="memory-close" type="button" aria-label="بستن تصویر" onClick={() => setSelectedStar(null)}>×</button>
              <figure onClick={(event) => event.stopPropagation()}>
                <img src={selectedStar === 'moon-memory' ? assetPath('memories/moon-memory.jpg') : STAR_MEMORIES[selectedStar]} alt={selectedStar === 'moon-memory' ? 'خاطره ماه' : `خاطره ستاره ${selectedStar + 1}`} />
                <figcaption dir="rtl">{selectedStar === 'moon-memory' ? 'خاطره ماه' : `ستاره ${selectedStar + 1}`}</figcaption>
              </figure>
            </div>
          )}
        </section>
      )}
      </>}
    </main>
  )
}
