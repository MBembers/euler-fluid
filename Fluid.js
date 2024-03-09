import Cell from "./Cell.js";

// u are vertical velocities
// v are horizontal velocities
export default class Fluid {
	constructor(density, sizeX, sizeY, h) {
		this.ro = density; // we assume that density is constant
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.h = h;
		this.c = new Array(sizeY);
		this.setupCells();
	}

	extrapolate() {
		for (let i = 0; i < this.sizeY; i++) {
			this.c[i][0].u = this.c[i][1].u;
			this.c[i][this.sizeX - 1].u = this.c[i][this.sizeX - 2].u;
		}

		for (let j = 0; j < this.sizeX; j++) {
			this.c[0][j].v = this.c[1][j].v;
			this.c[this.sizeY - 1][j].v = this.c[this.sizeY - 2][j].v;
		}
	}

	calcDivergence(x, y, overRelaxation) {
		let divergence = 0;
		divergence += overRelaxation * (this.c[y + 1][x].u - this.c[y][x].u);
		divergence += overRelaxation * (this.c[y][x + 1].v - this.c[y][x].v);
		return divergence;
	}

	projection(numIters, overRelaxation) {
		// console.log(this.c[20][20].smoke);
		let divergence = 0;
		for (let iter = 0; iter < numIters; iter++) {
			for (let i = 1; i < this.sizeY - 1; i++) {
				for (let j = 1; j < this.sizeX - 1; j++) {
					if (this.c[i][j].s === 0) continue;
					divergence = this.calcDivergence(j, i, overRelaxation);
					let s_sum =
						this.c[i - 1][j].s +
						this.c[i + 1][j].s +
						this.c[i][j - 1].s +
						this.c[i][j + 1].s;
					if (s_sum === 0) continue;

					this.c[i][j].u =
						this.c[i][j].u +
						(divergence * this.c[i - 1][j].s) / s_sum;

					this.c[i][j].v =
						this.c[i][j].v +
						(divergence * this.c[i][j - 1].s) / s_sum;

					this.c[i + 1][j].u =
						this.c[i + 1][j].u -
						(divergence * this.c[i + 1][j].s) / s_sum;

					this.c[i][j + 1].v =
						this.c[i][j + 1].v -
						(divergence * this.c[i][j + 1].s) / s_sum;
				}
			}
		}
	}

	velocityAdvection(dt) {
		let newCells = this.copyCells();

		for (let i = 1; i < this.sizeY; i++) {
			for (let j = 1; j < this.sizeX; j++) {
				if (this.c[i][j].s === 0) continue;

				let x, y;
				// u component advection
				if (this.c[i - 1][j].s != 0 && j < this.sizeX - 1) {
					let u = this.c[i][j].u;
					let v_avg =
						(this.c[i][j].v +
							this.c[i][j + 1].v +
							this.c[i - 1][j].v +
							this.c[i - 1][j + 1].v) /
						4;

					x = j * this.h + this.h / 2 - v_avg * dt;
					y = i * this.h - u * dt;
					// calculate advection of velocities with this backtracking or something bruh
					newCells[i][j].u = this.sampleField(x, y, "u");
				}

				// v component advection
				if (this.c[i][j - 1].s != 0.0 && i < this.sizeX - 1) {
					let v = this.c[i][j].v;
					let u_avg =
						(this.c[i][j].u +
							this.c[i][j - 1].u +
							this.c[i + 1][j - 1].u +
							this.c[i + 1][j].u) /
						4;

					x = j * this.h - v * dt;
					y = i * this.h + this.h / 2 - u_avg * dt;
					newCells[i][j].v = this.sampleField(x, y, "v");
				}

				if (
					this.c[i][j - 1] === 0.0 ||
					i >= this.sizeX - 1 ||
					(this.c[i - 1][j].s === 0 && j >= this.sizeX - 1)
				)
					return;
				// smoke advection
				let u = (this.c[i][j].u + this.c[i + 1][j].u) * 0.5;
				let v = (this.c[i][j].v + this.c[i][j + 1].v) * 0.5;
				x = j * this.h + this.h / 2 - dt * v;
				y = i * this.h + this.h / 2 - dt * u;

				newCells[i][j].smoke = this.sampleField(x, y, "smoke");
			}
		}

		this.c = newCells;
	}

	// smokeAdvection(dt) {}

