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

	calcDivergence(x, y, overRelaxation) {
		let divergence = 0;

		divergence += overRelaxation * (this.c[y + 1][x].u - this.c[y][x].u);
		divergence += overRelaxation * (this.c[y][x + 1].v - this.c[y][x].v);
		return divergence;
	}

	projection(numIters, overRelaxation) {
		let divergence = 0;
		for (let iter = 0; iter < numIters; iter++) {
			for (let i = 1; i < this.sizeY - 1; i++) {
				for (let j = 1; j < this.sizeX - 1; j++) {
					divergence = this.calcDivergence(j, i, overRelaxation);
					let s_sum = 0;
					s_sum +=
						this.c[i - 1][j].s +
						this.c[i + 1][j].s +
						this.c[i][j - 1].s +
						this.c[i][j + 1].s;

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

	advection(dt) {
		for (let i = 1; i < this.sizeY - 1; i++) {
			for (let j = 1; j < this.sizeX - 1; j++) {
				let u = this.c[i][j].u;
				let v_avg =
					(this.c[i][j].v +
						this.c[i][j + 1].v +
						this.c[i - 1][j].v +
						this.c[i - 1][j + 1].v) /
					4;

				let past_x = j * this.h - v_avg * dt;
				let past_y = i * this.h - u * dt;
				// calculate advection of velocities with this backtracking or something bruh
			}
		}
	}

	simulate(numIters, overRelaxation, dt) {
		this.projection(numIters, overRelaxation);
		this.advection(dt);
	}

	setupCells() {
		for (let i = 0; i < this.sizeY; i++) {
			this.c[i] = new Array(this.sizeX);
		}
		for (let i = 0; i < this.sizeY; i++) {
			for (let j = 0; j < this.sizeX; j++) {
				if (i === 0) {
					this.c[i][j] = new Cell(0, 0, 0, j, i);
				} else if (i === this.sizeY - 1) {
					this.c[i][j] = new Cell(0, 0, 0, j, i);
				} else if (j === 0) {
					this.c[i][j] = new Cell(0, 0, 0, j, i);
				} else if (j === this.sizeX - 1) {
					this.c[i][j] = new Cell(0, 0, 0, j, i);
				} else this.c[i][j] = new Cell(0, 0, 1, j, i);
				if (i > 35 && i < 60 && j > 0 && j < 40) {
					this.c[i][j].u = 30;
					this.c[i][j].v = 30;
				}
			}
		}
	}
}
