import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  getFirestore, doc, collection, onSnapshot, setDoc, deleteDoc
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-functions.js';

// Public Firebase web config. Firebase API keys identify the project; access is controlled by Auth + Rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAH7oFJemja0Y-KyV9HaFTHX6uFFws7ziY',
  authDomain: 'kitacat-collectomon.firebaseapp.com',
  projectId: 'kitacat-collectomon',
  storageBucket: 'kitacat-collectomon.firebasestorage.app',
  messagingSenderId: '287844820636',
  appId: '1:287844820636:web:36587b3e5a26adcd1eef59',
  measurementId: 'G-6SP6H0Z5VK'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const api = {
  initializePlayer: httpsCallable(functions, 'initializePlayer'),
  fuseMonsters: httpsCallable(functions, 'fuseMonsters'),
  startBotBattle: httpsCallable(functions, 'startBotBattle'),
  battleTurn: httpsCallable(functions, 'battleTurn'),
  openRoboPack: httpsCallable(functions, 'openRoboPack')
};

const MONS = {
  butterstick: { name:'ButterStick', emoji:'🧈', type:'Snack', group:'snack', rarity:'Common', hp:48, power:17, guard:26, color:'#ffe3a0', number:'001', image:'images/monsters/butterstick.png', desc:'A cheerful little butter creature. It is warm, gentle and surprisingly brave.' },
  sparkit: { name:'Sparkit', emoji:'⚡', type:'Electric', group:'elemental', rarity:'Common', hp:42, power:29, guard:17, color:'#ffdf82', number:'002', image:'images/monsters/sparkit.png', desc:'A curious electric Mon that stores little sparks in its fluffy cheeks.' },
  mossmallow: { name:'Mossmallow', emoji:'🌿', type:'Nature', group:'nature', rarity:'Common', hp:59, power:18, guard:30, color:'#c7e9a8', number:'003', image:'images/monsters/mossmallow.png', desc:'A soft forest wanderer. Tiny leaves grow wherever it takes a nap.' },
  tidelet: { name:'Tidelet', emoji:'💧', type:'Aquatic', group:'aquatic', rarity:'Common', hp:51, power:23, guard:24, color:'#a6e4ff', number:'004', image:'images/monsters/tidelet.png', desc:'A playful water Mon that makes bubbles when it gets excited.' },
  pebblit: { name:'Pebblit', emoji:'🪨', type:'Earth', group:'nature', rarity:'Common', hp:64, power:18, guard:35, color:'#d7c6ad', number:'005', image:'images/monsters/pebblit.png', desc:'A sturdy little rock friend. It loves collecting shiny stones.' },
  embercub: { name:'EmberCub', emoji:'🔥', type:'Fire', group:'elemental', rarity:'Uncommon', hp:45, power:33, guard:19, color:'#ffb38a', number:'006', image:'images/monsters/embercub.png', desc:'A bold fire cub whose tail glows brighter when it is happy.' },
  voltbloom: { name:'Voltbloom', emoji:'🌼', type:'Electric / Nature', group:'elemental', rarity:'Rare', hp:67, power:35, guard:29, color:'#d6ed8e', number:'007', image:'images/monsters/voltbloom.png', desc:'A rare fusion that mixes forest energy with a bright electric pulse.' },
  reeforge: { name:'Reeforge', emoji:'🪸', type:'Water / Earth', group:'aquatic', rarity:'Rare', hp:82, power:30, guard:40, color:'#8edbd5', number:'008', image:'images/monsters/reeforge.png', desc:'A strong reef guardian formed from water and ancient stone.' },
  cindervine: { name:'Cindervine', emoji:'🌺', type:'Fire / Nature', group:'nature', rarity:'Rare', hp:64, power:39, guard:26, color:'#ffb18e', number:'009', image:'images/monsters/cindervine.png', desc:'A twisting flame blossom that protects the places where it grows.' },
  butterbolt: { name:'ButterBolt', emoji:'🔆', type:'Snack / Electric', group:'snack', rarity:'Rare', hp:60, power:37, guard:26, color:'#ffe18b', number:'010', image:'images/monsters/butterbolt.png', desc:'A curious fusion with a golden glow and a very energetic personality.' },
  robomon: { name:'Robomon', emoji:'🤖', type:'Robot', group:'robot', rarity:'Rare', hp:62, power:35, guard:34, color:'#c4d8ed', number:'101', image:'images/monsters/robomon.png', desc:'A dependable little robot friend. It learns new tricks with every adventure.' },
  robobit: { name:'Robobit', emoji:'🐰', type:'Robot', group:'robot', rarity:'Rare', hp:55, power:39, guard:27, color:'#d8d9f3', number:'102', image:'images/monsters/robobit.png', desc:'A speedy robot with springy feet and a very friendly beep.' },
  robopup: { name:'Robopup', emoji:'🐶', type:'Robot', group:'robot', rarity:'Rare', hp:70, power:30, guard:36, color:'#c9e7ed', number:'103', image:'images/monsters/robopup.png', desc:'A loyal mechanical pup that guards its friends and loves charging around.' }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const state = {
  user:null,
  profile:null,
  mons:[],
  meadow:[],
  discoveries:[],
  view:'meadow',
  filter:'all',
  sort:'newest',
  fusionSelection:[],
  battleSelection:[],
  battle:null,
  battleBusy:false,
  drag:null,
  suppressClickUntil:0,
  chatDeck:[],
  unsubscribers:[],
  snapshotsReady:{ profile:false, mons:false, meadow:false, discoveries:false },
  positionWrites:new Map()
};

function assetImage(path, alt, className = '') {
  return `<img class="${className}" src="${escapeHTML(path)}" alt="${escapeHTML(alt)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="image-fallback" hidden>${escapeHTML(MONS[Object.keys(MONS).find(k => MONS[k].image === path)]?.emoji || '◈')}</span>`;
}
function monImage(species, className = '') {
  const data = MONS[species] || MONS.butterstick;
  return `<img class="${className}" src="${data.image}" alt="${escapeHTML(data.name)}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="image-fallback" hidden>${data.emoji}</span>`;
}
function monData(mon) { return MONS[mon.species] || MONS.butterstick; }
function byId(id) { return state.mons.find(mon => mon.id === id); }
function toast(message, type = 'ok') {
  const node = document.createElement('div');
  node.className = `toast ${type === 'error' ? 'error' : ''}`;
  node.textContent = message;
  $('#toast-region').append(node);
  window.setTimeout(() => node.remove(), 3200);
}
function showAuthError(message) { $('#auth-error').textContent = message || ''; }
function showAuth() {
  $('#auth-screen').classList.remove('hidden');
  $('#boot-screen').classList.add('hidden');
  $('#game-app').classList.add('hidden');
}
function showBoot() {
  $('#auth-screen').classList.add('hidden');
  $('#game-app').classList.add('hidden');
  $('#boot-screen').classList.remove('hidden');
}
function showGame() {
  $('#auth-screen').classList.add('hidden');
  $('#boot-screen').classList.add('hidden');
  $('#game-app').classList.remove('hidden');
}
function setFavicon() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50%" y=".88em" text-anchor="middle" font-size="88">🐱</text></svg>';
  $('#favicon').href = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Auth is mandatory. A popup is more reliable on GitHub Pages than redirect auth,
// which can be interrupted by browsers' cross-site storage protections. Keep the
// signInWithPopup call directly inside the click handler so browsers allow the popup.
$('#google-sign-in').addEventListener('click', async () => {
  showAuthError('');
  const button = $('#google-sign-in');
  const label = button.querySelector('span:last-child');
  button.disabled = true;
  label.textContent = 'Connecting to Google...';
  try {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged loads the player's saved world after Firebase completes sign-in.
  } catch (error) {
    console.error('Google sign-in failed:', error);
    showAuthError(authMessage(error));
    button.disabled = false;
    label.textContent = 'Continue with Google';
  }
});
$('#sign-out-button').addEventListener('click', async () => {
  try { await signOut(auth); } catch (error) { toast(authMessage(error), 'error'); }
});

function authMessage(error) {
  const code = error?.code || '';
  if (code.includes('unauthorized-domain')) return 'This site is not authorized yet. In Firebase Console, open Authentication → Settings → Authorized domains and add littendekitten.github.io.';
  if (code.includes('operation-not-allowed')) return 'Google sign-in is not enabled. In Firebase Console, open Authentication → Sign-in method and enable Google.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the Google sign-in window. Allow pop-ups for littendekitten.github.io, then try again.';
  if (code.includes('popup-closed-by-user')) return 'The Google sign-in window was closed before sign-in finished. You can try again.';
  if (code.includes('cancelled-popup-request')) return 'A sign-in window is already opening. Finish that window or try again.';
  if (code.includes('network-request-failed')) return 'Could not reach Google or Firebase. Check your connection and try again.';
  if (code.includes('invalid-api-key')) return 'Firebase rejected the web API key. Check the Firebase configuration in app.js.';
  return error?.message || 'Sign-in failed. Please try again.';
}

onAuthStateChanged(auth, async user => {
  stopListeners();
  state.user = user || null;
  state.profile = null;
  state.mons = [];
  state.meadow = [];
  state.discoveries = [];
  state.battle = null;
  state.snapshotsReady = { profile:false, mons:false, meadow:false, discoveries:false };

  if (!user) {
    showAuth();
    $('#google-sign-in').disabled = false;
    $('#google-sign-in').querySelector('span:last-child').textContent = 'Continue with Google';
    return;
  }

  const hasGoogleProvider = user.providerData?.some(provider => provider.providerId === 'google.com');
  if (!hasGoogleProvider) {
    await signOut(auth);
    showAuthError('Please use the Google sign-in button to enter Collectomon.');
    return;
  }

  showBoot();
  try {
    await api.initializePlayer();
    startListeners();
  } catch (error) {
    console.error('Player initialization failed:', error);
    await signOut(auth).catch(() => {});
    showAuth();
    showAuthError(`Could not load your saved world: ${error.message || 'Unknown error'}. Check that Firestore and Cloud Functions are deployed, then sign in again.`);
  }
});

function stopListeners() {
  state.unsubscribers.forEach(unsubscribe => { try { unsubscribe(); } catch (_) {} });
  state.unsubscribers = [];
}
function userDoc() { return doc(db, 'users', state.user.uid); }
function userCollection(name) { return collection(db, 'users', state.user.uid, name); }
function startListeners() {
  const profileRef = userDoc();
  state.unsubscribers.push(onSnapshot(profileRef, snapshot => {
    if (snapshot.exists()) state.profile = { id:snapshot.id, ...snapshot.data() };
    state.snapshotsReady.profile = true;
    maybeShowGame();
    renderAccount();
  }, handleSnapshotError));

  state.unsubscribers.push(onSnapshot(userCollection('mons'), snapshot => {
    state.mons = snapshot.docs.map(item => ({ id:item.id, ...item.data() }));
    state.mons.sort((a,b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    state.snapshotsReady.mons = true;
    if (!state.battleSelection.length) state.battleSelection = state.mons.slice(0,3).map(mon => mon.id);
    state.battleSelection = state.battleSelection.filter(id => state.mons.some(mon => mon.id === id)).slice(0,3);
    state.fusionSelection = state.fusionSelection.filter(id => state.mons.some(mon => mon.id === id)).slice(0,2);
    maybeShowGame();
    renderCurrentView();
  }, handleSnapshotError));

  state.unsubscribers.push(onSnapshot(userCollection('meadow'), snapshot => {
    const incoming = snapshot.docs.map(item => ({ id:item.id, x:item.data().x, y:item.data().y }));
    if (!state.drag) state.meadow = incoming;
    state.snapshotsReady.meadow = true;
    maybeShowGame();
    if (state.view === 'meadow') renderMeadow();
  }, handleSnapshotError));

  state.unsubscribers.push(onSnapshot(userCollection('discoveries'), snapshot => {
    state.discoveries = snapshot.docs.map(item => ({ id:item.id, ...item.data() }));
    state.snapshotsReady.discoveries = true;
    maybeShowGame();
    if (state.view === 'fusion') renderDiscoveries();
  }, handleSnapshotError));
}
function handleSnapshotError(error) {
  console.error('Firestore listener error:', error);
  toast(`Save sync error: ${error.message || 'Could not sync.'}`, 'error');
}
function maybeShowGame() {
  if (Object.values(state.snapshotsReady).every(Boolean)) {
    showGame();
    renderAccount();
    renderCurrentView();
  }
}
function renderAccount() {
  const profile = state.profile || {};
  $('#coin-count').textContent = Number(profile.coins || 0).toLocaleString();
  $('#bolt-count').textContent = Number(profile.bolts || 0);
  $('#battle-bolt-count').textContent = Number(profile.bolts || 0);
  const photo = state.user?.photoURL || '';
  const img = $('#account-photo');
  const initials = $('#account-initials');
  if (photo) {
    img.src = photo;
    img.hidden = false;
    initials.hidden = true;
  } else {
    img.hidden = true;
    initials.hidden = false;
    initials.textContent = (state.user?.displayName || 'LC').split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase();
  }
  renderBoltProgress();
}

function renderBoltProgress() {
  const bolts = Number(state.profile?.bolts || 0);
  const percent = Math.min(100, bolts / 20 * 100);
  $('#bolt-progress-fill').style.width = `${percent}%`;
  $('#bolt-progress-label').textContent = `${Math.min(bolts,20)} / 20 to RoboPack`;
  $('#robopack-progress').textContent = `${Math.min(bolts,20)} / 20`;
  $('#open-robopack').disabled = bolts < 20;
}

// View routing and renderers.
function switchView(view) {
  if (!['meadow','collection','fusion','battle'].includes(view)) return;
  state.view = view;
  $$('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
  $$('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  renderCurrentView();
  window.scrollTo({ top:0, behavior:'smooth' });
}
function renderCurrentView() {
  if (state.view === 'meadow') { renderMeadow(); renderRoster(); }
  if (state.view === 'collection') renderCollection();
  if (state.view === 'fusion') { renderFusionPicker(); renderFusionSlots(); renderDiscoveries(); }
  if (state.view === 'battle') { renderBattleTeam(); renderBoltProgress(); if (state.battle) renderBattle(); }
}

// Meadow rendering uses y-based depth. Dragging temporarily gets z-index 9999,
// then returns to the y-sort after release so overlaps never scramble the layer order.
function renderMeadow() {
  const root = $('#meadow-creatures');
  const existing = new Map($$('.meadow-mon', root).map(node => [node.dataset.monId, node]));
  const wanted = new Set(state.meadow.map(item => item.id));

  for (const [id,node] of existing) {
    if (!wanted.has(id) && !node.classList.contains('dragging')) node.remove();
  }

  state.meadow.forEach((placement, index) => {
    const mon = byId(placement.id);
    if (!mon) return;
    let node = existing.get(mon.id);
    const data = monData(mon);
    const position = state.meadow.find(item => item.id === mon.id) || placement;

    if (!node) {
      node = document.createElement('div');
      node.className = 'meadow-mon';
      node.setAttribute('role', 'button');
      node.tabIndex = 0;
      node.dataset.monId = mon.id;
      node.setAttribute('aria-label', `${data.name}. Drag to move, tap to view.`);
      node.innerHTML = `${monImage(mon.species,'meadow-mon-sprite')}<span class="meadow-mon-name">${escapeHTML(data.name)}</span><span class="meadow-mon-chat hidden"></span><button class="meadow-remove" type="button" data-remove="${mon.id}" aria-label="Send ${escapeHTML(data.name)} away">×</button>`;
      root.append(node);
    }
    node.style.left = `${position.x}%`;
    node.style.top = `${position.y}%`;
    node.style.zIndex = String(Math.round(position.y * 100) + index);
  });

  $('#meadow-drop-hint').classList.toggle('hidden', state.meadow.length > 0);
  $('#meadow-mon-count').textContent = state.meadow.length;
}
function renderRoster() {
  $('#meadow-roster').innerHTML = state.mons.map(mon => {
    const data = monData(mon);
    const inMeadow = state.meadow.some(item => item.id === mon.id);
    return `<button class="roster-chip" type="button" draggable="true" data-roster-id="${mon.id}" title="Drag into meadow">${monImage(mon.species)}<span>${escapeHTML(data.name)}${inMeadow ? ' ✓' : ''}</span></button>`;
  }).join('') || '<p class="empty-note">Your collection is empty.</p>';
}

function moveMonVisual(id, x, y) {
  const placement = state.meadow.find(item => item.id === id);
  const node = $(`[data-mon-id="${CSS.escape(id)}"]`);
  if (!placement || !node) return;
  placement.x = clamp(x, 6, 94);
  placement.y = clamp(y, 28, 87);
  node.style.left = `${placement.x}%`;
  node.style.top = `${placement.y}%`;
  if (!node.classList.contains('dragging')) {
    const order = state.meadow.findIndex(item => item.id === id);
    node.style.zIndex = String(Math.round(placement.y * 100) + order);
  }
}
async function persistMeadow(id) {
  const item = state.meadow.find(entry => entry.id === id);
  if (!item || !state.user) return;
  const oldTimer = state.positionWrites.get(id);
  if (oldTimer) clearTimeout(oldTimer);
  const timer = setTimeout(async () => {
    try {
      await setDoc(doc(db, 'users', state.user.uid, 'meadow', id), { x:item.x, y:item.y });
    } catch (error) {
      console.error(error);
      toast('Could not save that meadow position.', 'error');
    }
    state.positionWrites.delete(id);
  }, 350);
  state.positionWrites.set(id, timer);
}
async function placeMon(id, x = 50, y = 64) {
  if (state.meadow.some(item => item.id === id)) {
    moveMonVisual(id, x, y);
    await persistMeadow(id);
    return false;
  }
  if (!byId(id)) return false;
  const position = { id, x:clamp(x,6,94), y:clamp(y,28,87) };
  state.meadow.push(position);
  renderMeadow();
  renderRoster();
  try {
    await setDoc(doc(db, 'users', state.user.uid, 'meadow', id), { x:position.x, y:position.y });
    toast(`${monData(byId(id)).name} joined the meadow!`);
    return true;
  } catch (error) {
    state.meadow = state.meadow.filter(item => item.id !== id);
    renderMeadow();
    renderRoster();
    toast(`Could not save meadow placement: ${error.message}`, 'error');
    return false;
  }
}
async function removeFromMeadow(id) {
  state.meadow = state.meadow.filter(item => item.id !== id);
  renderMeadow();
  renderRoster();
  try { await deleteDoc(doc(db, 'users', state.user.uid, 'meadow', id)); }
  catch (error) { toast(`Could not remove Mon: ${error.message}`, 'error'); }
}

// Native desktop drop plus pointer-drag support for touch and mouse in the meadow.
const meadowRoot = $('#meadow-world');
meadowRoot.addEventListener('dragover', event => { event.preventDefault(); meadowRoot.classList.add('drag-over'); $('#meadow-drag-overlay').classList.remove('hidden'); });
meadowRoot.addEventListener('dragleave', event => { if (!meadowRoot.contains(event.relatedTarget)) { meadowRoot.classList.remove('drag-over'); $('#meadow-drag-overlay').classList.add('hidden'); } });
meadowRoot.addEventListener('drop', async event => {
  event.preventDefault();
  meadowRoot.classList.remove('drag-over');
  $('#meadow-drag-overlay').classList.add('hidden');
  const id = event.dataTransfer?.getData('text/collectomon-id') || event.dataTransfer?.getData('text/plain');
  if (!id) return;
  const rect = meadowRoot.getBoundingClientRect();
  await placeMon(id, (event.clientX-rect.left)/rect.width*100, (event.clientY-rect.top)/rect.height*100);
});

document.addEventListener('dragstart', event => {
  const source = event.target.closest('[data-card-mon-id], [data-roster-id]');
  if (!source || !event.dataTransfer) return;
  const id = source.dataset.cardMonId || source.dataset.rosterId;
  event.dataTransfer.setData('text/plain', id);
  event.dataTransfer.setData('text/collectomon-id', id);
  event.dataTransfer.effectAllowed = 'copy';
});
meadowRoot.addEventListener('pointerdown', event => {
  const node = event.target.closest('[data-mon-id]');
  if (!node || event.target.closest('[data-remove]')) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const id = node.dataset.monId;
  state.drag = { id, node, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY, moved:false };
  node.classList.add('dragging');
  node.style.zIndex = '9999';
  try { node.setPointerCapture(event.pointerId); } catch (_) {}
});
meadowRoot.addEventListener('pointermove', event => {
  const drag = state.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const rect = meadowRoot.getBoundingClientRect();
  if (Math.abs(event.clientX-drag.startX)+Math.abs(event.clientY-drag.startY) > 5) drag.moved = true;
  if (!drag.moved) return;
  const x = (event.clientX-rect.left)/rect.width*100;
  const y = (event.clientY-rect.top)/rect.height*100;
  moveMonVisual(drag.id, x, y);
  drag.node.style.zIndex = '9999';
  event.preventDefault();
});
function finishMeadowDrag(event) {
  const drag = state.drag;
  if (!drag || (event?.pointerId !== undefined && drag.pointerId !== event.pointerId)) return;
  state.drag = null;
  drag.node.classList.remove('dragging');
  const placement = state.meadow.find(item => item.id === drag.id);
  const order = state.meadow.findIndex(item => item.id === drag.id);
  if (placement) drag.node.style.zIndex = String(Math.round(placement.y * 100) + order);
  if (drag.moved) {
    state.suppressClickUntil = Date.now() + 320;
    persistMeadow(drag.id);
  }
}
meadowRoot.addEventListener('pointerup', finishMeadowDrag);
meadowRoot.addEventListener('pointercancel', finishMeadowDrag);
meadowRoot.addEventListener('lostpointercapture', finishMeadowDrag);

// Ambient movement and much less frequent chatter: one line about every 34 seconds.
function shuffle(list) {
  const result = [...list];
  for (let i=result.length-1;i>0;i--) {
    const j = Math.floor(Math.random()*(i+1));
    [result[i],result[j]] = [result[j],result[i]];
  }
  return result;
}
const CHAT_LINES = [
  'Did you see that cloud?', 'Your colours look extra bright today.', 'Want to race to the flower patch?', 'I found a very round pebble.',
  'The grass feels like a soft blanket.', 'Do you think clouds taste fluffy?', 'I heard a tiny bird singing.', 'You are my favourite meadow buddy.',
  'I bet I can hop over that leaf.', 'The sunshine is tickling my nose.', 'Have you tried the blue flowers?', 'I saved you the best sunny spot.',
  'What is your favourite snack?', 'I dreamed about a giant carrot.', 'Your little feet make funny sounds.', 'Let us count the butterflies.',
  'I think the pond is making bubbles.', 'I like hanging out with you.', 'Maybe we can build a leaf fort.', 'The wind smells like fresh berries.',
  'I saw something sparkle in the grass.', 'Do you know any silly songs?', 'I am practising my big jump.', 'You have a very nice smile.',
  'I wish every day was meadow day.', 'That mushroom looks like a tiny house.', 'Can we have a picnic later?', 'I found a leaf shaped like a heart.',
  'The clouds are having a parade.', 'I think we should explore over there.', 'Your laugh makes me wiggle.', 'I could nap here forever.',
  'Did you hear that little chirp?', 'I wonder what is beyond the hill.', 'The flowers are waving at us.', 'I am feeling extra bouncy today.',
  'You make a great adventure partner.', 'The pond looks like a mirror.', 'I bet the butterflies know secrets.', 'This patch of grass is perfect.',
  'I found a very tiny stick.', 'Should we make up a dance?', 'My tummy is doing happy flips.', 'I like your new little wiggle.',
  'That breeze feels lovely.', 'Do you think snails have races?', 'I am going to say hello to that bee.', 'The hill looks smaller from here.',
  'I have a joke about toast.', 'What a lovely day to be little.', 'I wonder where the rainbow ends.', 'You are really good at exploring.',
  'I found the perfect nap spot.', 'Let us make friends with that butterfly.', 'I think the flowers need a name.', 'My feet are ready for an adventure.',
  'I like the sound of the breeze.', 'Have you ever chased your own shadow?', 'I bet we can find four clovers.', 'You are a very good listener.',
  'I saw a beetle wearing a leaf hat.', 'The sun is giving us a warm hug.', 'Let us make a secret handshake.', 'I think the meadow is smiling.',
  'Would you like to share my berry?', 'That little cloud looks like a fish.', 'I feel brave when you are near.', 'I want to learn a new trick.',
  'I found a pebble with stripes.', 'Maybe the trees are telling stories.', 'Your happy wiggle is contagious.', 'I wonder if flowers get sleepy.',
  'I heard the grass whisper hello.', 'Let us make a tiny parade.', 'This is the best place to play.', 'I could use a little snack break.',
  'Do you want to see my silly face?', 'I think that bird is our neighbour.', 'I am going to hop in a circle.', 'The whole meadow smells wonderful.',
  'You always find the coolest things.', 'I wish I had a little hat.', 'The sunlight makes everything glow.', 'Can we play hide and seek?',
  'I think I spotted a ladybug.', 'You make every day more fun.', 'I am saving this flower for you.', 'The path looks like a wiggly noodle.',
  'I wonder what stars look like up close.', 'I like being part of this team.', 'I just had the funniest thought.', 'Your giggle made me giggle too.',
  'I am going to explore that bush.', 'There is room for one more friend.', 'The clouds are moving so slowly.', 'I found a secret patch of clover.',
  'I think we should celebrate today.', 'Would you like to sit in the sun?', 'I have a new hop to show you.', 'That breeze ruffled my leaves.',
  'I bet the pond has tiny fish.', 'You are a top-notch buddy.', 'I wonder what snack grows on trees.', 'Let us wave to the next creature.',
  'I saw a butterfly doing flips.', 'This grass is softer than a pillow.', 'We should explore together more often.', 'I am happy you are here.',
  'I have a very important question.', 'Can you do a tiny spin?', 'The little flowers smell sweet.', 'I think I heard a friendly frog.',
  'Let us make today an adventure.', 'You are looking wonderfully cheerful.', 'I found a spot with extra sunshine.', 'Maybe we can visit the pond next.',
  'I want to race a rolling acorn.', 'Your company makes the meadow brighter.', 'I found a tiny trail through the clover.', 'Let us share this sunny afternoon.'
];
let chatDeck = shuffle(CHAT_LINES);
function nextChat() { if (!chatDeck.length) chatDeck = shuffle(CHAT_LINES); return chatDeck.pop(); }
function sayInMeadow(id, text) {
  const node = $(`[data-mon-id="${CSS.escape(id)}"] .meadow-mon-chat`);
  if (!node) return;
  node.textContent = text;
  node.classList.remove('hidden');
  setTimeout(() => node.classList.add('hidden'), 4300);
  const mon = byId(id);
  if (mon) addChatLine(mon, text);
}
function addChatLine(mon, text) {
  const node = document.createElement('div');
  node.className = 'chat-line';
  node.innerHTML = `${monImage(mon.species)}<p><b>${escapeHTML(monData(mon).name)}:</b> ${escapeHTML(text)}</p>`;
  const box = $('#meadow-chat');
  const empty = box.querySelector('.empty-note');
  if (empty) empty.remove();
  box.prepend(node);
  while (box.children.length > 5) box.lastElementChild.remove();
}
setInterval(() => {
  if (state.view !== 'meadow' || state.meadow.length === 0 || state.drag) return;
  const picked = state.meadow[Math.floor(Math.random()*state.meadow.length)];
  const line = nextChat();
  sayInMeadow(picked.id, line);
  // Only occasionally gets a reply; at most two bubbles per chat moment.
  if (state.meadow.length > 1 && Math.random() < 0.32) {
    const others = state.meadow.filter(item => item.id !== picked.id);
    const replyMon = others[Math.floor(Math.random()*others.length)];
    setTimeout(() => sayInMeadow(replyMon.id, nextChat()), 2800);
  }
}, 34000);
setInterval(() => {
  if (state.view !== 'meadow' || !state.meadow.length || state.drag) return;
  const picked = state.meadow[Math.floor(Math.random()*state.meadow.length)];
  const nextX = clamp(picked.x + (Math.random()-.5)*24, 7, 93);
  const nextY = clamp(picked.y + (Math.random()-.5)*17, 31, 86);
  moveMonVisual(picked.id, nextX, nextY);
}, 6200);

// Fusion UI. Only discovered combinations are listed; the true recipe table is server-side.
function renderFusionPicker() {
  $('#fusion-picker-grid').innerHTML = state.mons.map(mon => {
    const data = monData(mon);
    const selected = state.fusionSelection.includes(mon.id);
    return `<button class="pick-mon ${selected?'selected':''}" type="button" data-fusion-pick="${mon.id}">${monImage(mon.species)}<b>${escapeHTML(data.name)}</b><small>${selected?'SELECTED':'SELECT MON'}</small></button>`;
  }).join('') || '<p class="empty-note">Collect some Mon before trying Fusion.</p>';
  $('#fusion-selected-count').textContent = `${state.fusionSelection.length} / 2 selected`;
  $('#fuse-button').disabled = state.fusionSelection.length !== 2;
}
function renderFusionSlots() {
  ['a','b'].forEach((slot,index) => {
    const id = state.fusionSelection[index];
    const mon = id ? byId(id) : null;
    const button = $(`#fusion-slot-${slot}`);
    button.classList.toggle('selected', Boolean(mon));
    button.innerHTML = mon
      ? `${monImage(mon.species)}<b>${escapeHTML(monData(mon).name)}</b><small>Selected Mon</small>`
      : `<span class="slot-plus">＋</span><b>${index===0?'First Mon':'Second Mon'}</b><small>Select from your collection</small>`;
  });
  renderFusionPicker();
}
function renderDiscoveries() {
  const list = $('#discovery-list');
  if (!state.discoveries.length) {
    list.innerHTML = '<p class="empty-note">You have not discovered a fusion yet. Experiment with pairs from your collection.</p>';
    return;
  }
  list.innerHTML = state.discoveries.map(discovery => {
    const data = MONS[discovery.species] || MONS[discovery.id];
    if (!data) return '';
    const parents = (discovery.parents || []).map(key => MONS[key]?.name || key).join(' + ');
    return `<div class="discovery-card">${monImage(data.number==='101'?'robomon':discovery.species)}<div><b>${escapeHTML(data.name)}</b><small>${escapeHTML(parents || 'Discovery unlocked')}</small></div></div>`;
  }).join('');
}
function toggleFusionPick(id) {
  if (state.fusionSelection.includes(id)) state.fusionSelection = state.fusionSelection.filter(value => value !== id);
  else {
    if (state.fusionSelection.length >= 2) return toast('Choose only two Mon at a time.');
    state.fusionSelection.push(id);
  }
  renderFusionSlots();
}
async function attemptFusion() {
  if (state.fusionSelection.length !== 2) return;
  const [first,second] = state.fusionSelection;
  const a = byId(first), b = byId(second);
  if (!a || !b) return toast('One of those Mon is no longer in your collection.', 'error');
  const confirmed = window.confirm(`Fuse ${monData(a).name} with ${monData(b).name}? Both Mon will be used up if a new fusion is discovered.`);
  if (!confirmed) return;
  $('#fuse-button').disabled = true;
  $('#fusion-message').textContent = 'The fusion station is humming...';
  try {
    const result = await api.fuseMonsters({ monIds:[first,second] });
    state.fusionSelection = [];
    if (!result.data?.discovered) {
      $('#fusion-message').textContent = 'Nothing happened this time. The two Mon were returned safely to your collection.';
      toast('No fusion discovered. Try another pair.');
    } else {
      $('#fusion-message').textContent = `Discovery! You created ${MONS[result.data.species]?.name || 'a new Mon'}.`;
      openFusionResult(result.data);
    }
    renderFusionSlots();
    renderDiscoveries();
  } catch (error) {
    console.error(error);
    $('#fusion-message').textContent = error.message || 'Fusion failed.';
    toast(`Fusion failed: ${error.message}`, 'error');
  } finally {
    $('#fuse-button').disabled = state.fusionSelection.length !== 2;
  }
}
function openFusionResult(result) {
  const data = MONS[result.species];
  if (!data) return;
  $('#modal-content').innerHTML = `<p class="modal-eyebrow">NEW FUSION DISCOVERED</p><div class="modal-art" style="background:${data.color}">${monImage(result.species)}</div><h2 id="modal-title">${escapeHTML(data.name)}!</h2><p>You discovered a brand-new Mon. The discovery has been saved to your account.</p><div class="modal-stats"><div class="modal-stat"><b>${data.hp}</b><small>HP</small></div><div class="modal-stat"><b>${data.power}</b><small>POWER</small></div><div class="modal-stat"><b>${data.guard}</b><small>GUARD</small></div></div><button class="primary-button modal-wide" id="modal-done" type="button">Awesome!</button>`;
  showModal();
}

// Battle lobby and server-authoritative bot battles.
function renderBattleTeam() {
  $('#battle-team-count').textContent = `${state.battleSelection.length} / 3`;
  $('#battle-team-grid').innerHTML = state.mons.map(mon => {
    const data = monData(mon);
    const selected = state.battleSelection.includes(mon.id);
    return `<button class="battle-pick ${selected?'selected':''}" type="button" data-battle-pick="${mon.id}">${monImage(mon.species)}<b>${escapeHTML(data.name)}</b><small>${selected?'IN TEAM':'ADD TO TEAM'}</small></button>`;
  }).join('') || '<p class="empty-note">You need at least one Mon to battle.</p>';
}
function toggleBattlePick(id) {
  if (state.battleSelection.includes(id)) state.battleSelection = state.battleSelection.filter(value => value !== id);
  else if (state.battleSelection.length < 3) state.battleSelection.push(id);
  else return toast('Your battle party can have up to 3 Mon.');
  renderBattleTeam();
}
async function startBattle(difficulty) {
  if (state.battleSelection.length < 1) return toast('Select at least one Mon for your team.');
  $$('[data-difficulty]').forEach(button => button.disabled = true);
  try {
    const result = await api.startBotBattle({ difficulty, monIds:state.battleSelection });
    state.battle = result.data;
    $('#battle-lobby').classList.add('hidden');
    $('#battle-arena').classList.remove('hidden');
    renderBattle();
  } catch (error) {
    console.error(error);
    toast(`Could not start battle: ${error.message}`, 'error');
  } finally {
    $$('[data-difficulty]').forEach(button => button.disabled = false);
  }
}
function renderBattle() {
  const battle = state.battle;
  if (!battle) return;
  $('#battle-difficulty-label').textContent = `${battle.difficulty.toUpperCase()} BOT BATTLE`;
  $('#battle-turn-label').textContent = `TURN ${battle.turn || 1}`;
  $('#bot-trainer-name').textContent = battle.botTrainer || 'BOT TRAINER';
  const player = battle.playerTeam?.[battle.playerIndex];
  const enemy = battle.botTeam?.[battle.botIndex];
  const playerBox = $('#player-active-mon');
  const enemyBox = $('#enemy-active-mon');
  if (player) {
    playerBox.innerHTML = monImage(player.species);
    $('#player-active-name').textContent = player.name;
    $('#player-hp-fill').style.width = `${Math.max(0,player.hp/player.maxHp*100)}%`;
    $('#player-hp-label').textContent = `${Math.max(0,player.hp)} / ${player.maxHp} HP`;
  } else {
    playerBox.innerHTML = '';
    $('#player-active-name').textContent = 'No Mon left';
    $('#player-hp-fill').style.width = '0%';
    $('#player-hp-label').textContent = '0 HP';
  }
  if (enemy) {
    enemyBox.innerHTML = monImage(enemy.species);
    $('#enemy-active-name').textContent = enemy.name;
    $('#enemy-hp-fill').style.width = `${Math.max(0,enemy.hp/enemy.maxHp*100)}%`;
    $('#enemy-hp-label').textContent = `${Math.max(0,enemy.hp)} / ${enemy.maxHp} HP`;
  } else {
    enemyBox.innerHTML = '';
    $('#enemy-active-name').textContent = 'Defeated';
    $('#enemy-hp-fill').style.width = '0%';
    $('#enemy-hp-label').textContent = '0 HP';
  }
  $('#battle-log').textContent = battle.lastMessage || 'Choose Attack to take your turn.';
  $('#battle-attack').disabled = state.battleBusy || battle.status !== 'active';
  $('#battle-attack').textContent = battle.status === 'won' ? 'Victory!' : battle.status === 'lost' ? 'Defeated' : state.battleBusy ? 'Battling...' : '⚔ Attack';
  $('#battle-back').textContent = battle.status === 'active' ? 'Forfeit & leave' : 'Back to lobby';
  if (battle.status === 'won' || battle.status === 'lost') {
    $('#battle-log').textContent = battle.status === 'won'
      ? `Victory! You earned ${battle.reward} iron bolt${battle.reward===1?'':'s'}.`
      : 'Your team was defeated. Train your Mon and try again.';
  }
}
async function takeBattleTurn() {
  if (!state.battle || state.battle.status !== 'active' || state.battleBusy) return;
  state.battleBusy = true;
  renderBattle();
  try {
    const result = await api.battleTurn({ battleId:state.battle.battleId });
    state.battle = result.data.battle;
    if (result.data.rewardGranted) {
      toast(`Victory! +${result.data.rewardGranted} iron bolt${result.data.rewardGranted===1?'':'s'}.`);
    }
  } catch (error) {
    console.error(error);
    toast(`Battle action failed: ${error.message}`, 'error');
  } finally {
    state.battleBusy = false;
    renderBattle();
    renderAccount();
  }
}
function leaveBattle() {
  if (state.battle?.status === 'active' && !window.confirm('Leave this battle? It will count as a forfeit.')) return;
  state.battle = null;
  $('#battle-arena').classList.add('hidden');
  $('#battle-lobby').classList.remove('hidden');
  renderBattleTeam();
}
async function openRoboPack() {
  $('#open-robopack').disabled = true;
  try {
    const result = await api.openRoboPack();
    openRoboPackResult(result.data);
    renderAccount();
  } catch (error) {
    console.error(error);
    toast(`Could not open RoboPack: ${error.message}`, 'error');
  } finally {
    renderBoltProgress();
  }
}
function openRoboPackResult(result) {
  const data = MONS[result.species] || MONS.robomon;
  $('#modal-content').innerHTML = `<p class="modal-eyebrow">ROBO PACK OPENED</p><div class="modal-art" style="background:${data.color}">${monImage(result.species)}</div><h2 id="modal-title">${escapeHTML(data.name)}!</h2><p>A new robotic friend has joined your collection. Its details are saved to your account.</p><div class="modal-stats"><div class="modal-stat"><b>${data.hp}</b><small>HP</small></div><div class="modal-stat"><b>${data.power}</b><small>POWER</small></div><div class="modal-stat"><b>${data.guard}</b><small>GUARD</small></div></div><button class="primary-button modal-wide" id="modal-done" type="button">Welcome aboard!</button>`;
  showModal();
}

function showModal() { $('#modal-backdrop').classList.remove('hidden'); }
function closeModal() { $('#modal-backdrop').classList.add('hidden'); }

// Click delegation survives all dynamic list re-renders.
document.addEventListener('click', async event => {
  if (Date.now() < state.suppressClickUntil) return;
  const nav = event.target.closest('[data-view]');
  if (nav) { switchView(nav.dataset.view); return; }
  const remove = event.target.closest('[data-remove]');
  if (remove) { event.stopPropagation(); await removeFromMeadow(remove.dataset.remove); return; }
  const meadowMon = event.target.closest('[data-mon-id]');
  if (meadowMon) { const mon = byId(meadowMon.dataset.monId); if (mon) showMonModal(mon); return; }
  const card = event.target.closest('[data-card-mon-id]');
  if (card) { const mon = byId(card.dataset.cardMonId); if (mon) showMonModal(mon); return; }
  const roster = event.target.closest('[data-roster-id]');
  if (roster) { await placeMon(roster.dataset.rosterId); return; }
  const fusionPick = event.target.closest('[data-fusion-pick]');
  if (fusionPick) { toggleFusionPick(fusionPick.dataset.fusionPick); return; }
  const battlePick = event.target.closest('[data-battle-pick]');
  if (battlePick) { toggleBattlePick(battlePick.dataset.battlePick); return; }
  const difficulty = event.target.closest('[data-difficulty]');
  if (difficulty) { await startBattle(difficulty.dataset.difficulty); return; }
  const filter = event.target.closest('[data-filter]');
  if (filter) { state.filter = filter.dataset.filter; renderCollection(); return; }
  if (event.target.closest('#fuse-button')) { await attemptFusion(); return; }
  if (event.target.closest('#clear-fusion')) { state.fusionSelection=[]; $('#fusion-message').textContent='Pick two different Mon to experiment. No recipe hints are shown.'; renderFusionSlots(); return; }
  if (event.target.closest('#battle-attack')) { await takeBattleTurn(); return; }
  if (event.target.closest('#battle-back')) { leaveBattle(); return; }
  if (event.target.closest('#open-robopack')) { await openRoboPack(); return; }
  if (event.target.closest('#modal-close') || event.target.closest('#modal-done')) { closeModal(); return; }
  if (event.target.id === 'modal-backdrop') closeModal();
});
$('#collection-sort').addEventListener('change', event => { state.sort = event.target.value; renderCollection(); });

function showMonModal(mon) {
  const data = monData(mon);
  const inMeadow = state.meadow.some(item => item.id === mon.id);
  $('#modal-content').innerHTML = `<p class="modal-eyebrow">COLLECTOMON · MON #${escapeHTML(data.number)}</p><div class="modal-art" style="background:${data.color}">${monImage(mon.species)}</div><h2 id="modal-title">${escapeHTML(data.name)}</h2><p>${escapeHTML(data.desc)}</p><div class="modal-stats"><div class="modal-stat"><b>${data.hp}</b><small>HP</small></div><div class="modal-stat"><b>${data.power}</b><small>POWER</small></div><div class="modal-stat"><b>${data.guard}</b><small>GUARD</small></div></div><div class="modal-actions"><button class="soft-button" id="modal-meadow" type="button" ${inMeadow?'disabled':''}>${inMeadow?'Already in Meadow':'Add to Meadow'}</button><button class="primary-button" id="modal-done" type="button">Close</button></div>`;
  showModal();
  $('#modal-meadow').addEventListener('click', async () => {
    const placed = await placeMon(mon.id);
    if (placed) closeModal();
  });
}

// Detail card dragging and list renderers.
function renderCollection() {
  const filter = state.filter;
  let mons = [...state.mons];
  if (filter !== 'all') mons = mons.filter(mon => monData(mon).group === filter);
  if (state.sort === 'name') mons.sort((a,b) => monData(a).name.localeCompare(monData(b).name));
  else if (state.sort === 'power') mons.sort((a,b) => monData(b).power - monData(a).power);
  else mons.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  $('#collection-count').textContent = state.mons.length;
  $('#collection-grid').innerHTML = mons.length ? mons.map(mon => {
    const data = monData(mon);
    return `<button class="mon-card" type="button" draggable="true" data-card-mon-id="${mon.id}" aria-label="${escapeHTML(data.name)} card. Drag to meadow or tap for details"><div class="mon-card-art" style="--mon-bg:${data.color}"><span class="rarity-pill">${data.rarity.toUpperCase()}</span><span class="card-number">#${data.number}</span>${monImage(mon.species)}</div><div class="mon-card-body"><div class="mon-card-title"><b>${escapeHTML(data.name)}</b><span>${escapeHTML(data.type)}</span></div><p class="mon-card-desc">${escapeHTML(data.desc)}</p><div class="mon-card-stats"><span>♥ ${data.hp}</span><span>⚔ ${data.power}</span><span>⬟ ${data.guard}</span></div><div class="card-drag-note">DRAG TO MEADOW</div></div></button>`;
  }).join('') : '<div class="no-cards">No Mon in this category yet.</div>';
  $$('.filter-tab').forEach(button => button.classList.toggle('active', button.dataset.filter === state.filter));
}

// The backend owns all currency and creature grants; browser code only requests actions.
$('#account-button').addEventListener('click', () => {
  const email = state.user?.email || 'Google account';
  toast(`Signed in as ${email}`);
});
$('#modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
  if ((event.key === 'Enter' || event.key === ' ') && document.activeElement?.matches?.('[data-mon-id]')) {
    event.preventDefault();
    const mon = byId(document.activeElement.dataset.monId);
    if (mon) showMonModal(mon);
  }
});
setFavicon();
