export default class Cell {
	constructor(u, v, s, p, smoke, color) {
		this.u = u;
		this.v = v;
		this.s = s;
		this.p = p;
		this.smoke = smoke;
		this.color = color != undefined ? color : `rgba(0,0,0,0)`;
	}
}
