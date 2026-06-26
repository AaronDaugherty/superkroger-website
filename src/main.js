import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'

import './style.css';

const PASSWORD = '12345';

const files = [
  {
    name: 'photos',
    type: 'folder',
    children: [
      {
        name: 'studio-photo.jpg',
        type: 'image',
        src: '/images/studio-photo.jpg',
      },
      {
        name: 'cover.jpg',
        type: 'image',
        src: '/images/cover.jpg',
      },
    ],
  },
  {
    name: 'demos',
    type: 'folder',
    children: [
      {
        name: 'demo-01.mp3',
        type: 'audio',
        src: '/audio/demos/demo-01.mp3',
      },
    ],
  },
];

const app = document.querySelector('#app');

function render() {
  const route = window.location.hash || '#/';

  if (route === '#/enter') {
    renderEnterPage();
  } else if (route === '#/vault') {
    renderVaultPage();
  } else {
    renderHomePage();
  }
}

function renderHomePage() {
  app.innerHTML = `
    <main class="screen home-screen">
      <div class="logo-wrap">
        <video class="logo-video" autoplay muted loop playsinline>
          <source src="/animations/SuperKroger%20Retro%20Logo.mp4" type="video/mp4">
        </video>
      </div>

      <div class="player">
        <button id="playPauseBtn" class="play-pause-button" aria-label="Play album">
          <img id="playPauseIcon" src="/icons/play.jpg" alt="">
        </button>
      </div>

      <a class="memory-card-link" href="#/enter">
        <img class="memory-card" src="/icons/memory-card.png" alt="Memory Card">
      </a>

      <audio id="albumAudio" src="/audio/other/1.wav"></audio>
    </main>
  `;

  const audio = document.querySelector('#albumAudio');
  const button = document.querySelector('#playPauseBtn');
  const icon = document.querySelector('#playPauseIcon');

  const showPlayState = () => {
    icon.src = '/icons/play.png';
    button.setAttribute('aria-label', 'Play album');
  };

  const showPauseState = () => {
    icon.src = '/icons/pause.jpg';
    button.setAttribute('aria-label', 'Pause album');
  };

  button.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(showPlayState);
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', showPauseState);
  audio.addEventListener('pause', showPlayState);
  audio.addEventListener('ended', showPlayState);
  audio.addEventListener('error', showPlayState);

  const memoryCardLink = document.querySelector('.memory-card-link');

  memoryCardLink.addEventListener('pointermove', event => {
    const rect = memoryCardLink.getBoundingClientRect();
    const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
    const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 14;

    memoryCardLink.style.setProperty('--card-x', `${offsetX}px`);
    memoryCardLink.style.setProperty('--card-y', `${offsetY}px`);
  });

  memoryCardLink.addEventListener('pointerleave', () => {
    memoryCardLink.style.setProperty('--card-x', '0px');
    memoryCardLink.style.setProperty('--card-y', '0px');
  });
}

function renderEnterPage() {
  app.innerHTML = `
    <main class="screen password-screen">
      <div class="panel">
        <h1>Insert Password</h1>

        <form id="passwordForm">
          <input 
            id="passwordInput" 
            class="ps2-input" 
            type="password" 
            autocomplete="off"
            autofocus
          >
          <button class="ps2-button" type="submit">Enter</button>
        </form>

        <p id="errorMessage" class="error-message"></p>

        <a class="back-link" href="#/">Back</a>
      </div>
    </main>
  `;

  const form = document.querySelector('#passwordForm');
  const input = document.querySelector('#passwordInput');
  const error = document.querySelector('#errorMessage');

  form.addEventListener('submit', event => {
    event.preventDefault();

    if (input.value === PASSWORD) {
      sessionStorage.setItem('vaultUnlocked', 'true');
      window.location.hash = '#/vault';
    } else {
      error.textContent = 'incorrect password';
      input.value = '';
    }
  });
}

function renderVaultPage() {
  const unlocked = sessionStorage.getItem('vaultUnlocked') === 'true';

  if (!unlocked) {
    window.location.hash = '#/enter';
    return;
  }

  app.innerHTML = `
    <main class="screen vault-screen">
      <div class="panel file-explorer">
        <div class="window-titlebar">
          <span>Super Secret Files</span>
          <span>X</span>
        </div>
        <div class="window-toolbar">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Help</span>
        </div>
        <div class="window-body">
          <div class="file-pane">
            <div class="pane-label">C:\\MEMORY_CARD</div>
            <div id="fileTree"></div>
          </div>
          <div id="preview" class="preview">
            <p class="empty-preview">Select a file to preview.</p>
          </div>
        </div>
        <div class="window-statusbar">
          <span>Ready</span>
          <a class="back-link" href="#/">Exit</a>
        </div>
      </div>
    </main>
  `;

  const fileTree = document.querySelector('#fileTree');
  fileTree.innerHTML = renderFileList(files);

  document.querySelectorAll('[data-file-src]').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.fileSrc;
      const type = item.dataset.fileType;
      const name = item.dataset.fileName;
      renderPreview({ src, type, name });
    });
  });
}

function renderFileList(items) {
  return `
    <ul class="file-list">
      ${items.map(item => {
        if (item.type === 'folder') {
          return `
            <li>
              <span class="folder">▸ ${item.name}/</span>
              ${renderFileList(item.children)}
            </li>
          `;
        }

        return `
          <li>
            <button 
              class="file"
              data-file-src="${item.src}"
              data-file-type="${item.type}"
              data-file-name="${item.name}"
            >
              ${getFileIcon(item.type)} ${item.name}
            </button>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function getFileIcon(type) {
  if (type === 'audio') return '♫';
  if (type === 'image') return '▣';
  return '◇';
}

function renderPreview(file) {
  const preview = document.querySelector('#preview');

  if (file.type === 'image') {
    preview.innerHTML = `
      <h2>${file.name}</h2>
      <img src="${file.src}" alt="${file.name}">
    `;
  }

  if (file.type === 'audio') {
    preview.innerHTML = `
      <h2>${file.name}</h2>
      <audio src="${file.src}" controls></audio>
    `;
  }
}

window.addEventListener('hashchange', render);

render();
