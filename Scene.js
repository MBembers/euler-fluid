import Fluid from "./Fluid.js";

export default class Scene {
	constructor(simWidth, simHeight, h) {
		this.simWidth = simWidth;
		this.simHeight = simHeight;
		this.h = h;
		this.gravity = 9.81;
		this.density = 1000;
		this.dt = 1.0 / 60.0;
		this.numIters = 50;
		this.frameNr = 0;
		this.overRelaxation = 1.9; // 1.9
		this.paused = false;
		this.sceneNr = 0;
		this.showObstacle = false;
		this.showStreamlines = false;
		this.showVelocities = false;
		this.showPressure = false;
		this.showSmoke = true;
		this.streamSegments = 10;
		this.sizeX = Math.floor(this.simWidth / h);
		this.sizeY = Math.floor(this.simHeight / h);

		// this.h = simHeight / this.sizeY;
		this.sizeX += 2;
		this.sizeY += 2;

		this.fluid = new Fluid(
			this.density,
			this.sizeX,
			this.sizeY,
			this.h,
			this.gravity
		);
		this.fluid.initV = 3;

		this.fluid.setupCells();
	}
}
