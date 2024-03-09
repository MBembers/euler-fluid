import Vector2 from "./Vector2.js";
import Scene from "./Scene.js";
// canvas setup ----------------------------------------------------

const canvas = document.getElementById("myCanvas");
const avg_vel_label = document.getElementById("avg-vel");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 100;

let simMinWidth = 2.0;
let scale = Math.min(canvas.width, canvas.height) / simMinWidth;
let simWidth = canvas.width / scale;
let simHeight = canvas.height / scale;
scale -= 20;
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
			// if (cell.s === 1) ctx.fillStyle = "lightblue";
			// ctx.fillStyle = cell.color;
			ctx.fillStyle = `rgba(0,0,0,${1 - cell.smoke})`;
			if (cell.s === 0) ctx.fillStyle = "coral";
			ctx.fillRect(
				scaleX(j * h),
				scaleY(i * h),
				scale * h + 0.2,
				scale * h + 0.2
			);
		}
	}
}

let mouseDown = false;

function startDrag(x, y) {
	let bounds = canvas.getBoundingClientRect();

	let mx = x - bounds.left - canvas.clientLeft;
	let my = y - bounds.top - canvas.clientTop;
	mouseDown = true;

	x = mx / scale;
	y = (canvas.height - my) / scale;

	// setObstacle(x, y, true);
}

function drag(x, y) {
	if (mouseDown) {
		let bounds = canvas.getBoundingClientRect();
		let mx = x - bounds.left - canvas.clientLeft;
		let my = y - bounds.top - canvas.clientTop;
		x = mx / scale;
		y = (canvas.height - my) / scale;
		// setObstacle(x, y, false);
	}
}

function endDrag() {
	mouseDown = false;
}

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

function update() {
	simulate();
	draw();
	requestAnimationFrame(update);
}

update();
