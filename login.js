const USERS = [
  { username: 'admin',    password: 'admin123',    name: 'Administrador',  role: 'admin'  },
  { username: 'lucas',    password: 'lucas123',    name: 'Lucas Triana',   role: 'worker' },
  { username: 'gustavo',  password: 'gustavo123',  name: 'Gustavo Alean',  role: 'worker' },
  { username: 'daniela',  password: 'daniela123',  name: 'Daniela Acosta', role: 'worker' },
];

// Redirect if already logged in
if (sessionStorage.getItem('currentUser')) {
  window.location.href = 'app.html';
}

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  const user = USERS.find(u => u.username === username && u.password === password);

  if (user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'app.html';
  } else {
    errorEl.classList.remove('hidden');
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
  }
});
