const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let dataPoints = [];
let attentionBoxes = [];
let scanPulses = [];
let time = 0;

// --- ACADEMIC PAREIDOLIA PARAMETERS (TWEAKED) ---
const POINT_COUNT = 150;           
const BOX_SPAWN_RATE = 0.008;      
const BOX_LIFESPAN = 300;          
const MAX_CONCURRENT_BOXES = 5;    
const MOUSE_ATTRACT_RADIUS = 150;  // Mouse now pulls data in
// ------------------------------------------------

let mouse = { x: null, y: null, vx: 0, vy: 0 };
let lastMouse = { x: null, y: null };

// VLM Vocabulary - Custom tuned to your exact thesis queries
const LABELS = [
    'query: "asphalt"', 'class: "tree"', 'feature: "galaxy"',
    'label: "bicycle"', 'query: "frog"', 'match: "spider_web"',
    'class: "circuit_board"', 'feature: "human_face"', 'query: "lightning"',
    'label: "melting_ice"', 'match: "storm_clouds"', 'query: "fabric"',
    'conf: [0.12]', 'resemblance: abstract', 'class: unknown'
];

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.vx = mouse.x - lastMouse.x;
    mouse.vy = mouse.y - lastMouse.y;
});
window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// NEW INTERACTION: Click to force an immediate VLM classification
window.addEventListener('click', (e) => {
    scanPulses.push(new ScanPulse(e.clientX, e.clientY));
    attentionBoxes.push(new AttentionBox(e.clientX, e.clientY, true));
});

