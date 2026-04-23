// State
let isLogin = false;

// DOM Elements
const formTitle = document.getElementById('formTitle');
const toggleText = document.getElementById('toggleText');
const toggleBtn = document.getElementById('toggleBtn');
const submitText = document.getElementById('submitText');
const forgotLink = document.getElementById('forgotLink');
const footer = document.getElementById('footer');
const formSide = document.getElementById('formSide');
const imageSide = document.getElementById('imageSide');
const githubText = document.getElementById('githubText');
const appleText = document.getElementById('appleText');
const googleText = document.getElementById('googleText');
const authForm = document.getElementById('authForm');

// Toggle between Sign Up and Login
function toggleForm() {
  isLogin = !isLogin;

  if (isLogin) {
    formTitle.textContent = 'Welcome back';
    toggleText.textContent = "Don't have an account?";
    toggleBtn.textContent = 'Sign up';
    submitText.textContent = 'Login';
    forgotLink.classList.remove('hidden');
    footer.classList.add('hidden');
    formSide.classList.add('slide-right');
    imageSide.classList.add('slide-left');
    githubText.textContent = 'Login with GitHub';
    appleText.textContent = 'Login with Apple';
    googleText.textContent = 'Login with Google';
  } else {
    formTitle.textContent = 'Create an account';
    toggleText.textContent = 'Already have an account?';
    toggleBtn.textContent = 'Login';
    submitText.textContent = 'Start for free';
    forgotLink.classList.add('hidden');
    footer.classList.remove('hidden');
    formSide.classList.remove('slide-right');
    imageSide.classList.remove('slide-left');
    githubText.textContent = 'Sign up with GitHub';
    appleText.textContent = 'Sign up with Apple';
    googleText.textContent = 'Sign up with Google';
  }
}

// Handle form submission
function handleSubmit(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;

  if (isLogin) {
    alert('Login successful!\nEmail: ' + email);
  } else {
    alert('Account created!\nEmail: ' + email);
  }
}

// Event Listeners
toggleBtn.addEventListener('click', toggleForm);
authForm.addEventListener('submit', handleSubmit);