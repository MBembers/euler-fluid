import Vector2 from "./Vector2.js";
import Scene from "./Scene.js";
// canvas setup ----------------------------------------------------

const canvas = document.getElementById("myCanvas");
const avg_vel_label = document.getElementById("avg-vel");
const max_vel_label = document.getElementById("max-vel");
const fps_label = document.getElementById("fps");

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;

let simMinWidth = 2.0;
let scale = Math.min(canvas.width, canvas.height) / simMinWidth;
let simWidth = canvas.width / scale;
let simHeight = canvas.height / scale;
function scaleX(x) {
	return x * scale;
}

function scaleY(y) {
	return y * scale;
}

// scene setup -----------------------------------------------------
let h = 0.02;
const scene = new Scene(simWidth, simHeight, h);
h = scene.fluid.h;
function simulate() {
	scene.fluid.simulate(scene.numIters, scene.overRelaxation, scene.dt);
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let i = 0; i < scene.fluid.sizeY; i++) {
		for (let j = 0; j < scene.fluid.sizeX; j++) {
			let cell = scene.fluid.c[i][j];
			let colors = [0, 0, 0, 0]; // r, g, b, alpha
			colors[0] = Math.abs(cell.v) * 20; // red for v
			colors[2] = Math.abs(cell.u) * 20; // blue for u
			colors[3] = cell.smoke;
			ctx.fillStyle = `rgba(${colors[0]},${colors[1]},${colors[2]},${colors[3]})`;

			if (cell.s === 0) ctx.fillStyle = "coral";
			ctx.fillRect(
				scaleX(j * h),
				scaleY(i * h),
				scale * h + 0.2,
				scale * h + 0.2
			);
		}
	}

	max_vel_label.innerHTML = `Max velocity: ${scene.fluid.currMaxVel.toFixed(
		2
	)}`;
	avg_vel_label.innerHTML = `Avg velocity: ${scene.fluid.avg_vel.toFixed(2)}`;
}

// controls -----------------------------------------------------
let mouseDown = false;
let startDrag = (x, y) => {
	let bounds = canvas.getBoundingClientRect();
	let mx = x - bounds.left - canvas.clientLeft;
	let my = y - bounds.top - canvas.clientTop;
	mouseDown = true;

	x = mx / scale;
	y = (canvas.height - my) / scale;

	// setObstacle(x, y, true);
};
let drag = (x, y) => {
	if (mouseDown) {
		let bounds = canvas.getBoundingClientRect();
		let mx = x - bounds.left - canvas.clientLeft;
		let my = y - bounds.top - canvas.clientTop;
		x = mx / scale;
		y = (canvas.height - my) / scale;
		// setObstacle(x, y, false);
	}
};
let endDrag = () => {
	mouseDown = false;
};
function setupControls() {
	canvas.addEventListener("mousedown", (event) => {
		startDrag(event.x, event.y);
	});

	canvas.addEventListener("mouseup", (event) => {
		endDrag();
	});

	canvas.addEventListener("mousemove", (event) => {
		drag(event.x, event.y);
	});

	canvas.addEventListener("touchstart", (event) => {
		startDrag(event.touches[0].clientX, event.touches[0].clientY);
	});

	canvas.addEventListener("touchend", (event) => {
		endDrag();
	});

	canvas.addEventListener(
		"touchmove",
		(event) => {
			event.preventDefault();
			event.stopImmediatePropagation();
			drag(event.touches[0].clientX, event.touches[0].clientY);
		},
		{ passive: false }
	);
}

let lastTime = 0;
let fps = 0;
let calc_time = 0;
let draw_time = 0;
function update() {
	let delta = (performance.now() - lastTime) / 1000;
	lastTime = performance.now();
	fps = 1 / delta;

	let now = performance.now();
	simulate();
	calc_time = performance.now() - now;

	now = performance.now();
	draw();
	draw_time = performance.now() - now;

	fps_label.innerHTML = `FPS: ${fps.toFixed(
		2
	)} Calc time: ${calc_time.toFixed(2)}ms Draw time: ${draw_time.toFixed(
		2
	)}ms`;
	requestAnimationFrame(update);
}

setupControls();
update();
