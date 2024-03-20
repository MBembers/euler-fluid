export default class FluidFrame {
	constructor(sizeX, sizeY, h) {
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.h = h;
		this.u = new Float32Array(this.sizeX * this.sizeY);
		this.v = new Float32Array(this.sizeX * this.sizeY);
		this.p = new Float32Array(this.sizeX * this.sizeY);
		this.s = new Float32Array(this.sizeX * this.sizeY);
		this.smoke = new Float32Array(this.sizeX * this.sizeY);
		this.currMaxVel = 0;
		this.avg_vel = 0;
	}
}
