// ======= Starfield Background (optimized & beginner-friendly) =======
export class StarfieldController {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.warn(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');

    this.cfg = {
      focalLength: 400,       // Focal length (updated based on screen size in resize())
      mouseInfluence: 0.22,   // Mouse influence coefficient
      speed: 1.0,             // Base speed, adjustable with scroll wheel
      maxStarSize: 8,         // Maximum star radius
      fadeStartZ: 220,        // Distance where fading starts
      fadeEndZ: 90            // Distance where completely disappears
    };

    this.stars = [];
    this.cx = 0;
    this.cy = 0;      // Canvas center (in pixels)
    this.mx = 0;
    this.my = 0;      // Mouse offset relative to center
    this.animationId = null;

    // Store bound event handlers for cleanup
    this.boundResize = this.resize.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundWheel = this.handleWheel.bind(this);

    this.init();
  }

  init() {
    // Events
    window.addEventListener('resize', this.boundResize);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('wheel', this.boundWheel, { passive: true });

    // Init
    this.resize();
    this.loop();

    // Export config for external control
    window.starfieldConfig = this.cfg;
  }

  createStars(count) {
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      z: Math.random() * this.canvas.width,
      o: 0.6 + Math.random() * 0.4, // Opacity 0.3~1.0
      px: 0, py: 0, pz: 0           // Previous frame coordinates (for trails)
    }));
  }

  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.cx = w / 2;
    this.cy = h / 2;
    this.cfg.focalLength = Math.min(w, h) * 0.9; // Update focal length based on canvas

    // Adaptive quantity: density (one star per 2,200 pixels), limited between 800~4000
    const density = 800;
    const target = Math.max(800, Math.min(4000, Math.floor((w * h) / density)));
    this.createStars(target);
  }

  pos(x, y, z) {
    const scale = this.cfg.focalLength / z;
    return {
      x: (x - this.cx) * scale + this.cx,
      y: (y - this.cy) * scale + this.cy,
      r: Math.min(this.cfg.maxStarSize, scale) // Radius
    };
  }

  alpha(z) {
    if (z <= this.cfg.fadeStartZ) {
      return Math.max(0, Math.min(1, (z - this.cfg.fadeEndZ) / (this.cfg.fadeStartZ - this.cfg.fadeEndZ)));
    }
    return 1;
  }


}
