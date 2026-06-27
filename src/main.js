import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'

import './style.css';

const PASSWORD = '2701037N6986816W';
const BACKGROUND_IMAGE_URL = '/images/background-alt.jpeg';
const STATIC_LOGO_IMAGE_URL = '/images/staticlogo.png?v=20260627';
const SAFARI_INTRO_ANIMATION_URL = 'https://pub-3fd8855487a64e71be891aa188c2670c.r2.dev/Final%20Safarifinal_SuperKroger%20Retro%20Logo.mov';
const SAFARI_LOOP_ANIMATION_URL = 'https://pub-3fd8855487a64e71be891aa188c2670c.r2.dev/Safari%20Loop_SuperKroger%20Retro%20Logo.mov';

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

const isHomeRoute = route => route !== '#/enter' && route !== '#/vault';
const isSafariBrowser = () => /Safari/i.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|OPiOS|Android/i.test(navigator.userAgent);
const isMobileBrowser = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const useStaticMobileLogo = isMobileBrowser();
const useSafariAnimation = isSafariBrowser() && !useStaticMobileLogo;

document.body.classList.toggle('is-home-route', isHomeRoute(window.location.hash || '#/'));

document.body.insertAdjacentHTML('beforeend', `
  <div class="player">
    <button id="playPauseBtn" class="play-pause-button" aria-label="Play album">
      <img id="playPauseIcon" src="/icons/play.png" alt="">
    </button>
  </div>

  <label class="volume-control" aria-label="Volume">
    <input id="volumeSlider" type="range" min="0" max="1" step="0.01" value="1">
  </label>

  <audio id="albumAudio" src="https://pub-3fd8855487a64e71be891aa188c2670c.r2.dev/superkroger-album.mp3" preload="auto"></audio>
`);

const audio = document.querySelector('#albumAudio');
const button = document.querySelector('#playPauseBtn');
const icon = document.querySelector('#playPauseIcon');
const volumeSlider = document.querySelector('#volumeSlider');
let homeAnimation = null;
let hasIntroAnimationStarted = false;
let albumStartedAt = null;
let staticLogoRevealTimer = null;

audio.volume = Number(volumeSlider.value);

const showPlayState = () => {
  icon.src = '/icons/play.png';
  button.setAttribute('aria-label', 'Play album');
};

const showPauseState = () => {
  icon.src = '/icons/pause.png';
  button.setAttribute('aria-label', 'Pause album');
};

const revealLoopAnimation = (homeScreen, loopVideo) => {
  if (loopVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    homeScreen.classList.add('has-looped');
  } else {
    loopVideo.addEventListener('loadeddata', () => {
      homeScreen.classList.add('has-looped');
    }, { once: true });
  }
};

const startHomeAnimation = () => {
  if (!homeAnimation) return;

  homeAnimation.homeScreen.classList.add('has-started');

  if (homeAnimation.staticLogo) {
    if (homeAnimation.hasRevealedStaticLogo) return;

    const revealStaticLogo = () => {
      if (!homeAnimation || !homeAnimation.staticLogo) return;

      homeAnimation.hasRevealedStaticLogo = true;
      homeAnimation.homeScreen.classList.add('has-static-logo');
    };

    const elapsedSinceStart = albumStartedAt ? Date.now() - albumStartedAt : 0;
    const revealDelay = Math.max(0, 11000 - elapsedSinceStart);

    clearTimeout(staticLogoRevealTimer);
    staticLogoRevealTimer = setTimeout(revealStaticLogo, revealDelay);
    return;
  }

  if (homeAnimation.hasStartedLoop) {
    homeAnimation.loopVideo.play().catch(() => {});
  } else if (hasIntroAnimationStarted && !homeAnimation.hasStartedIntro) {
    homeAnimation.hasStartedLoop = true;
    homeAnimation.loopVideo.currentTime = 0;
    homeAnimation.loopVideo.play().catch(() => {});
    revealLoopAnimation(homeAnimation.homeScreen, homeAnimation.loopVideo);
  } else if (!homeAnimation.hasStartedIntro) {
    hasIntroAnimationStarted = true;
    homeAnimation.hasStartedIntro = true;
    homeAnimation.introVideo.play().catch(() => {});
  }
};

const startAlbumExperience = () => {
  if (!albumStartedAt) {
    albumStartedAt = Date.now();
  }

  document.body.classList.add('album-started');
  showPauseState();
  startHomeAnimation();
};

