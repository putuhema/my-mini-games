<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import * as THREE from 'three';
	import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
	import { sfx } from '../sound.svelte.ts';

	let {
		value = 1,
		rollKey = 0,
		rolling = false,
		size = 160
	}: {
		/** Face to show (1–6). */
		value?: number;
		/** Changes on every new roll; a change triggers the tumble onto `value`. */
		rollKey?: number;
		/** Spin freely while waiting for the server to pick a number. */
		rolling?: boolean;
		/** Canvas size in CSS pixels. */
		size?: number;
	} = $props();

	const TAU = Math.PI * 2;
	const LAND_MS = 1100;

	// Like a real dice, the result is the face pointing UP (+Y).
	// Euler order is YXZ: z then x tip the chosen face up, then y spins it around the
	// vertical axis, which never changes which face is on top.
	const FACE_UP: Record<number, { x: number; z: number }> = {
		1: { x: -Math.PI / 2, z: 0 }, // +Z face
		2: { x: 0, z: Math.PI / 2 }, // +X face
		3: { x: 0, z: 0 }, // +Y face
		4: { x: Math.PI, z: 0 }, // -Y face
		5: { x: 0, z: -Math.PI / 2 }, // -X face
		6: { x: Math.PI / 2, z: 0 } // -Z face
	};
	// Resting spin so two side faces show, like a dice sitting on a table.
	const RESTING_YAW = Math.PI / 5;

	// Pip cells on a 3×3 grid, per face value.
	const PIPS: Record<number, number[]> = {
		1: [5],
		2: [1, 9],
		3: [1, 5, 9],
		4: [1, 3, 7, 9],
		5: [1, 3, 5, 7, 9],
		6: [1, 3, 4, 6, 7, 9]
	};

	// Face normal plus the two in-plane axes used to lay out pips.
	const FACE_AXES: Record<number, { n: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3 }> = {
		1: { n: new THREE.Vector3(0, 0, 1), u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 1, 0) },
		6: { n: new THREE.Vector3(0, 0, -1), u: new THREE.Vector3(-1, 0, 0), v: new THREE.Vector3(0, 1, 0) },
		2: { n: new THREE.Vector3(1, 0, 0), u: new THREE.Vector3(0, 0, -1), v: new THREE.Vector3(0, 1, 0) },
		5: { n: new THREE.Vector3(-1, 0, 0), u: new THREE.Vector3(0, 0, 1), v: new THREE.Vector3(0, 1, 0) },
		3: { n: new THREE.Vector3(0, 1, 0), u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, -1) },
		4: { n: new THREE.Vector3(0, -1, 0), u: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 0, 1) }
	};

	let canvas: HTMLCanvasElement;

	// Mutable animation state, read by the render loop.
	const rot = { x: 0, y: 0, z: 0 };
	const spin = { x: 0, y: 0, z: 0 };
	let landing: {
		start: number;
		from: typeof rot;
		to: typeof rot;
	} | null = null;
	let isRolling = false;
	let appliedKey = untrack(() => rollKey);
	let wake = () => {};

	{
		const up = untrack(() => FACE_UP[value] ?? FACE_UP[1]);
		rot.x = up.x;
		rot.y = RESTING_YAW;
		rot.z = up.z;
	}

	function startLanding(face: number) {
		const up = FACE_UP[face] ?? FACE_UP[1];
		// Always tumble forward at least two full turns per axis.
		const ahead = (current: number, target: number, turns: number) =>
			target + TAU * Math.ceil((current - target) / TAU + turns);
		sfx.dice();
		landing = {
			start: performance.now(),
			from: { ...rot },
			to: { x: ahead(rot.x, up.x, 2), y: ahead(rot.y, RESTING_YAW, 1), z: ahead(rot.z, up.z, 1) }
		};
		wake();
	}

	let applySize = () => {};

	$effect(() => {
		const r = rolling;
		const key = rollKey;
		const face = value;
		untrack(() => {
			if (r) {
				if (!isRolling) {
					landing = null;
					spin.x = 9 + Math.random() * 4;
					spin.y = 11 + Math.random() * 4;
					spin.z = 5 + Math.random() * 3;
				}
				isRolling = true;
				wake();
				return;
			}
			// Land on the new result — or back on the current face if the roll failed.
			if (key !== appliedKey || isRolling) {
				appliedKey = key;
				isRolling = false;
				startLanding(face);
			}
		});
	});

	$effect(() => {
		void size;
		applySize();
	});

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		renderer.shadowMap.enabled = true;
		renderer.outputColorSpace = THREE.SRGBColorSpace;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
		// Look down from above so the top face (the result) reads clearly.
		camera.position.set(0, 3.5, 2.5);
		camera.lookAt(0, 0.05, 0);

		scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 1.6));
		const key = new THREE.DirectionalLight(0xffffff, 2.2);
		key.position.set(2.5, 5, 3.5);
		key.castShadow = true;
		key.shadow.mapSize.set(512, 512);
		key.shadow.radius = 6;
		Object.assign(key.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 });
		scene.add(key);

		const floor = new THREE.Mesh(
			new THREE.PlaneGeometry(8, 8),
			new THREE.ShadowMaterial({ opacity: 0.14 })
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.y = -0.62;
		floor.receiveShadow = true;
		scene.add(floor);

		const dice = new THREE.Group();
		dice.rotation.order = 'YXZ';
		scene.add(dice);

		const bodyGeometry = new RoundedBoxGeometry(1.2, 1.2, 1.2, 5, 0.17);
		const bodyMaterial = new THREE.MeshPhysicalMaterial({
			color: 0xffffff,
			roughness: 0.35,
			clearcoat: 0.6,
			clearcoatRoughness: 0.25
		});
		const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.castShadow = true;
		dice.add(body);

		const pipGeometry = new THREE.SphereGeometry(1, 20, 12);
		const pipMaterial = new THREE.MeshStandardMaterial({ color: 0x4b4b4b, roughness: 0.5 });
		const acePipMaterial = new THREE.MeshStandardMaterial({ color: 0xff4b4b, roughness: 0.45 });
		for (const [face, cells] of Object.entries(PIPS)) {
			const { n, u, v } = FACE_AXES[Number(face)];
			const ace = face === '1';
			for (const cell of cells) {
				const col = ((cell - 1) % 3) - 1;
				const row = 1 - Math.floor((cell - 1) / 3);
				const pip = new THREE.Mesh(pipGeometry, ace ? acePipMaterial : pipMaterial);
				const r = ace ? 0.17 : 0.105;
				pip.scale.set(r, r, r);
				pip.position
					.copy(n)
					.multiplyScalar(0.6 - r * 0.45)
					.addScaledVector(u, col * 0.31)
					.addScaledVector(v, row * 0.31);
				dice.add(pip);
			}
		}

		let raf = 0;
		let last = performance.now();

		const frame = (now: number) => {
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			let active = false;
			let hop = 0;

			if (landing) {
				const t = Math.min(1, (now - landing.start) / LAND_MS);
				const ease = 1 - (1 - t) ** 3;
				rot.x = landing.from.x + (landing.to.x - landing.from.x) * ease;
				rot.y = landing.from.y + (landing.to.y - landing.from.y) * ease;
				rot.z = landing.from.z + (landing.to.z - landing.from.z) * ease;
				// Two decaying bounces as it lands.
				hop = Math.abs(Math.sin(t * Math.PI * 2.2)) * (1 - t) ** 1.6 * 0.9;
				if (t === 1) landing = null;
				else active = true;
			} else if (isRolling) {
				rot.x += spin.x * dt;
				rot.y += spin.y * dt;
				rot.z += spin.z * dt;
				hop = 0.35 + Math.sin(now / 90) * 0.08;
				active = true;
			}

			dice.rotation.set(rot.x, rot.y, rot.z);
			dice.position.y = hop;
			renderer.render(scene, camera);
			raf = active ? requestAnimationFrame(frame) : 0;
		};

		wake = () => {
			if (raf) return;
			last = performance.now();
			raf = requestAnimationFrame(frame);
		};

		applySize = () => {
			renderer.setSize(size, size, false);
			wake();
		};
		applySize();

		return () => {
			cancelAnimationFrame(raf);
			wake = () => {};
			applySize = () => {};
			bodyGeometry.dispose();
			bodyMaterial.dispose();
			pipGeometry.dispose();
			pipMaterial.dispose();
			acePipMaterial.dispose();
			floor.geometry.dispose();
			(floor.material as THREE.Material).dispose();
			renderer.dispose();
		};
	});
</script>

<div role="img" aria-label={rolling ? 'Rolling the dice' : `Dice showing ${value}`}>
	<canvas bind:this={canvas} style="width: {size}px; height: {size}px"></canvas>
</div>

<style>
	canvas {
		display: block;
	}
</style>
