document.addEventListener('DOMContentLoaded', () => {
    // ========== SETUP ==========
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

    // Style the canvas to be a background layer
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1'; // Place it behind all other content

    let stars = [];
    let glows = []; // Changed from 'particles' to 'glows'
    const numStars = 200;
    const maxGlows = 5; // Maximum number of glows on screen at once

    function init() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        stars = [];
        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
            });
        }
    }

    // ========== EVENT LISTENERS ==========
    window.addEventListener('resize', init);
    // REMOVED the click listener

    // ========== ANIMATION LOOP ==========
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- Handle Stars (same as before) ---
        ctx.fillStyle = 'white';
        for (const star of stars) {
            star.x += star.vx;
            star.y += star.vy;
            if (star.x < 0) star.x = canvas.width;
            if (star.x > canvas.width) star.x = 0;
            if (star.y < 0) star.y = canvas.height;
            if (star.y > canvas.height) star.y = 0;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Handle Random Glows ---
        // Randomly decide to spawn a new glow
        if (Math.random() > 0.992 && glows.length < maxGlows) {
            glows.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                maxRadius: Math.random() * 150 + 100, // How big the glow gets
                life: 0,
                phase: 'in', // 'in' for fading in, 'out' for fading out
            });
        }

        // Draw and update glows
        for (let i = glows.length - 1; i >= 0; i--) {
            const glow = glows[i];
            
            // Animate the fade in/out cycle
            if (glow.phase === 'in') {
                glow.life += 0.003; // Speed of fade in
                if (glow.life >= 1) {
                    glow.life = 1;
                    glow.phase = 'out';
                }
            } else {
                glow.life -= 0.002; // Speed of fade out
            }

            // Remove glow if it has completely faded out
            if (glow.life <= 0) {
                glows.splice(i, 1);
                continue;
            }

            // The actual radius grows and shrinks with its life
            const currentRadius = glow.maxRadius * glow.life;

            // Create a radial gradient for a soft glow effect
            const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, currentRadius);
            // Center of the glow is a slightly more opaque purple
            gradient.addColorStop(0, `rgba(191, 64, 191, ${glow.life * 0.3})`);
            // Edge of the glow is fully transparent
            gradient.addColorStop(1, 'rgba(191, 64, 191, 0)');

            // Draw the glow
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(glow.x, glow.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }

    // Start everything
    init();
    animate();
});