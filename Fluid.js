// u are vertical velocities
// v are horizontal velocities
export default class Fluid {
	constructor(density, sizeX, sizeY, h, gravity) {
		this.density = density; // we assume that density is constant
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.h = h;
		this.gravity = gravity;
		this.u = new Float32Array(this.sizeX * this.sizeY);
		this.v = new Float32Array(this.sizeX * this.sizeY);
		this.newU = new Float32Array(this.sizeX * this.sizeY);
		this.newV = new Float32Array(this.sizeX * this.sizeY);
		this.p = new Float32Array(this.sizeX * this.sizeY);
		this.s = new Float32Array(this.sizeX * this.sizeY);
		this.smoke = new Float32Array(this.sizeX * this.sizeY);
		this.newSmoke = new Float32Array(this.sizeX * this.sizeY);
		this.currMaxVel = 0;
		this.avg_vel = 0;
		this.initV = 2;
		this.smoke.fill(0);
	}

	integrate(dt) {
		for (let i = 1; i < this.sizeY - 1; i++) {
			for (let j = 1; j < this.sizeX - 1; j++) {
				if (
					this.s[i * this.sizeX + j] != 0.0 &&
					this.s[(i + 1) * this.sizeX + j] != 0.0
				)
					this.u[i * this.sizeX + j] += this.gravity * dt;
			}
		}
	}

	extrapolate() {
		for (let i = 0; i < this.sizeY; i++) {
			this.v[i * this.sizeX + 0] = this.v[i * this.sizeX + 1];
			this.v[i * this.sizeX + this.sizeX - 1] =
				this.v[i * this.sizeX + this.sizeX - 2];
		}
		for (let j = 0; j < this.sizeX; j++) {
			this.u[0 * this.sizeX + j] = this.u[1 * this.sizeX + j];
			this.u[(this.sizeY - 1) * this.sizeX + j] =
				this.u[(this.sizeY - 2) * this.sizeX + j];
		}
	}

	projection(numIters, overRelaxation, dt) {
		// console.log(this.smoke[(20) * this.sizeX + 20]);
		let cp = (this.density * this.h) / dt;
		this.p.fill(0);

		for (let iter = 0; iter < numIters; iter++) {
			for (let i = 1; i < this.sizeY - 1; i++) {
				for (let j = 1; j < this.sizeX - 1; j++) {
					if (this.s[i * this.sizeX + j] === 0) continue;

					let divergence =
						this.u[(i + 1) * this.sizeX + j] -
						this.u[i * this.sizeX + j] +
						this.v[i * this.sizeX + j + 1] -
						this.v[i * this.sizeX + j];

					let s_sum =
						this.s[(i - 1) * this.sizeX + j] +
						this.s[(i + 1) * this.sizeX + j] +
						this.s[i * this.sizeX + j - 1] +
						this.s[i * this.sizeX + j + 1];

					let p = divergence / s_sum;

					p *= overRelaxation;
					this.p[i * this.sizeX + j] += p * -cp;

					if (s_sum === 0) continue;
					this.u[i * this.sizeX + j] +=
						this.s[(i - 1) * this.sizeX + j] * p;

					this.v[i * this.sizeX + j] +=
						p * this.s[i * this.sizeX + j - 1];

					this.u[(i + 1) * this.sizeX + j] -=
						p * this.s[(i + 1) * this.sizeX + j];

					this.v[i * this.sizeX + j + 1] -=
						p * this.s[i * this.sizeX + j + 1];
				}
			}
		}
	}

	velocityAdvection(dt) {
		this.currMaxVel = 0;
		let velSum = 0;
		this.newU.set(this.u);
		this.newV.set(this.v);
		this.newSmoke.set(this.smoke);
		let _h = 1 / this.h;
		let _h2 = this.h * 0.5;

		for (let i = 1; i < this.sizeY - 1; i++) {
			for (let j = 1; j < this.sizeX - 1; j++) {
				if (this.s[i * this.sizeX + j] === 0) continue;

				let x, y;
				// u component advection
				if (
					this.s[(i - 1) * this.sizeX + j] != 0 &&
					j < this.sizeX - 1
				) {
					let u = this.u[i * this.sizeX + j];
					let v_avg =
						(this.v[i * this.sizeX + j] +
							this.v[i * this.sizeX + j + 1] +
							this.v[(i - 1) * this.sizeX + j] +
							this.v[(i - 1) * this.sizeX + j + 1]) /
						4;

					x = j * this.h + this.h / 2 - v_avg * dt;
					y = i * this.h - u * dt;
					// calculate advection of velocities with this backtracking or something bruh
					this.newU[i * this.sizeX + j] = this.sampleField(
						x,
						y,
						"u",
						_h,
						_h2
					);
				}

				// v component advection
				if (
					this.s[i * this.sizeX + j - 1] != 0.0 &&
					i < this.sizeY - 1
				) {
					let v = this.v[i * this.sizeX + j];
					let u_avg =
						(this.u[i * this.sizeX + j] +
							this.u[i * this.sizeX + j - 1] +
							this.u[(i + 1) * this.sizeX + j - 1] +
							this.u[(i + 1) * this.sizeX + j]) /
						4;

					x = j * this.h - v * dt;
					y = i * this.h + this.h / 2 - u_avg * dt;
					this.newV[i * this.sizeX + j] = this.sampleField(
						x,
						y,
						"v",
						_h,
						_h2
					);
				}

				// smoke advection
				if (j < this.sizeX - 1 && i < this.sizeY - 1) {
					let u =
						(this.u[i * this.sizeX + j] +
							this.u[(i + 1) * this.sizeX + j]) *
						0.5;
					let v =
						(this.v[i * this.sizeX + j] +
							this.v[i * this.sizeX + j + 1]) *
						0.5;
					x = j * this.h + this.h / 2 - dt * v;
					y = i * this.h + this.h / 2 - dt * u;
					this.newSmoke[i * this.sizeX + j] = this.sampleField(
						x,
						y,
						"smoke",
						_h,
						_h2
					);
				}
				let vel = this.calcVelocity(i, j);
				velSum += vel;
				if (vel > this.currMaxVel) this.currMaxVel = vel;
				if (!velSum) {
					console.log("error");
					let a;
				}
			}
		}
		this.avg_vel = velSum / ((this.sizeX - 1) * (this.sizeY - 1));
		this.u.set(this.newU);
		this.v.set(this.newV);
		this.smoke.set(this.newSmoke);
	}

