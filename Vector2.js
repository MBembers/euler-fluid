// vector math -------------------------------------------------------

export default class Vector2 {
	constructor(x = 0.0, y = 0.0) {
		this.x = x;
		this.y = y;
	}

	set(v) {
		this.x = v.x;
		this.y = v.y;
	}

	clone() {
		return new Vector2(this.x, this.y);
	}

	add(v, s = 1.0) {
		this.x += v.x * s;
		this.y += v.y * s;
		return this;
	}

	addVectors(a, b) {
		this.x = a.x + b.x;
		this.y = a.y + b.y;
		return this;
	}

	subtract(v, s = 1.0) {
		this.x -= v.x * s;
		this.y -= v.y * s;
		return this;
	}

	subtractVectors(a, b) {
		this.x = a.x - b.x;
		this.y = a.y - b.y;
		return this;
	}

	length() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	scale(s) {
		this.x *= s;
		this.y *= s;
	}

	dot(v) {
		return this.x * v.x + this.y * v.y;
	}
}