button.addEventListener('click', () => {
  if (audio.paused) {
    startAlbumExperience();
    audio.play().catch(showPlayState);
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', startAlbumExperience);

audio.addEventListener('pause', showPlayState);
audio.addEventListener('ended', showPlayState);
audio.addEventListener('error', showPlayState);

volumeSlider.addEventListener('input', () => {
  audio.volume = Number(volumeSlider.value);
});

const loadImage = src => new Promise(resolve => {
  const image = new Image();

  image.decoding = 'async';
  image.addEventListener('load', () => {
    if (image.decode) {
      image.decode().then(resolve).catch(resolve);
    } else {
      resolve();
    }
  }, { once: true });
  image.addEventListener('error', resolve, { once: true });
  image.src = src;
});

function render() {
  const route = window.location.hash || '#/';

  clearTimeout(staticLogoRevealTimer);
  staticLogoRevealTimer = null;
  homeAnimation = null;
  document.body.classList.toggle('is-home-route', isHomeRoute(route));

  if (route === '#/enter') {
    renderEnterPage();
  } else if (route === '#/vault') {
    renderVaultPage();
  } else {
    renderHomePage();
  }
}

function renderHomePage() {
  const logoMarkup = useStaticMobileLogo
    ? `<img class="static-logo" src="${STATIC_LOGO_IMAGE_URL}" alt="Super Kroger" decoding="async">`
    : `
        <video class="logo-video logo-video--intro" muted playsinline preload="auto">
          ${useSafariAnimation
            ? `<source src="${SAFARI_INTRO_ANIMATION_URL}">`
            : '<source src="/animations/SuperKrogerAnim.webm" type="video/webm">'
          }
        </video>
        <video class="logo-video logo-video--loop" muted loop playsinline preload="auto">
          ${useSafariAnimation
            ? `<source src="${SAFARI_LOOP_ANIMATION_URL}">`
            : '<source src="/animations/LoopSuperKrogerAnim.webm" type="video/webm">'
          }
        </video>
      `;

  app.innerHTML = `
    <main class="screen home-screen">
      <div class="logo-wrap">
        ${logoMarkup}
      </div>

      <a class="memory-card-link" href="#/enter">
        <img class="memory-card" src="/icons/memory-card.png" alt="Memory Card">
      </a>
    </main>
  `;

  const homeScreen = document.querySelector('.home-screen');
  const introVideo = document.querySelector('.logo-video--intro');
  const loopVideo = document.querySelector('.logo-video--loop');
  const staticLogo = document.querySelector('.static-logo');
  homeAnimation = {
    homeScreen,
    introVideo,
    loopVideo,
    staticLogo,
    hasRevealedStaticLogo: false,
    hasStartedIntro: false,
    hasStartedLoop: false,
  };

  introVideo?.addEventListener('ended', () => {
    if (!homeAnimation || homeAnimation.introVideo !== introVideo || homeAnimation.hasStartedLoop) return;

    homeAnimation.hasStartedLoop = true;
    loopVideo.currentTime = 0;
    loopVideo.play().catch(() => {});

    revealLoopAnimation(homeScreen, loopVideo);
  });

  if (document.body.classList.contains('album-started')) {
    startHomeAnimation();
  }

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
        <div class="password-popup">
          <div class="password-popup-bar">
            <span class="password-close" role="link" tabindex="0" aria-label="Back to home">X</span>
          </div>

          <form id="passwordForm">
            <label class="password-label" for="passwordInput">Password:</label>
            <input 
              id="passwordInput" 
              class="ps2-input" 
              type="password" 
              autocomplete="off"
              autofocus
            >
            <button class="ps2-button" type="submit">OK</button>
          </form>
        </div>

        <p id="errorMessage" class="error-message"></p>
      </div>
    </main>
  `;

  const form = document.querySelector('#passwordForm');
  const input = document.querySelector('#passwordInput');
  const error = document.querySelector('#errorMessage');
  const close = document.querySelector('.password-close');

  const goHome = () => {
    window.location.hash = '#/';
  };

  close.addEventListener('click', goHome);
  close.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goHome();
    }
  });

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
          <span>SK File Cabinet</span>
          <a class="back-link" href="#/"><span>X</span></a>
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
          <span>Zac Crook</span>
          <span>Hampton Peay</span>
          <span>Tommy Trautwein</span>
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

Promise.all([
  loadImage(BACKGROUND_IMAGE_URL),
  useStaticMobileLogo ? loadImage(STATIC_LOGO_IMAGE_URL) : Promise.resolve(),
]).then(() => {
  document.body.classList.add('background-ready');
  render();

  requestAnimationFrame(() => {
    document.body.classList.add('site-loaded');

    requestAnimationFrame(() => {
      document.body.classList.add('player-motion-ready');
    });
  });
});
