import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Firebase Initialization
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

// Core DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('loginModal');
    const authForm = document.getElementById('authForm');
    const triggers = document.querySelectorAll('.auth-trigger');
    const closeBtn = document.getElementById('closeLoginBtn');
    const dashboardSection = document.getElementById('dashboard-section');
    const mainPageContent = document.querySelector('.page-content');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logoutBtn');

    // Dropdown Elements
    const progSelect = document.getElementById('programme');
    const yearSelect = document.getElementById('year');
    const semSelect = document.getElementById('semester');
    const courseSelect = document.getElementById('course');

    // Action Buttons
    const materialButtons = document.querySelectorAll('.btn-action');

    // --- Modal Management ---
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

    // --- Authentication Logic ---
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
                // Capitalize first letter of name for display
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

    // --- Logout Logic ---
    logoutBtn.addEventListener('click', () => {
        dashboardSection.classList.add('hidden');
        mainPageContent.classList.remove('hidden');

        document.getElementById('material-actions').classList.add('hidden');
        document.getElementById('content-viewer').classList.add('hidden');
        document.querySelector('.nav-links').classList.remove('hidden');
        document.querySelector('.nav-actions').classList.remove('hidden');

        // Reset Dropdowns
        progSelect.value = "";
        yearSelect.innerHTML = '<option value="" disabled selected>Select Year</option>';
        yearSelect.disabled = true;
        semSelect.innerHTML = '<option value="" disabled selected>Select Semester</option>';
        semSelect.disabled = true;
        courseSelect.innerHTML = '<option value="" disabled selected>Select Course Code</option>';
        courseSelect.disabled = true;

        alert("Logged out successfully!");
    });

    // --- Database Fetch Functions ---
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

    // --- Dropdown Cascading Logic ---
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

    // --- Material Fetching ---
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