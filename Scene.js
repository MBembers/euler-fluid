import Fluid from "./Fluid.js";

export default class Scene {
	constructor(real_width, real_height, h) {
		this.real_width = real_width;
		this.real_height = real_height;
		this.h = h;
		this.gravity = 9.81;
		this.density = 1000;
		this.dt = 1.0 / 60.0;
		this.numIters = 40;
		this.frameNr = 0;
		this.overRelaxation = 1.9; // 1.9
		this.obstacleX = 0.0;
		this.obstacleY = 0.0;
		this.obstacleRadius = 0.15;
		this.paused = false;
		this.sceneNr = 0;
		this.showObstacle = false;
		this.showStreamlines = false;
		this.showVelocities = false;
		this.showPressure = false;
		this.showSmoke = true;
		this.sizeX = Math.floor(this.real_width / h);
		this.sizeY = Math.floor(this.real_height / h);

		this.h = real_height / this.sizeY;
		this.sizeX += 2;
		this.sizeY += 2;

		this.fluid = new Fluid(
			this.density,
			this.sizeX,
			this.sizeY,
			this.h,
			this.gravity
		);
	}
}
