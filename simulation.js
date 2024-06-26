import Scene from "./Scene.js";
// document setup ----------------------------------------------------
const canvas = document.getElementById("myCanvas");
const avg_vel_label = document.getElementById("avg-vel");
const max_vel_label = document.getElementById("max-vel");
const fps_label = document.getElementById("fps");
const stream_btn = document.getElementById("stream-btn");
const smoke_btn = document.getElementById("smoke-btn");
const pressure_label = document.getElementById("pressure");
const pressure_btn = document.getElementById("pressure-btn");

// canvas setup ----------------------------------------------------

let temp_width = (window.innerWidth * 3) / 4;
let temp_height = window.innerHeight - 200;

let simHeight = 2;
let h = 0.02;
let scale = temp_height / simHeight;
let simWidth = temp_width / scale;

let sc = Math.floor(scale * h);
scale = sc / h;
temp_height = scale * simHeight;
temp_width = scale * simWidth;
canvas.width = temp_width + 2 * sc;
canvas.height = temp_height + 2 * sc;

console.log("canvas size", canvas.width, canvas.height);
console.log("simulation size", simWidth, simHeight);
console.log("canv/sim", canvas.width / simWidth, canvas.height / simHeight);
const ctx = canvas.getContext("2d", { alpha: false });

// scene setup -----------------------------------------------------
const scene = new Scene(simWidth, simHeight, h);
// scene.fluid.placeRectObstacle(1, 1, 0.2, 0.2);\
scene.fluid.placeRoundObstacle(1.2, 1, 0.28);

function simulate() {
	scene.fluid.simulate(scene.numIters, scene.overRelaxation, scene.dt);
}

function draw() {
	// ctx.clearRect(0, 0, canvas.width, canvas.height);
	let image = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let minP = 1000000000;
	let maxP = 0;
	for (let l = 0; l < scene.sizeX * scene.sizeY; l++) {
		minP = Math.min(minP, scene.fluid.p[l]);
		maxP = Math.max(maxP, scene.fluid.p[l]);
	}

	for (let i = 0; i < scene.fluid.sizeY; i++) {
		for (let j = 0; j < scene.fluid.sizeX; j++) {
			let p = scene.fluid.p[i * scene.fluid.sizeX + j];
			let u = scene.fluid.u[i * scene.fluid.sizeX + j];
			let v = scene.fluid.v[i * scene.fluid.sizeX + j];
			let smoke = scene.fluid.smoke[i * scene.fluid.sizeX + j];
			let s = scene.fluid.s[i * scene.fluid.sizeX + j];
			let colors = [255, 255, 255]; // r, g, b

			if (scene.showPressure) colors = colorGradient(p, minP, maxP);
			if (s == 0) {
				colors[1] = 200;
				colors[2] = 200;
				colors[0] = 200;
			} else if (scene.showSmoke) {
				colors[0] -= smoke * 255;
				colors[1] -= smoke * 255;
				colors[2] -= smoke * 255;
			}

			let x = j * sc; // in pixels
			let y = i * sc; // in pixels
			// process every pixel in a square at position (x,y), square size is h (meters) irl, h * scale on screen (pixels)
			for (let yp = y; yp < y + sc; yp++) {
				let index = (x + yp * canvas.width) * 4;
				for (let xp = x; xp < x + sc; xp++) {
					image.data[index++] = colors[0];
					image.data[index++] = colors[1];
					image.data[index++] = colors[2];
					image.data[index++] = 255;
				}
			}
		}
	}

	ctx.putImageData(image, 0, 0);
	// stream lines
	if (scene.showStreamlines) {
		ctx.strokeStyle = "#000000";
		for (let i = 1; i < scene.sizeY; i += 5)
			for (let j = 1; j < scene.sizeX; j += 5) {
				let x = j * h;
				let y = i * h;
				ctx.beginPath();
				ctx.moveTo(x * scale, y * scale);

				for (let k = 0; k < scene.streamSegments; k++) {
					let u = scene.fluid.sampleField(x, y, "u", 1 / h, h / 2);
					let v = scene.fluid.sampleField(x, y, "v", 1 / h, h / 2);
					x = x + v * 0.01;
					y = y + u * 0.01;
					if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) break;
					ctx.lineTo(x * scale, y * scale);
				}
				ctx.stroke();
			}
	}

	if (scene.recording) {
		scene.recordFrame(ctx.getImageData(0, 0, canvas.width, canvas.height));
	}

	max_vel_label.innerHTML = `Max velocity: ${scene.fluid.currMaxVel.toFixed(2)} `;
	avg_vel_label.innerHTML = `Avg velocity: ${scene.fluid.avg_vel.toFixed(2)} `;

	pressure_label.innerHTML = `Max pressure: ${maxP.toFixed(2)}  Min pressure: ${minP.toFixed(2)} `;
}

function colorGradient(val, minVal, maxVal) {
	val = Math.max(Math.min(val, maxVal), minVal);
	let d = maxVal - minVal + 0.00001;
	let k = ((val - minVal) * 5) / d; // k -> [0, 1]
	let type = Math.floor(k);
	let r, g, b; // r,g,b are [0,1]
	k = k - type;
	switch (type) {
		case 0:
			r = 1 - k;
			g = 0;
			b = 1;
			break;
		case 1:
			r = 0;
			g = k;
			b = 1;
			break;
		case 2:
			r = 0;
			g = 1;
			b = 1 - k;
			break;
		case 3:
			r = k;
			g = 1;
			b = 0;
			break;
		case 4:
			r = 1;
			g = 1 - k;
			b = 0;
			break;
	}
	return [r * 255, g * 255, b * 255];
}

// controls -----------------------------------------------------
let mouseDown = false;
let startDrag = (x, y) => {
	let bounds = canvas.getBoundingClientRect();
	let mx = x - bounds.left - canvas.clientLeft;
	let my = y - bounds.top - canvas.clientTop;
	mouseDown = true;

	x = mx / scale;
	y = my / scale;
	let j = Math.floor(x / h);
	let i = Math.floor(y / h);
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
let setupControls = () => {
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

	document.addEventListener("keydown", (event) => {
		switch (event.key) {
			case "p":
				scene.paused = !scene.paused;
				break;
			case "m":
				scene.paused = false;
				simulate();
				scene.paused = true;
				break;
		}
	});

	stream_btn.addEventListener("click", (e) => {
		scene.showStreamlines = e.target.checked;
	});

	smoke_btn.addEventListener("click", (e) => {
		scene.showSmoke = e.target.checked;
	});

	pressure_btn.addEventListener("click", (e) => {
		scene.showPressure = e.target.checked;
	});
};

let lastTime = 0;
let fps = 0;
let calc_time = 0;
let draw_time = 0;
function update() {
	let delta = (performance.now() - lastTime) / 1000;
	lastTime = performance.now();
	fps = 1 / delta;

	let now = performance.now();
	if (!scene.paused) simulate();
	calc_time = performance.now() - now;

	now = performance.now();
	draw();
	draw_time = performance.now() - now;

	fps_label.innerHTML = `FPS: ${fps.toFixed(2)} Calc time: ${calc_time.toFixed(2)}ms Draw time: ${draw_time.toFixed(2)}ms`;
	requestAnimationFrame(update);
}

setupControls();
update();
