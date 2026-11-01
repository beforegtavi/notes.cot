import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Firebase Setup
const firebaseConfig = {
    apiKey: "AIzaSyDf74iHyBTQ0B7ebjfXBYt3eO8yym1pL60",
    authDomain: "web-project-1-b3021.firebaseapp.com",
    projectId: "web-project-1-b3021",
    storageBucket: "web-project-1-b3021.firebasestorage.app",
    messagingSenderId: "467946217186",
    appId: "1:467946217186:web:a1d2ede1b9a74a19bd88bb",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let courseDatabase = {};

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('loginModal');
    const authForm = document.getElementById('authForm');
    const triggers = document.querySelectorAll('.auth-trigger');
    const closeBtn = document.getElementById('closeLoginBtn');
    const dashboardSection = document.getElementById('dashboard-section');
    const mainPageContent = document.querySelector('.page-content');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logoutBtn');

    const progSelect = document.getElementById('programme');
    const yearSelect = document.getElementById('year');
    const semSelect = document.getElementById('semester');
    const courseSelect = document.getElementById('course');

    const materialButtons = document.querySelectorAll('.btn-action');
    
    // Modal Setup 
    triggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        authForm.reset();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            authForm.reset();
        }
    });

    // Logim Authentication
    authForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value.trim();
        const idnumber = document.getElementById('idnumber').value.trim();
        const submitBtn = authForm.querySelector('button[type="submit"]');

        if (!username || !idnumber) {
            alert("Fill all the details. Don't try to bypass the system.");
            return;
        }

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;

        try {
            const studentRef = doc(db, "allowed_students", idnumber);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                modal.classList.add('hidden');
                mainPageContent.classList.add('hidden');
                dashboardSection.classList.remove('hidden');

                document.querySelector('.nav-links').classList.add('hidden');
                document.querySelector('.nav-actions').classList.add('hidden');
                userDisplay.innerText = username.charAt(0).toUpperCase() + username.slice(1);

                await loadCourseStructure();
            } else {
                alert("Access Denied: Invalid Student ID.");
            }
        } catch (error) {
            console.error("Login Error: ", error);
            alert("Database connection failed. Check your internet.");
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // For Logout
    logoutBtn.addEventListener('click', () => {
        dashboardSection.classList.add('hidden');
        mainPageContent.classList.remove('hidden');

        document.getElementById('material-actions').classList.add('hidden');
        document.getElementById('content-viewer').classList.add('hidden');
        document.querySelector('.nav-links').classList.remove('hidden');
        document.querySelector('.nav-actions').classList.remove('hidden');

        progSelect.value = "";
        yearSelect.innerHTML = '<option value="" disabled selected>Select Year</option>';
        yearSelect.disabled = true;
        semSelect.innerHTML = '<option value="" disabled selected>Select Semester</option>';
        semSelect.disabled = true;
        courseSelect.innerHTML = '<option value="" disabled selected>Select Course Code</option>';
        courseSelect.disabled = true;

        alert("Logged out successfully!");
    });

    // Database Fetch Functions
    async function loadCourseStructure() {
        try {
            const docRef = doc(db, "metadata", "course_structure");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                courseDatabase = docSnap.data().data;
                console.log("Course structure loaded successfully.");
            } else {
                console.error("Structure document missing!");
            }
        } catch (error) {
            console.error("Error fetching structure:", error);
        }
    }

    progSelect.addEventListener('change', () => {
        const prog = progSelect.value;
        yearSelect.innerHTML = '<option value="" disabled selected>Select Year</option>';
        semSelect.innerHTML = '<option value="" disabled selected>Select Semester</option>';
        courseSelect.innerHTML = '<option value="" disabled selected>Select Course Code</option>';
        semSelect.disabled = true;
        courseSelect.disabled = true;

        if (prog && courseDatabase[prog]) {
            yearSelect.disabled = false;
            for (let year in courseDatabase[prog]) {
                yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
            }
        } else {
            yearSelect.disabled = true;
        }
    });

    yearSelect.addEventListener('change', () => {
        const prog = progSelect.value;
        const year = yearSelect.value;
        semSelect.innerHTML = '<option value="" disabled selected>Select Semester</option>';
        courseSelect.innerHTML = '<option value="" disabled selected>Select Course Code</option>';
        courseSelect.disabled = true;

        if (prog && year && courseDatabase[prog][year]) {
            semSelect.disabled = false;
            for (let sem in courseDatabase[prog][year]) {
                semSelect.innerHTML += `<option value="${sem}">${sem}</option>`;
            }
        } else {
            semSelect.disabled = true;
        }
    });

    semSelect.addEventListener('change', () => {
        const prog = progSelect.value;
        const year = yearSelect.value;
        const sem = semSelect.value;
        courseSelect.innerHTML = '<option value="" disabled selected>Select Course Code</option>';

        if (prog && year && sem && courseDatabase[prog][year][sem]) {
            courseSelect.disabled = false;
            const courses = courseDatabase[prog][year][sem];
            courses.forEach(course => {
                courseSelect.innerHTML += `<option value="${course}">${course}</option>`;
            });
        } else {
            courseSelect.disabled = true;
        }
    });

    courseSelect.addEventListener('change', () => {
        if (courseSelect.value) {
            document.getElementById('material-actions').classList.remove('hidden');
        } else {
            document.getElementById('material-actions').classList.add('hidden');
            document.getElementById('content-viewer').classList.add('hidden');
        }
    });

    // Material Fetching
    materialButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const type = e.target.closest('button').dataset.type;
            const courseCode = courseSelect.value;
            const viewer = document.getElementById('content-viewer');
            const statusText = document.getElementById('viewer-status');
            const linksContainer = document.getElementById('dynamic-links-container');
            const loader = document.querySelector('.loader');

            if (!courseCode) {
                alert("Select a course first.");
                return;
            }

            viewer.classList.remove('hidden');
            loader.style.display = 'block';
            statusText.innerHTML = "Fetching secure links...";
            linksContainer.innerHTML = "";

            try {
                const courseRef = doc(db, "course_materials", courseCode);
                const courseSnap = await getDoc(courseRef);

                if (courseSnap.exists()) {
                    const data = courseSnap.data();
                    const materialsArray = data[type];

                    if (!materialsArray || materialsArray.length === 0) {
                        statusText.innerHTML = `<span style="color:var(--danger);">No ${type} uploaded yet for ${courseCode}.</span>`;
                        loader.style.display = 'none';
                        return;
                    }

                    statusText.innerHTML = `Available ${type.toUpperCase()}:`;

                    materialsArray.forEach(item => {
                        const linkBtn = document.createElement('a');
                        linkBtn.href = item.url;
                        linkBtn.target = "_blank";
                        linkBtn.className = "btn btn-action";
                        linkBtn.style.display = "block";
                        linkBtn.style.marginTop = "10px";
                        linkBtn.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> Open ${item.title}`;

                        linksContainer.appendChild(linkBtn);
                    });
                } else {
                    statusText.innerHTML = `<span style="color:var(--danger);">Material not uploaded yet for ${courseCode}</span>`;
                }
            } catch (error) {
                statusText.innerHTML = "Error fetching data. Check connection.";
                console.error(error);
            } finally {
                loader.style.display = 'none';
            }
        });
    });
});

const canvas = document.getElementById('binary-combat');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
let prevMouse = { x: -1000, y: -1000 };
let isSingularity = false;

const fighters = [];
const sparks = [];
const shockwaves = [];

window.addEventListener('mousedown', () => {
  isSingularity = true;
});

window.addEventListener('mouseup', () => {
  if (isSingularity) {
    isSingularity = false;
    shockwaves.push(new Shockwave(mouse.x, mouse.y, 120, '#00f3ff'));
    fighters.forEach(f => {
      const dx = f.x - mouse.x;
      const dy = f.y - mouse.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 350) {
        const force = (350 - dist) / 18;
        f.vx += (dx / dist) * force;
        f.vy += (dy / dist) * force;
      }
    });
  }
});

function drawLightning(x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const segments = 4;
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const bx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 14;
    const by = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 14;
    ctx.lineTo(bx, by);
  }
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

class Shockwave {
  constructor(x, y, maxRadius, color) {
    this.x = x;
    this.y = y;
    this.radius = 2;
    this.maxRadius = maxRadius;
    this.color = color;
    this.alpha = 1;
  }
  update() {
    this.radius += (this.maxRadius - this.radius) * 0.16;
    this.alpha -= 0.045;
  }
  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

class Spark {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = Math.random() * 0.04 + 0.03;
    this.color = color;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life -= this.decay;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
    ctx.stroke();
    ctx.restore();
  }
}

class CyberFighter {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx + (Math.random() - 0.5) * 3;
    this.vy = vy + (Math.random() - 0.5) * 3;
    this.history = [];
    this.faction = Math.random() > 0.5 ? 1 : 0;
    this.char = this.faction === 1 ? '1' : '0';
    this.color = this.faction === 1 ? '#00ff66' : '#00f3ff';
    this.hp = 100;
    this.kills = 0;
    this.size = 14;
    this.angle = Math.random() * Math.PI * 2;
  }

  update(all) {
    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > 6) this.history.shift();

    if (isSingularity) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 400) {
        
        this.vx += (dx / dist) * 1.2 - (dy / dist) * 0.8;
        this.vy += (dy / dist) * 1.2 + (dx / dist) * 0.8;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.94;
    this.hp -= 0.35;
    this.angle += 0.08;

    let inCombat = false;

    for (let i = 0; i < all.length; i++) {
      const other = all[i];
      if (other === this || other.hp <= 0) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (dist < 90) {
        if (this.faction !== other.faction) {
        
          inCombat = true;
          this.vx += (dx / dist) * 0.25 - (dy / dist) * 0.4;
          this.vy += (dy / dist) * 0.25 + (dx / dist) * 0.4;

          if (Math.random() < 0.25) {
            drawLightning(this.x, this.y, other.x, other.y, '#ff0055');
          }

          if (dist < 28) {
            other.hp -= 3.5 + this.kills * 1.5;
            this.vx -= (dx / dist) * 1.8;
            this.vy -= (dy / dist) * 1.8;

            if (other.hp <= 0) {
              this.kills++;
              this.hp = Math.min(140, this.hp + 45);
              this.size = Math.min(24, this.size + 3);
              const hex = ['0xA', '0xF', '0xE', '0x9'];
              this.char = hex[this.kills % hex.length];
              this.color = '#ff0055';

              shockwaves.push(new Shockwave(other.x, other.y, 45, other.color));
              for (let s = 0; s < 8; s++) {
                sparks.push(new Spark(other.x, other.y, other.color));
              }
            }
          }
        } else if (dist < 60) {
          // ALLY LINK: Faint cybernetic data tether
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(0, 255, 140, ${(1 - dist / 60) * 0.2})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    this.draw(inCombat);
  }

  draw(inCombat) {
    const alpha = Math.max(0, Math.min(1, this.hp / 100));
    ctx.save();

    if (this.history.length > 2) {
      ctx.beginPath();
      ctx.moveTo(this.history[0].x, this.history[0].y);
      for (let i = 1; i < this.history.length; i++) {
        ctx.lineTo(this.history[i].x, this.history[i].y);
      }
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

  
    if (this.kills > 0) {
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.85, this.angle, this.angle + Math.PI * 1.3);
      ctx.stroke();
    }

    
    const fontSize = Math.floor(this.size);
    ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha;

    if (inCombat) {
      ctx.fillStyle = '#ff003c';
      ctx.fillText(this.char, this.x - 2.5, this.y);
      ctx.fillStyle = '#00f3ff';
      ctx.fillText(this.char, this.x + 2.5, this.y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.char, this.x, this.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillText(this.char, this.x, this.y);
    }

    ctx.restore();
  }
}

document.addEventListener('mousemove', (e) => {
  mouse.vx = (e.clientX - prevMouse.x) * 0.15;
  mouse.vy = (e.clientY - prevMouse.y) * 0.15;
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  const dist = Math.hypot(mouse.x - prevMouse.x, mouse.y - prevMouse.y);
  if (dist > 18) {
    fighters.push(new CyberFighter(mouse.x, mouse.y, mouse.vx, mouse.vy));
    if (fighters.length > 110) fighters.shift();
    prevMouse.x = mouse.x;
    prevMouse.y = mouse.y;
  }
});

function animate() {
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

 
  ctx.globalCompositeOperation = 'lighter';

  
  if (isSingularity) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 28 + Math.sin(Date.now() * 0.02) * 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  for (let i = shockwaves.length - 1; i >= 0; i--) {
    shockwaves[i].update();
    shockwaves[i].draw();
    if (shockwaves[i].alpha <= 0) shockwaves.splice(i, 1);
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].update();
    sparks[i].draw();
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }

  for (let i = fighters.length - 1; i >= 0; i--) {
    fighters[i].update(fighters);
    if (fighters[i].hp <= 0) fighters.splice(i, 1);
  }

  requestAnimationFrame(animate);
}

animate();
