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
	let sus = 0;
	for (let i = 0; i < scene.fluid.sizeY; i++) {
		for (let j = 0; j < scene.fluid.sizeX; j++) {
			sus++;
			let cell = scene.fluid.c[i][j];
			// if (cell.s === 1) ctx.fillStyle = "lightblue";
			ctx.fillStyle = `rgba(${(cell.u + cell.v) * 20}, 100, 100, 1)`;
			if (cell.s === 0) ctx.fillStyle = "black";
			ctx.fillRect(
				scaleX(j * h),
				scaleY(i * h),
				scale * h + 1,
				scale * h + 1
			);
		}
	}
}

function update() {
	simulate();
	draw();
	requestAnimationFrame(update);
}

update();
