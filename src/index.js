let repositories = []; // Массив добавленных репозиториев
let searchTimer = null; // Таймер для debounce

const searchInput = document.querySelector('#searchInput');
const suggestionsDiv = document.querySelector('#suggestions');
const repoListDiv = document.querySelector('#repoList');

//Поиск репозиторий через GitHub API
async function searchRepositories(query) {
  try {
    const response = await fetch(`https://api.github.com/search/repositories?q=${query}&per_page=5`);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      showSuggestions(data.items);
    } else {
      hideSuggestions();
    }
  } catch (error) {
    console.log('Ошибка поиска:', error);
    hideSuggestions();
  }
}

//Подсказки
function showSuggestions(repos) {
  suggestionsDiv.innerHTML = '';
  
  //Фильтр
  const filteredRepos = repos.filter(function(repo) {
    return !repositories.find(function(addedRepo) {
      return addedRepo.id === repo.id;
    });
  });
  
  if (filteredRepos.length === 0) {
    hideSuggestions();
    return;
  }
  
  filteredRepos.forEach(function(repo) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.textContent = repo.name;
    
    //Добавление репозитория
    item.addEventListener('click', function() {
      addRepository(repo);
    });
    
    suggestionsDiv.appendChild(item);
  });
  
  suggestionsDiv.style.display = 'block';
  repoListDiv.classList.add('pushed-down');
}

// Скрыть
function hideSuggestions() {
  suggestionsDiv.style.display = 'none';
  repoListDiv.classList.remove('pushed-down');
}

// Добавить репозиторий
function addRepository(repo) {
  const exists = repositories.find(r => r.id === repo.id);
  if (exists) {
    return;
  }
  
  const newRepo = {
    id: repo.id,
    name: repo.name,
    owner: repo.owner.login,
    stars: repo.stargazers_count
  };
  
  repositories.push(newRepo);
  saveRepositories();
  showRepositories();
  searchInput.value = '';
  hideSuggestions();
}

// Удалить
function removeRepository(id) {
  repositories = repositories.filter(repo => repo.id !== id);
  saveRepositories();
  showRepositories();
}

// Показать список
function showRepositories() {
  repoListDiv.innerHTML = '';
  
  if (repositories.length === 0) {
    repoListDiv.innerHTML = '<div class="no-repos">Репозитории не найдены</div>';
    return;
  }
  
  repositories.forEach(function(repo) {
    const repoDiv = document.createElement('div');
    repoDiv.className = 'repo-item';
    
    repoDiv.innerHTML = `
                    <div class="repo-info">
                        <div>Name: ${repo.name}</div>
                        <div>Owner: ${repo.owner}</div>
                        <div>Stars: ${repo.stars}</div>
                    </div>
                    <button class="remove-button" onclick="removeRepository(${repo.id})">✕</button>
                `;
    
    repoListDiv.appendChild(repoDiv);
  });
}

function saveRepositories() {
  localStorage.setItem('repositories', JSON.stringify(repositories));
}

function loadRepositories() {
  const saved = localStorage.getItem('repositories');
  if (saved) {
    repositories = JSON.parse(saved);
  }
}

function initApp() {
  loadRepositories();
  showRepositories();
  
  searchInput.addEventListener('input', function() {
    const query = searchInput.value.trim();
    
    if (query === '') {
      hideSuggestions();
      return;
    }
    
    clearTimeout(searchTimer);
    
    searchTimer = setTimeout(function() {
      searchRepositories(query);
    }, 2000);
  });
  
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.search-box')) {
      hideSuggestions();
    }
  });
}

initApp();