	sampleField(x, y, field) {
		x = Math.max(Math.min(x, this.sizeX * this.h), this.h);
		y = Math.max(Math.min(y, this.sizeY * this.h), this.h);
		let _h = 1 / this.h;
		let i = Math.floor(y * _h);
		let j = Math.floor(x * _h);

		let _h2 = this.h / 2;
		let i0 = i;
		let i1 = i + 1;
		let j0 = j;
		let j1 = j + 1;
		let dx = x - j * this.h;
		let dy = y - i * this.h;
		if (field === "u") {
			if (dy < _h2) {
				dy += _h2;
				i0 = i - 1;
				i1 = i;
			} else dy -= _h2;

			let wy0 = 1 - dy * _h;
			let wy1 = dy * _h;
			let wx0 = 1 - dx * _h;
			let wx1 = dx * _h;

			let u_weighted =
				wy0 * wx0 * this.c[i0][j0].u +
				wy0 * wx1 * this.c[i0][j1].u +
				wy1 * wx0 * this.c[i1][j0].u +
				wy1 * wx1 * this.c[i1][j1].u;

			return u_weighted;
		}
		if (field === "v") {
			let dy = y - i * this.h;
			let dx = x - j * this.h;
			if (dx < _h2) {
				dx += _h2;
				j0 = j - 1;
				j1 = j;
			} else dx -= _h2;

			let wx0 = 1 - dx * _h;
			let wx1 = dx * _h;
			let wy0 = 1 - dy * _h;
			let wy1 = dy * _h;

			if (this.c[i1] === undefined) console.log(i0, i1, j0, j1);
			let v_weighted =
				wy0 * wx0 * this.c[i0][j0].v +
				wy0 * wx1 * this.c[i0][j1].v +
				wy1 * wx0 * this.c[i1][j0].v +
				wy1 * wx1 * this.c[i1][j1].v;

			return v_weighted;
		}
		if (field === "smoke") {
			let dy = y - i * this.h;
			let dx = x - j * this.h;
			if (dx < _h2) {
				dx += _h2;
				j0 = j - 1;
				j1 = j;
			} else dx -= _h2;
			if (dy < _h2) {
				dy += _h2;
				i0 = i - 1;
				i1 = i;
			} else dy -= _h2;

			let wx0 = 1 - dx * _h;
			let wx1 = dx * _h;
			let wy0 = 1 - dy * _h;
			let wy1 = dy * _h;
			if (this.c[i0] === undefined) console.log(i0, i1, j0, j1);
			let smoke_weighted =
				wy0 * wx0 * this.c[i0][j0].smoke +
				wy0 * wx1 * this.c[i0][j1].smoke +
				wy1 * wx0 * this.c[i1][j0].smoke +
				wy1 * wx1 * this.c[i1][j1].smoke;
			// if (i === 10) console.log(smoke_weighted);
			return smoke_weighted;
		}
	}

	simulate(numIters, overRelaxation, dt) {
		this.projection(numIters, overRelaxation);

		this.extrapolate();
		this.velocityAdvection(dt);
		// this.smokeAdvection(dt);
	}

	setupCells() {
		console.log("sizes:", this.sizeX, this.sizeY);
		const smoke = 1;
		const allLiquid = true;
		for (let i = 0; i < this.sizeY; i++) {
			this.c[i] = new Array(this.sizeX);
		}
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				if (i === 0) {
					this.c[i][j] = new Cell(0, 0, 0, 1, smoke);
				} else if (i === this.sizeY - 1) {
					this.c[i][j] = new Cell(0, 0, 0, 1, smoke);
				} else if (j === 0) {
					this.c[i][j] = new Cell(0, 0, 0, 1, smoke);
				} else if (j === this.sizeX - 1) {
					this.c[i][j] = new Cell(0, 0, 0, 1, smoke); // WHY REMOVING RIGHT WALL DISABLES SMOKE???
					// liquid, not walls
				} else this.c[i][j] = new Cell(0, 0, 1, 1, smoke);

				// if (allLiquid) this.c[i][j].s = 1;
				// place some obstacles
				if (j < 1 && i > 35 && i < 50) {
					this.c[i][j].s = 0;
					this.c[i][j].smoke = 0.0;
				}
				if (
					(j > 40 && j < 60 && i > 35 && i < 50) ||
					(j > 50 && j < 60 && i > 35 && i < 60)
				) {
					this.c[i][j].s = 0;
					// this.c[i][j].smoke = 0.0;
				}

				// velocities
				if (j === 1) {
					this.c[i][j].v = 4;
				}
			}
		}
	}

	copyCells() {
		let copy = new Array(this.sizeY);
		for (let i = 0; i < this.sizeY; i++) {
			copy[i] = new Array(this.sizeX);
		}
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				copy[i][j] = new Cell(
					this.c[i][j].u,
					this.c[i][j].v,
					this.c[i][j].s,
					this.c[i][j].p,
					this.c[i][j].smoke,
					this.c[i][j].color
				);
			}
		}
		return copy;
	}
}
