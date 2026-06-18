import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AsteroidBeltProps {
  innerRadius: number;
  outerRadius: number;
  count: number;
  color: string;
  opacity?: number;
  rotationSpeed?: number;
  thickness?: number;
}

/**
 * Photorealistic asteroid belt — an InstancedMesh of irregular rocks.
 * Every instance has randomized scale, rotation and y-axis offset so the
 * field looks chaotic and natural. Uses a dark, rough PBR material so
 * asteroids read as rock, not glowing dots.
 */
function AsteroidBelt({
  innerRadius,
  outerRadius,
  count,
  color,
  rotationSpeed = 0.0001,
  thickness = 0.5,
}: AsteroidBeltProps) {
  const beltRef = useRef<THREE.InstancedMesh>(null);

  // Irregular rock geometry — low poly with randomized vertices for variation.
  const rockGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 0);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.multiplyScalar(0.7 + Math.random() * 0.6);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Per-instance orbital data, for the slow ring rotation.
  const orbitals = useMemo(() => {
    const arr = new Array(count);
    for (let i = 0; i < count; i++) {
      // Bias toward inner ring (more dense)
      const t = Math.pow(Math.random(), 0.7);
      const r = innerRadius + t * (outerRadius - innerRadius);
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * thickness;
      const scale = 0.15 + Math.random() * 0.55;
      // Keplerian-ish speed: inner orbits faster
      const speed = rotationSpeed * (Math.pow(innerRadius / r, 0.6));
      const rotAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      const rotSpeed = (Math.random() - 0.5) * 0.02;
      arr[i] = { r, angle, y, scale, speed, rotAxis, rotSpeed };
    }
    return arr;
  }, [count, innerRadius, outerRadius, thickness, rotationSpeed]);

  // Initial matrix population — random rotation per asteroid.
  useEffect(() => {
    if (!beltRef.current) return;
    const mesh = beltRef.current;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const o = orbitals[i];
      const x = Math.cos(o.angle) * o.r;
      const z = Math.sin(o.angle) * o.r;
      dummy.position.set(x, o.y, z);
      dummy.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      dummy.scale.setScalar(o.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Slight per-instance color variation — cooler / warmer rock tones.
      const base = new THREE.Color(color);
      const vary = (Math.random() - 0.5) * 0.25;
      base.offsetHSL(0, vary * 0.1, vary * 0.15);
      mesh.setColorAt(i, base);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, color, orbitals]);

  // Frame loop — advance each asteroid along its orbit with its own tumble.
  useFrame(() => {
    if (!beltRef.current) return;
    const mesh = beltRef.current;
    const dummy = new THREE.Object3D();
    const tmpMatrix = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      const o = orbitals[i];
      o.angle += o.speed;

      const x = Math.cos(o.angle) * o.r;
      const z = Math.sin(o.angle) * o.r;

      mesh.getMatrixAt(i, tmpMatrix);
      dummy.position.set(x, o.y, z);
      dummy.scale.setScalar(o.scale);
      // Extract existing rotation, then apply slow tumble around the instance's own axis
      dummy.quaternion.setFromRotationMatrix(tmpMatrix);
      dummy.quaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(o.rotAxis, o.rotSpeed)
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={beltRef}
      args={[rockGeometry, undefined, count]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        color={color}
        roughness={1.0}
        metalness={0.05}
      />
    </instancedMesh>
  );
}

export default AsteroidBelt;