	// smokeAdvection(dt) {}

	sampleField(x, y, field, _h, _h2) {
		x = Math.max(Math.min(x, this.sizeX * this.h), this.h);
		y = Math.max(Math.min(y, this.sizeY * this.h), this.h);
		let dx = 0; // correction (0 or h/2)
		let dy = 0;
		let f;
		if (field === "v") {
			dy = _h2;
			f = this.v;
		}
		if (field === "u") {
			dx = _h2;
			f = this.u;
		}
		if (field === "smoke") {
			dx = _h2;
			dy = _h2;
			f = this.smoke;
		}
		let x0 = Math.min(Math.floor((x - dx) * _h), this.sizeX - 1);
		let y0 = Math.min(Math.floor((y - dy) * _h), this.sizeY - 1);
		let x1 = Math.min(x0 + 1, this.sizeX - 1);
		let y1 = Math.min(y0 + 1, this.sizeY - 1);

		let w_x1 = (x - dx - x0 * this.h) * _h;
		let w_x0 = 1 - w_x1;
		let w_y1 = (y - dy - y0 * this.h) * _h;
		let w_y0 = 1 - w_y1;

		let sample_weighted =
			w_y0 * w_x0 * f[y0 * this.sizeX + x0] +
			w_y0 * w_x1 * f[y0 * this.sizeX + x1] +
			w_y1 * w_x0 * f[y1 * this.sizeX + x0] +
			w_y1 * w_x1 * f[y1 * this.sizeX + x1];

		return sample_weighted;
	}

	simulate(numIters, overRelaxation, dt) {
		// this.integrate(dt);
		this.projection(numIters, overRelaxation, dt);
		// this.extrapolate();
		this.velocityAdvection(dt);
	}

	setupCells() {
		console.log("sizes:", this.sizeX, this.sizeY, this.sizeX * this.sizeY);
		this.u.fill(0);
		this.v.fill(0);
		this.s.fill(1);
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				if (i === 0) {
					this.s[i * this.sizeX + j] = 0;
				}
				if (i === this.sizeY - 1) {
					this.s[i * this.sizeX + j] = 0;
				}
				if (j === 0) {
					this.s[i * this.sizeX + j] = 0;
				}
				if (j === this.sizeX - 1) {
					this.s[i * this.sizeX + j] = 1;
				}

				// place Smokers
				this.placeRectSmoker(0, 1, 0.2, 0.35);

				// velocities;
				if (j === 1) {
					this.v[i * this.sizeX + j] = this.initV;
				}
			}
		}
	}

	calcVelocity(x, y) {
		if (x < 0 || y < 0 || x >= this.sizeX || y >= this.sizeY) return 0;
		return Math.sqrt(
			this.u[y * this.sizeX + x] ** 2 + this.v[y * this.sizeX + x] ** 2
		);
	}

	placeRectObstacle(x, y, w, h) {
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				if (
					j * this.h > x &&
					j * this.h < x + w &&
					i * this.h > y &&
					i * this.h < y + h
				) {
					this.s[i * this.sizeX + j] = 0;
				}
			}
		}
	}

	placeRoundObstacle(x, y, r) {
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				let dx = j * this.h - x;
				let dy = i * this.h - y;
				if (dx * dx + dy * dy < r * r) {
					this.s[i * this.sizeX + j] = 0;
				}
			}
		}
	}

	placeRectSmoker(x, y, w, h) {
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				if (
					j * this.h >= x - w / 2 &&
					j * this.h <= x + w / 2 &&
					i * this.h >= y - h / 2 &&
					i * this.h <= y + h / 2
				) {
					this.smoke[i * this.sizeX + j] = 1;
				}
			}
		}
	}
}