// The Data Substrate
class DataPoint {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.seed = Math.random() * 1000;
        this.speed = Math.random() * 0.1 + 0.05;
    }
    update() {
        this.y -= this.speed;
        this.x += Math.sin(time * 0.003 + this.seed) * 0.15;
        
        if (this.y < -10) this.y = height + 10;
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;

        // Gentle mouse ATTRACTION (simulating attention weight)
        if (mouse.x !== null) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_ATTRACT_RADIUS) {
                let force = (MOUSE_ATTRACT_RADIUS - dist) / MOUSE_ATTRACT_RADIUS;
                this.x -= (dx / dist) * force * 0.8;
                this.y -= (dy / dist) * force * 0.8;
            }
        }
    }
    draw() {
        // INCREASED OPACITY: ~15% visibility for the data points
        ctx.fillStyle = 'rgba(230, 230, 240, 0.15)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// The Scan Pulse (Click Effect)
class ScanPulse {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxLife = 60;
        this.life = this.maxLife;
    }
    update() {
        this.radius += 12; // Expands outward
        this.life--;
    }
    draw() {
        const fade = this.life / this.maxLife;
        ctx.strokeStyle = `rgba(200, 200, 255, ${fade * 0.20})`; // 20% opacity ping
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// The Hallucination Engine
class AttentionBox {
    constructor(x, y, isForced = false) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.1; 
        this.vy = (Math.random() - 0.5) * 0.1;
        this.isForced = isForced;
        
        // Forced boxes (from clicks) are larger and snap open faster
        this.targetW = isForced ? Math.random() * 160 + 80 : Math.random() * 120 + 60;
        this.targetH = isForced ? Math.random() * 120 + 60 : Math.random() * 80 + 40;
        this.snapSpeed = isForced ? 0.08 : 0.03;

        this.w = 0;
        this.h = 0;
        
        this.maxLife = isForced ? BOX_LIFESPAN * 0.6 : BOX_LIFESPAN + (Math.random() * 60 - 30);
        this.life = 0;
        
        this.label = LABELS[Math.floor(Math.random() * LABELS.length)];
        // Forced boxes often spit out higher (fake) confidence scores
        this.score = (isForced ? Math.random() * 0.5 + 0.4 : Math.random() * 0.3 + 0.05).toFixed(3);
        
        this.offsetX = (Math.random() > 0.5 ? 1 : -1) * (this.targetW / 2 + 15);
        this.offsetY = (Math.random() > 0.5 ? 1 : -1) * (this.targetH / 2 + 15);
    }
    
    update() {
        this.life++;
        this.x += this.vx;
        this.y += this.vy;
        
        this.w += (this.targetW - this.w) * this.snapSpeed; 
        this.h += (this.targetH - this.h) * this.snapSpeed;
    }

    draw() {
        const progress = this.life / this.maxLife;
        const fade = Math.sin(progress * Math.PI); 

        ctx.save();
        ctx.translate(this.x, this.y);

        // INCREASED OPACITY: Bounding boxes now peak at ~20-25%
        const boxOpacity = this.isForced ? 0.35 : 0.20; 
        ctx.strokeStyle = `rgba(220, 220, 235, ${fade * boxOpacity})`;
        ctx.lineWidth = 1;
        const s = 10;
        const w2 = this.w / 2;
        const h2 = this.h / 2;

        ctx.beginPath();
        ctx.moveTo(-w2, -h2 + s); ctx.lineTo(-w2, -h2); ctx.lineTo(-w2 + s, -h2);
        ctx.moveTo(w2 - s, -h2); ctx.lineTo(w2, -h2); ctx.lineTo(w2, -h2 + s);
        ctx.moveTo(w2, h2 - s); ctx.lineTo(w2, h2); ctx.lineTo(w2 - s, h2);
        ctx.moveTo(-w2 + s, h2); ctx.lineTo(-w2, h2); ctx.lineTo(-w2, h2 - s);
        ctx.stroke();

        ctx.strokeStyle = `rgba(240, 240, 255, ${fade * 0.08})`;
        ctx.beginPath();
        ctx.moveTo(-w2, 0); ctx.lineTo(w2, 0);
        ctx.moveTo(0, -h2); ctx.lineTo(0, h2);
        ctx.stroke();

        // INCREASED OPACITY: Text now peaks at ~45% for better legibility
        ctx.fillStyle = `rgba(200, 200, 220, ${fade * 0.45})`;
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.textAlign = this.offsetX > 0 ? 'left' : 'right';
        
        let displayLabel = this.label;
        if (Math.random() > 0.99) displayLabel = displayLabel.split('').sort(() => 0.5 - Math.random()).join('');

        ctx.fillText(displayLabel, this.offsetX, this.offsetY);
        ctx.fillText(`[${this.score}]`, this.offsetX, this.offsetY + 14);
        
        ctx.strokeStyle = `rgba(220, 220, 240, ${fade * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(this.offsetX > 0 ? w2 : -w2, this.offsetY > 0 ? h2 : -h2);
        ctx.lineTo(this.offsetX, this.offsetY - 5);
        ctx.stroke();

        ctx.restore();
    }
}

function init() {
    resize();
    dataPoints = [];
    for (let i = 0; i < POINT_COUNT; i++) {
        dataPoints.push(new DataPoint());
    }
    attentionBoxes = [];
    scanPulses = [];
    animate();
}

function animate() {
    time++;
    ctx.clearRect(0, 0, width, height);
    
    // Draw Substrate
    dataPoints.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw Scan Pulses
    for (let i = scanPulses.length - 1; i >= 0; i--) {
        let pulse = scanPulses[i];
        pulse.update();
        pulse.draw();
        if (pulse.life <= 0) scanPulses.splice(i, 1);
    }

    // Ambient Hallucination
    if (Math.random() < BOX_SPAWN_RATE && attentionBoxes.length < MAX_CONCURRENT_BOXES) {
        attentionBoxes.push(new AttentionBox(
            Math.random() * width, 
            Math.random() * height
        ));
    }

    // Update and prune boxes
    for (let i = attentionBoxes.length - 1; i >= 0; i--) {
        let box = attentionBoxes[i];
        box.update();
        box.draw();
        
        if (box.life >= box.maxLife) {
            attentionBoxes.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animate);
}

// Boot up
init();
