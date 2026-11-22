/* Collectomon prototype — in-memory only. Firestore can be added later. */
(() => {
  'use strict';

  const monsterDex = {
    butterstick: { key:'butterstick', name:'ButterStick', emoji:'🧈', type:'Snack', group:'snack', rarity:'COMMON', hp:42, power:18, guard:25, color:'linear-gradient(145deg,#ffe58e,#f5bd46)', description:'A soft little butter block with a sunny smile. It loves warm windowsills and giving hugs.', quote:'I am on a roll!', number:'001' },
    toastling: { key:'toastling', name:'Toastling', emoji:'🍞', type:'Snack', group:'snack', rarity:'COMMON', hp:35, power:25, guard:17, color:'linear-gradient(145deg,#ffd09a,#eb9857)', description:'A crispy cuddle-bug. Toastling leaves tiny crumbs wherever its happy feet go.', quote:'Crumb and get it!', number:'002' },
    jellyfin: { key:'jellyfin', name:'Jellyfin', emoji:'🪼', type:'Ocean', group:'nature', rarity:'UNCOMMON', hp:51, power:21, guard:28, color:'linear-gradient(145deg,#d9d7ff,#9e9bed)', description:'A floaty little glow-friend. Jellyfin makes the meadow feel like a dreamy aquarium.', quote:'Just going with the flow.', number:'003' },
    mushroomo: { key:'mushroomo', name:'Mushroomo', emoji:'🍄', type:'Nature', group:'nature', rarity:'UNCOMMON', hp:47, power:23, guard:27, color:'linear-gradient(145deg,#ffc8bf,#e77f7f)', description:'A shy forest wanderer with a spotty cap and a talent for growing tiny flowers.', quote:'A little growth goes a long way.', number:'004' },
    butterlobster: { key:'butterlobster', name:'ButterLobster', emoji:'🦞', type:'Fusion', group:'snack', rarity:'RARE', hp:64, power:36, guard:31, color:'linear-gradient(145deg,#ffdfa0,#ef8969)', description:'A sizzling little fusion born in a pan. ButterLobster is buttery, bouncy, and surprisingly brave.', quote:'Shell yeah, butter buddy!', number:'005' },
    pepperpup: { key:'pepperpup', name:'Pepperpup', emoji:'🌶️', type:'Spicy', group:'snack', rarity:'RARE', hp:39, power:34, guard:18, color:'linear-gradient(145deg,#ffb5a3,#e9635e)', description:'A tiny hothead with a huge heart. Pepperpup runs fast and sneezes little sparks.', quote:'Too hot to trot!', number:'006' },
    mossmallow: { key:'mossmallow', name:'Mossmallow', emoji:'🌱', type:'Nature', group:'nature', rarity:'RARE', hp:58, power:19, guard:36, color:'linear-gradient(145deg,#d9f1a7,#84c978)', description:'A fluffy sprout that makes friends with absolutely everyone. It smells faintly of fresh rain.', quote:'Rooting for you!', number:'007' }
  };

  const itemDex = {
    pan: { name:'Little Pan', emoji:'🍳', detail:'A sturdy mini cooking pan.' },
    butter: { name:'Butter', emoji:'🧈', detail:'A creamy cube of goodness.' },
    lobster: { name:'Lobster', emoji:'🦞', detail:'A fresh little sea snack.' },
    berry: { name:'Berry', emoji:'🫐', detail:'A sweet meadow berry.' }
  };

  // 120 different lines. Each is used once before the chat deck is shuffled again.
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

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const state = {
    view: 'home', crumbs: 75, nextId: 4, nextNumber: 8,
    monsters: [ { id:1, key:'butterstick', obtained:1 }, { id:2, key:'toastling', obtained:2 }, { id:3, key:'jellyfin', obtained:3 } ],
    meadow: [1,2],
    positions: { 1:{x:31,y:67}, 2:{x:62,y:70} },
    inventory: { pan:1, butter:1, lobster:1, berry:0 },
    panPlaced: false, panContents: [], cooking: false,
    filter: 'all', sort: 'newest', chatDeck: [], chatTimers: new Map(),
    activity: [
      { key:'butterstick', text:'found a sunny spot to nap.', time:'just now' },
      { key:'toastling', text:'is making tiny happy hops.', time:'a moment ago' }
    ],
    drag: null, suppressClickUntil: 0
  };

  const getMonster = id => state.monsters.find(monster => monster.id === Number(id));
  const definition = monster => monsterDex[monster.key];
  const totalItems = () => Object.values(state.inventory).reduce((sum, count) => sum + count, 0);

  function faceArt(key, extraClass = '') {
    const data = monsterDex[key];
    return `<div class="monster-art ${extraClass}" style="background:${data.color}"><span class="monster-emoji">${data.emoji}</span><span class="monster-face"><i class="eye"></i><i class="eye"></i><i class="mouth"></i></span></div>`;
  }

  function updateHeader() {
    $('#crumb-count').textContent = state.crumbs;
    $('#nav-card-count').textContent = state.monsters.length;
    $('#collection-total').textContent = `${state.monsters.length} card${state.monsters.length === 1 ? '' : 's'}`;
    $('#filter-all-count').textContent = state.monsters.length;
    $('#basket-count').textContent = `${totalItems()} item${totalItems() === 1 ? '' : 's'}`;
    $('#habitat-occupancy').textContent = state.meadow.length;
  }

  function switchView(view) {
    if (!['home','collection','kitchen'].includes(view)) return;
    state.view = view;
    $$('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
    $$('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    $('#page-name').textContent = ({ home:'MY HOME', collection:'COLLECTION', kitchen:'KITCHEN LAB' })[view];
    if (view === 'home') { renderMeadow(); renderRoster(); renderActivity(); }
    if (view === 'collection') renderCollection();
    if (view === 'kitchen') renderKitchen();
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function renderMeadow() {
    const root = $('#meadow-creatures');
    root.innerHTML = state.meadow.map(id => {
      const monster = getMonster(id);
      if (!monster) return '';
      const data = definition(monster);
      const pos = state.positions[id] || { x:50, y:65 };
      return `<div class="meadow-monster" role="button" tabindex="0" data-meadow-id="${id}" aria-label="${escapeHTML(data.name)}. Drag to move or select to view card" style="left:${pos.x}%;top:${pos.y}%;z-index:${Math.round(pos.y)+2}">
        <div class="meadow-pet-art" style="background:${data.color}"><span class="meadow-pet-emoji">${data.emoji}</span><span class="meadow-face"><i class="eye"></i><i class="eye"></i><i class="mouth"></i></span></div>
        <span class="meadow-name">${escapeHTML(data.name)}</span>
        <span class="meadow-speech hidden" aria-live="polite"></span>
        <button class="meadow-remove" type="button" data-remove-meadow="${id}" aria-label="Send ${escapeHTML(data.name)} home">×</button>
      </div>`;
    }).join('');
    $('#meadow-drop-hint').classList.toggle('hidden', state.meadow.length > 0);
    updateHeader();
  }

  function renderRoster() {
    $('#home-roster').innerHTML = state.monsters.slice(-8).reverse().map(monster => {
      const data = definition(monster);
      const visiting = state.meadow.includes(monster.id);
      return `<button class="roster-card" type="button" draggable="true" data-roster-id="${monster.id}" title="${visiting ? 'Already in the meadow' : 'Drag or tap to invite'}"><span class="roster-mini" style="background:${data.color}">${data.emoji}</span><span class="roster-copy"><b>${escapeHTML(data.name)}</b><small>${visiting ? 'Wandering outside' : 'Drag or tap to invite'}</small></span></button>`;
    }).join('') || '<div class="empty-collection">Your meadow crew will show up here.</div>';
  }

  function renderActivity() {
    $('#activity-feed').innerHTML = state.activity.slice(0,5).map(item => {
      const data = monsterDex[item.key] || monsterDex.butterstick;
      return `<div class="activity-item"><span class="activity-emoji">${data.emoji}</span><p><b>${escapeHTML(data.name)}</b> ${escapeHTML(item.text)}</p><time>${escapeHTML(item.time)}</time></div>`;
    }).join('');
  }

  function addActivity(key, text) {
    state.activity.unshift({ key, text, time:'just now' });
    state.activity = state.activity.slice(0,8);
    if (state.view === 'home') renderActivity();
  }

  function renderCollection() {
    updateHeader();
    let monsters = [...state.monsters];
    if (state.filter === 'snack' || state.filter === 'nature') monsters = monsters.filter(monster => monsterDex[monster.key].group === state.filter);
    if (state.sort === 'name') monsters.sort((a,b) => definition(a).name.localeCompare(definition(b).name));
    else if (state.sort === 'power') monsters.sort((a,b) => definition(b).power-definition(a).power);
    else monsters.sort((a,b) => b.obtained-a.obtained);
    $('#collection-grid').innerHTML = monsters.length ? monsters.map(renderCard).join('') : '<div class="empty-collection">No creatures in this category yet. Open a Mystery Pack to meet somebody new!</div>';
    $$('.filter-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.filter === state.filter));
    $('#sort-cards').value = state.sort;
  }

  function renderCard(monster) {
    const data = definition(monster);
    const visiting = state.meadow.includes(monster.id);
    return `<button class="monster-card" type="button" draggable="true" data-card-id="${monster.id}" aria-label="View ${escapeHTML(data.name)} card. Drag it to the meadow to invite it">
      <div class="card-art" style="background:${data.color}"><span class="card-rarity">${data.rarity}</span><span class="card-number">#${data.number}</span>${faceArt(monster.key)}</div>
      <div class="card-body"><div class="card-name-row"><span class="card-name">${escapeHTML(data.name)}</span><span class="card-type">${escapeHTML(data.type)}</span></div>
      <p class="card-description">${escapeHTML(data.description)}</p>
      <div class="card-stats"><span class="stat"><span>♥</span> ${data.hp} HP</span><span class="stat"><span>⚔</span> ${data.power} PWR</span><span class="stat"><span>⬟</span> ${data.guard} DEF</span></div>
      <span class="card-meadow-state">${visiting ? 'IN MEADOW' : 'DRAG TO MEADOW'}</span></div>
    </button>`;
  }

  function renderKitchen() {
    updateHeader();
    $('#pan-placeholder').classList.toggle('hidden', state.panPlaced);
    $('#pan-visual').classList.toggle('hidden', !state.panPlaced);
    $('#recipe-status').textContent = state.cooking ? 'COOKING...' : state.panContents.length ? 'INGREDIENTS ADDED' : state.panPlaced ? 'PAN IS READY' : 'WAITING FOR YOU';
    $('#pan-contents').innerHTML = state.panContents.length ? state.panContents.map(key => `<span title="${itemDex[key].name}">${itemDex[key].emoji}</span>`).join('') : '<span class="pan-empty-label">ready to cook</span>';
    $('#pan-label').textContent = state.panContents.length ? state.panContents.map(key => itemDex[key].name.toUpperCase()).join(' + ') : 'EMPTY PAN';
    const hasButter = state.panContents.includes('butter');
    const hasLobster = state.panContents.includes('lobster');
    if (!state.panPlaced) {
      $('#cooking-instructions').innerHTML = '<span class="instruction-number">01</span><p><b>First, set down your pan.</b><br>Use it from your item basket to start cooking.</p>';
      $('#cooking-actions').innerHTML = '<span class="inventory-note">Your cooking adventure starts with a pan.</span>';
    } else if (hasButter && hasLobster) {
      $('#cooking-instructions').innerHTML = '<span class="instruction-number">03</span><p><b>That smells amazing!</b><br>Both ingredients are in the pan. Cook them to discover a new creature.</p>';
      $('#cooking-actions').innerHTML = '<button class="action-button" type="button" id="cook-button">🍳 Cook ButterLobster</button><button class="action-button secondary" type="button" id="clear-pan-button">Clear pan</button>';
    } else {
      const next = hasButter ? 'lobster' : hasLobster ? 'butter' : 'butter and lobster';
      $('#cooking-instructions').innerHTML = `<span class="instruction-number">02</span><p><b>Add ${next} to the pan.</b><br>Tap ingredients in your item basket. The order does not matter!</p>`;
      $('#cooking-actions').innerHTML = `<button class="action-button" type="button" data-use-item="butter" ${state.inventory.butter < 1 || hasButter || state.cooking ? 'disabled' : ''}>🧈 Add butter</button><button class="action-button" type="button" data-use-item="lobster" ${state.inventory.lobster < 1 || hasLobster || state.cooking ? 'disabled' : ''}>🦞 Add lobster</button><button class="action-button secondary" type="button" id="clear-pan-button" ${state.panContents.length ? '' : 'disabled'}>Clear pan</button>`;
    }
    renderInventory();
  }

  function renderInventory() {
    const available = Object.keys(itemDex).filter(key => state.inventory[key] > 0);
    $('#inventory-list').innerHTML = available.length ? available.map(key => {
      const item = itemDex[key];
      const used = (key === 'butter' || key === 'lobster') && state.panContents.includes(key);
      const canUse = key === 'pan' ? !state.panPlaced : state.panPlaced && ['butter','lobster'].includes(key) && !used && !state.cooking;
      const action = key === 'pan' ? 'Place' : 'Add';
      return `<div class="inventory-item"><span class="inventory-emoji">${item.emoji}</span><span class="inventory-copy"><b>${item.name}</b><small>${item.detail}</small></span><span class="item-qty">×${state.inventory[key]}</span><button class="inventory-use" type="button" data-inventory-use="${key}" ${canUse ? '' : 'disabled'} aria-label="${action} ${item.name}">${key === 'pan' ? '↘' : '+'}</button></div>`;
    }).join('') : '<div class="inventory-empty">Your basket is empty. More supplies will arrive in a future update.</div>';
  }

  function useItem(key) {
    if (!itemDex[key] || state.inventory[key] < 1) return;
    if (key === 'pan') {
      if (state.panPlaced) return toast('Your pan is already on the counter.');
      state.inventory.pan--;
      state.panPlaced = true;
      addActivity('butterstick','is supervising the cooking.');
      toast('Your little pan is ready!');
      renderKitchen();
      return;
    }
    if (!state.panPlaced) return toast('Set down your pan first.');
    if (!['butter','lobster'].includes(key)) return toast('That item has no recipe here yet.');
    if (state.panContents.includes(key)) return toast(`${itemDex[key].name} is already in the pan.`);
    state.inventory[key]--;
    state.panContents.push(key);
    toast(`${itemDex[key].name} added to the pan!`);
    renderKitchen();
  }

  function clearPan() {
    if (state.cooking) return;
    state.panContents.forEach(key => state.inventory[key]++);
    state.panContents = [];
    toast('The ingredients are back in your basket.');
    renderKitchen();
  }

  function cookRecipe() {
    if (state.cooking || !state.panPlaced || !state.panContents.includes('butter') || !state.panContents.includes('lobster')) return;
    state.cooking = true;
    renderKitchen();
    window.setTimeout(() => {
      state.cooking = false;
      state.panContents = [];
      const monster = addMonster('butterlobster');
      $('#recipe-tag').classList.add('unlocked');
      addActivity('butterlobster','popped into existence with a tiny sizzle!');
      renderKitchen();
      renderCollection();
      openDiscoveryModal(monster);
    }, 900);
  }

  function addMonster(key) {
    const monster = { id:state.nextId++, key, obtained:state.nextNumber++ };
    state.monsters.push(monster);
    updateHeader();
    return monster;
  }

  function openPack() {
    if (state.crumbs < 35) return toast('You need 35 crumbs for a Mystery Pack.');
    state.crumbs -= 35;
    const pool = ['jellyfin','mushroomo','pepperpup','mossmallow','butterstick','toastling'];
    const found = Array.from({ length:3 }, () => addMonster(pool[Math.floor(Math.random()*pool.length)]));
    updateHeader();
    renderCollection();
    openPackModal(found);
  }

  function openPackModal(found) {
    $('#modal-content').innerHTML = `<div class="modal-eyebrow">A LITTLE SURPRISE</div><h2 id="modal-title" style="font-size:25px;margin:7px 0 5px">Pack opened!</h2><p class="modal-description">Three new friends have joined your collection. Give them a warm welcome!</p><div class="pack-pulls">${found.map(monster => { const data=definition(monster); return `<div class="pull-card"><div class="pull-art" style="background:${data.color}">${data.emoji}</div><b>${escapeHTML(data.name)}</b><small>${data.rarity}</small></div>`; }).join('')}</div><button class="primary-button modal-done" type="button" id="modal-done">Lovely! <span>OK</span></button>`;
    showModal();
  }

  function openDiscoveryModal(monster) {
    const data = definition(monster);
    $('#modal-content').innerHTML = `<div class="modal-eyebrow">RECIPE DISCOVERED</div><div class="modal-art" style="background:${data.color}">${faceArt(monster.key)}</div><div class="modal-title-row"><h2 id="modal-title">${data.name}!</h2><span class="modal-rarity">${data.rarity}</span></div><p class="modal-description">You mixed butter and lobster in your pan and made something amazing. ${data.description}</p><div class="modal-stats"><div class="modal-stat"><strong>${data.hp}</strong><small>HEALTH</small></div><div class="modal-stat"><strong>${data.power}</strong><small>POWER</small></div><div class="modal-stat"><strong>${data.guard}</strong><small>DEFENSE</small></div></div><div class="modal-action-row"><button class="action-button" type="button" id="place-discovery">Invite to meadow</button><button class="primary-button" type="button" id="modal-done">Amazing!</button></div><p class="modal-note">ButterLobster has been added to your collection.</p>`;
    showModal();
    $('#place-discovery').addEventListener('click', () => { addToMeadow(monster.id); closeModal(); switchView('home'); });
  }

  function showMonsterModal(monster) {
    const data = definition(monster);
    const visiting = state.meadow.includes(monster.id);
    $('#modal-content').innerHTML = `<div class="modal-eyebrow">COLLECTOMON CARD · #${data.number}</div><div class="modal-art" style="background:${data.color}">${faceArt(monster.key)}</div><div class="modal-title-row"><h2 id="modal-title">${escapeHTML(data.name)}</h2><span class="modal-rarity">${data.rarity}</span></div><p class="modal-description">${escapeHTML(data.description)}<br><i>“${escapeHTML(data.quote)}”</i></p><div class="modal-stats"><div class="modal-stat"><strong>${data.hp}</strong><small>HEALTH</small></div><div class="modal-stat"><strong>${data.power}</strong><small>POWER</small></div><div class="modal-stat"><strong>${data.guard}</strong><small>DEFENSE</small></div></div><div class="modal-action-row"><button class="action-button" type="button" id="modal-place" ${visiting ? 'disabled' : ''}>${visiting ? 'Already in meadow' : 'Invite to meadow'}</button><button class="primary-button" type="button" id="modal-done">Close</button></div>`;
    showModal();
    $('#modal-place').addEventListener('click', () => { if (addToMeadow(monster.id)) { closeModal(); switchView('home'); } });
  }

  function showModal() { $('#modal-backdrop').classList.remove('hidden'); }
  function closeModal() { $('#modal-backdrop').classList.add('hidden'); }

  function addToMeadow(id, x, y) {
    id = Number(id);
    if (!getMonster(id)) return false;
    if (state.meadow.includes(id)) {
      if (Number.isFinite(x) && Number.isFinite(y)) moveMeadowMonster(id,x,y);
      else toast('That creature is already wandering in the meadow.');
      return false;
    }
    state.meadow.push(id);
    state.positions[id] = { x:clamp(Number.isFinite(x) ? x : 15+Math.random()*70,8,92), y:clamp(Number.isFinite(y) ? y : 49+Math.random()*31,40,79) };
    renderMeadow();
    renderRoster();
    addActivity(getMonster(id).key,'joined the meadow. Go say hello!');
    toast(`${definition(getMonster(id)).name} joined the meadow!`);
    return true;
  }

  function removeFromMeadow(id) {
    id = Number(id);
    state.meadow = state.meadow.filter(value => value !== id);
    delete state.positions[id];
    const timer = state.chatTimers.get(id);
    if (timer) window.clearTimeout(timer);
    state.chatTimers.delete(id);
    renderMeadow();
    renderRoster();
    if (getMonster(id)) addActivity(getMonster(id).key,'went off to explore beyond the meadow.');
  }

  function moveMeadowMonster(id, x, y) {
    const node = $(`[data-meadow-id="${id}"]`);
    if (!node) return;
    const pos = { x:clamp(x,7,93), y:clamp(y,37,80) };
    state.positions[id] = pos;
    node.style.left = `${pos.x}%`;
    node.style.top = `${pos.y}%`;
    node.style.zIndex = String(Math.round(pos.y)+2);
  }

  function shuffle(array) {
    const copy = [...array];
    for (let i=copy.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; }
    return copy;
  }

  function nextChatLine() {
    if (!state.chatDeck.length) state.chatDeck = shuffle(CHAT_LINES);
    return state.chatDeck.pop();
  }

  function say(id, line, duration = 3300) {
    const node = $(`[data-meadow-id="${id}"] .meadow-speech`);
    if (!node) return;
    const oldTimer = state.chatTimers.get(id);
    if (oldTimer) window.clearTimeout(oldTimer);
    node.textContent = line;
    node.classList.remove('hidden');
    const timer = window.setTimeout(() => {
      node.classList.add('hidden');
      state.chatTimers.delete(id);
    }, duration);
    state.chatTimers.set(id,timer);
  }

  function startChatter() {
    window.setInterval(() => {
      if (state.view !== 'home' || state.meadow.length === 0) return;
      const ids = [...state.meadow];
      const speakerId = ids[Math.floor(Math.random()*ids.length)];
      const speaker = getMonster(speakerId);
      const line = nextChatLine();
      say(speakerId,line,3900);
      if (ids.length > 1) {
        const others = ids.filter(id => id !== speakerId);
        const listenerId = others[Math.floor(Math.random()*others.length)];
        const listener = getMonster(listenerId);
        addActivity(speaker.key,`chatted with ${definition(listener).name}: “${line}”`);
        window.setTimeout(() => {
          if (!state.meadow.includes(listenerId)) return;
          const reply = nextChatLine();
          say(listenerId,reply,3900);
          addActivity(listener.key,`replied: “${reply}”`);
        },1450);
      } else {
        addActivity(speaker.key,`said: “${line}”`);
      }
    },5600);
  }

  function startWandering() {
    window.setInterval(() => {
      if (state.view !== 'home' || state.meadow.length === 0 || state.drag) return;
      const id = state.meadow[Math.floor(Math.random()*state.meadow.length)];
      const current = state.positions[id] || { x:50,y:65 };
      let x = current.x + (Math.random()-.5)*36;
      let y = current.y + (Math.random()-.5)*19;
      x = clamp(x,9,91); y = clamp(y,43,79);
      moveMeadowMonster(id,x,y);
    },2100);
  }

  function cheerEveryone() {
    if (!state.meadow.length) return toast('Invite a creature into the meadow first!');
    state.meadow.forEach(id => say(id, ['You are the best!','Yay, meadow time!','That made me smile!','Best day ever!'][Math.floor(Math.random()*4)],2600));
    toast('Your creatures feel the love!');
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML = `<span>●</span>${escapeHTML(message)}`;
    $('#toast-region').append(node);
    window.setTimeout(() => node.remove(),2700);
  }

  // One click handler keeps controls working even when their HTML is re-rendered.
  document.addEventListener('click', event => {
    if (Date.now() < state.suppressClickUntil) return;
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { event.preventDefault(); switchView(viewButton.dataset.view); return; }
    const removeButton = event.target.closest('[data-remove-meadow]');
    if (removeButton) { event.stopPropagation(); removeFromMeadow(removeButton.dataset.removeMeadow); return; }
    const card = event.target.closest('[data-card-id]');
    if (card) { const monster=getMonster(card.dataset.cardId); if (monster) showMonsterModal(monster); return; }
    const meadowPet = event.target.closest('[data-meadow-id]');
    if (meadowPet) { const monster=getMonster(meadowPet.dataset.meadowId); if (monster) showMonsterModal(monster); return; }
    const roster = event.target.closest('[data-roster-id]');
    if (roster) { addToMeadow(roster.dataset.rosterId); return; }
    const filter = event.target.closest('[data-filter]');
    if (filter) { state.filter=filter.dataset.filter; renderCollection(); return; }
    const item = event.target.closest('[data-inventory-use], [data-use-item]');
    if (item) { useItem(item.dataset.inventoryUse || item.dataset.useItem); return; }
    if (event.target.closest('#open-pack-button')) { openPack(); return; }
    if (event.target.closest('#snack-button')) { cheerEveryone(); return; }
    if (event.target.closest('#clear-pan-button')) { clearPan(); return; }
    if (event.target.closest('#cook-button')) { cookRecipe(); return; }
    if (event.target.closest('#modal-close') || event.target.closest('#modal-done')) { closeModal(); return; }
    if (event.target.id === 'modal-backdrop') closeModal();
  });

  $('#sort-cards').addEventListener('change', event => { state.sort=event.target.value; renderCollection(); });

  // Desktop drag-and-drop from roster or collection onto any part of the meadow.
  document.addEventListener('dragstart', event => {
    const source = event.target.closest('[data-card-id], [data-roster-id]');
    if (!source || !event.dataTransfer) return;
    const id = source.dataset.cardId || source.dataset.rosterId;
    event.dataTransfer.setData('text/plain',id);
    event.dataTransfer.setData('application/x-collectomon-id',id);
    event.dataTransfer.effectAllowed = 'copy';
  });

  const meadow = $('#meadow-world');
  meadow.addEventListener('dragover', event => { event.preventDefault(); meadow.classList.add('drag-over'); if (event.dataTransfer) event.dataTransfer.dropEffect='copy'; });
  meadow.addEventListener('dragleave', event => { if (!meadow.contains(event.relatedTarget)) meadow.classList.remove('drag-over'); });
  meadow.addEventListener('drop', event => {
    event.preventDefault();
    meadow.classList.remove('drag-over');
    const id = Number(event.dataTransfer.getData('application/x-collectomon-id') || event.dataTransfer.getData('text/plain'));
    if (!id) return;
    const rect = meadow.getBoundingClientRect();
    const x = (event.clientX-rect.left)/rect.width*100;
    const y = (event.clientY-rect.top)/rect.height*100;
    if (state.meadow.includes(id)) { moveMeadowMonster(id,x,y); toast(`${definition(getMonster(id)).name} moved!`); }
    else addToMeadow(id,x,y);
  });

  // Pointer dragging also works with a mouse, touchscreen or pen for creatures already in the meadow.
  meadow.addEventListener('pointerdown', event => {
    const node = event.target.closest('[data-meadow-id]');
    if (!node || event.target.closest('[data-remove-meadow]')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const id = Number(node.dataset.meadowId);
    const pos = state.positions[id] || {x:50,y:65};
    state.drag = { id, node, startX:event.clientX, startY:event.clientY, startPos:{...pos}, moved:false };
    node.classList.add('dragging');
    try { node.setPointerCapture(event.pointerId); } catch (_) { /* Pointer capture is optional. */ }
  });

  meadow.addEventListener('pointermove', event => {
    const drag = state.drag;
    if (!drag) return;
    const rect = meadow.getBoundingClientRect();
    const dx = event.clientX-drag.startX;
    const dy = event.clientY-drag.startY;
    if (Math.abs(dx)+Math.abs(dy)>4) drag.moved=true;
    if (!drag.moved) return;
    moveMeadowMonster(drag.id,(event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);
    event.preventDefault();
  });

  function finishPointerDrag() {
    if (!state.drag) return;
    const drag = state.drag;
    drag.node.classList.remove('dragging');
    if (drag.moved) state.suppressClickUntil=Date.now()+350;
    state.drag=null;
  }
  meadow.addEventListener('pointerup',finishPointerDrag);
  meadow.addEventListener('pointercancel',finishPointerDrag);
  meadow.addEventListener('lostpointercapture',finishPointerDrag);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeModal();
    const focusedPet = document.activeElement.closest?.('[data-meadow-id]');
    if (focusedPet && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const monster=getMonster(focusedPet.dataset.meadowId);
      if (monster) showMonsterModal(monster);
    }
  });

  updateHeader();
  renderMeadow();
  renderRoster();
  renderActivity();
  renderCollection();
  renderKitchen();
  startWandering();
  startChatter();
})();
