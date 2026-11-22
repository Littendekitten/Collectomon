'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const admin = require('firebase-admin');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'kitacat-collectomon';
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'https://littendekitten.github.io')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${error.message}`);
    }
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_FILE
    || '/etc/secrets/firebase-service-account.json';
  const candidates = [configuredPath, path.resolve(process.cwd(), configuredPath)];
  const accountPath = candidates.find(candidate => fs.existsSync(candidate));
  if (!accountPath) {
    throw new Error(
      'Firebase service account file not found. Add firebase-service-account.json as a Render Secret File '
      + 'and set FIREBASE_SERVICE_ACCOUNT_FILE=/etc/secrets/firebase-service-account.json.'
    );
  }
  try {
    return JSON.parse(fs.readFileSync(accountPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read the Firebase service account JSON: ${error.message}`);
  }
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID
  });
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: { code: 'permission-denied', message: 'This website is not allowed to use the Collectomon API.' } });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.get('/', (_req, res) => res.status(200).send('Collectomon API is running.'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'collectomon-api' }));

function apiError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function requireGoogleUser(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) throw apiError(401, 'unauthenticated', 'Please sign in with Google again.');

    const decoded = await admin.auth().verifyIdToken(match[1], true);
    if (decoded.firebase?.sign_in_provider !== 'google.com') {
      throw apiError(403, 'permission-denied', 'Collectomon accepts Google accounts only.');
    }
    req.user = { uid: decoded.uid, name: decoded.name || '', picture: decoded.picture || '' };
    next();
  } catch (error) {
    next(error.status ? error : apiError(401, 'unauthenticated', 'Your sign-in token is invalid or expired. Please sign in again.'));
  }
}

function endpoint(handler) {
  return async (req, res, next) => {
    try {
      const data = await handler(req);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  };
}

app.use('/api', requireGoogleUser);

const MONS = {
  butterstick: { name: 'ButterStick', hp: 48, power: 17, guard: 26 },
  sparkit: { name: 'Sparkit', hp: 42, power: 29, guard: 17 },
  mossmallow: { name: 'Mossmallow', hp: 59, power: 18, guard: 30 },
  tidelet: { name: 'Tidelet', hp: 51, power: 23, guard: 24 },
  pebblit: { name: 'Pebblit', hp: 64, power: 18, guard: 35 },
  embercub: { name: 'EmberCub', hp: 45, power: 33, guard: 19 },
  voltbloom: { name: 'Voltbloom', hp: 67, power: 35, guard: 29 },
  reeforge: { name: 'Reeforge', hp: 82, power: 30, guard: 40 },
  cindervine: { name: 'Cindervine', hp: 64, power: 39, guard: 26 },
  butterbolt: { name: 'ButterBolt', hp: 60, power: 37, guard: 26 },
  robomon: { name: 'Robomon', hp: 62, power: 35, guard: 34 },
  robobit: { name: 'Robobit', hp: 55, power: 39, guard: 27 },
  robopup: { name: 'Robopup', hp: 70, power: 30, guard: 36 }
};

const STARTER_SPECIES = ['butterstick', 'sparkit', 'mossmallow', 'tidelet', 'pebblit', 'embercub'];
const FUSION_RECIPES = new Map([
  [['mossmallow', 'sparkit'].sort().join('+'), 'voltbloom'],
  [['pebblit', 'tidelet'].sort().join('+'), 'reeforge'],
  [['embercub', 'mossmallow'].sort().join('+'), 'cindervine'],
  [['butterstick', 'sparkit'].sort().join('+'), 'butterbolt']
]);
const BOT_TEAMS = {
  easy: { trainer: 'Rookie Rowan', reward: 1, species: ['butterstick', 'sparkit'] },
  normal: { trainer: 'Ranger Riley', reward: 2, species: ['tidelet', 'embercub', 'pebblit'] },
  hard: { trainer: 'Ace Nova', reward: 5, species: ['voltbloom', 'reeforge', 'cindervine'] }
};

function userRefs(uid) {
  const user = db.collection('users').doc(uid);
  return {
    user,
    mons: user.collection('mons'),
    discoveries: user.collection('discoveries'),
    battles: user.collection('battles'),
    meadow: user.collection('meadow')
  };
}

function createMon(species, id) {
  if (!MONS[species]) throw apiError(400, 'invalid-argument', 'Unknown monster species.');
  const mon = { species, createdAt: FieldValue.serverTimestamp() };
  return id ? { id, ...mon } : mon;
}

app.post('/api/initializePlayer', endpoint(async req => {
  const { user, mons, meadow } = userRefs(req.user.uid);
  const profileSnapshot = await user.get();
  const existingMonSnapshot = await mons.limit(1).get();
  const profile = {
    displayName: req.user.name,
    photoURL: req.user.picture,
    updatedAt: FieldValue.serverTimestamp()
  };
  if (!profileSnapshot.exists) {
    profile.coins = 0;
    profile.bolts = 0;
    profile.createdAt = FieldValue.serverTimestamp();
  }
  await user.set(profile, { merge: true });

  // New accounts receive the six base Mons so every published fusion recipe is discoverable.
  // Existing collections are never replaced or reset.
  if (existingMonSnapshot.empty) {
    const batch = db.batch();
    const starterIds = [];
    STARTER_SPECIES.forEach((species, index) => {
      const ref = mons.doc();
      starterIds.push(ref.id);
      batch.set(ref, createMon(species));
      if (index < 3) {
        const position = [
          { x: 31, y: 64 },
          { x: 50, y: 58 },
          { x: 69, y: 65 }
        ][index];
        batch.set(meadow.doc(ref.id), position);
      }
    });
    await batch.commit();
  }
  return { initialized: true };
}));

app.post('/api/fuseMonsters', endpoint(async req => {
  const monIds = req.body?.monIds;
  if (!Array.isArray(monIds) || monIds.length !== 2 || monIds[0] === monIds[1]
      || monIds.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(id))) {
    throw apiError(400, 'invalid-argument', 'Choose two different Mon from your collection.');
  }

  const { mons, discoveries } = userRefs(req.user.uid);
  const firstRef = mons.doc(monIds[0]);
  const secondRef = mons.doc(monIds[1]);
  const firstSnapshot = await firstRef.get();
  const secondSnapshot = await secondRef.get();
  if (!firstSnapshot.exists || !secondSnapshot.exists) throw apiError(404, 'not-found', 'One of those Mon is no longer in your collection.');

  const firstSpecies = firstSnapshot.data().species;
  const secondSpecies = secondSnapshot.data().species;
  const recipeKey = [firstSpecies, secondSpecies].sort().join('+');
  const fusionSpecies = FUSION_RECIPES.get(recipeKey);
  if (!fusionSpecies) return { discovered: false };

  const discoveryRef = discoveries.doc(fusionSpecies);
  const discoverySnapshot = await discoveryRef.get();
  if (discoverySnapshot.exists) return { discovered: false };

  const newMonRef = mons.doc();
  const result = await db.runTransaction(async tx => {
    const [a, b, discovery] = await Promise.all([
      tx.get(firstRef), tx.get(secondRef), tx.get(discoveryRef)
    ]);
    if (!a.exists || !b.exists) throw apiError(404, 'not-found', 'One of those Mon is no longer in your collection.');
    const currentRecipe = [a.data().species, b.data().species].sort().join('+');
    const species = FUSION_RECIPES.get(currentRecipe);
    if (!species || species !== fusionSpecies || discovery.exists) return { discovered: false };

    tx.delete(firstRef);
    tx.delete(secondRef);
    tx.create(newMonRef, createMon(species));
    tx.create(discoveryRef, {
      species,
      parents: [a.data().species, b.data().species],
      discoveredAt: FieldValue.serverTimestamp()
    });
    return { discovered: true, species };
  });
  return result;
}));

function combatant(species) {
  const mon = MONS[species];
  if (!mon) throw apiError(400, 'invalid-argument', 'A battle team contains an unknown monster.');
  return {
    species,
    name: mon.name,
    hp: mon.hp,
    maxHp: mon.hp,
    power: mon.power,
    guard: mon.guard
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function damage(attacker, defender) {
  return Math.max(5, Math.round(attacker.power + randomInt(-3, 5) - defender.guard * 0.22));
}

app.post('/api/startBotBattle', endpoint(async req => {
  const { difficulty, monIds } = req.body || {};
  if (!BOT_TEAMS[difficulty]) throw apiError(400, 'invalid-argument', 'Choose an Easy, Normal or Hard battle.');
  if (!Array.isArray(monIds) || monIds.length < 1 || monIds.length > 3
      || monIds.some(id => typeof id !== 'string') || new Set(monIds).size !== monIds.length) {
    throw apiError(400, 'invalid-argument', 'Choose between one and three different Mon for your team.');
  }

  const { mons, battles } = userRefs(req.user.uid);
  const snapshots = await Promise.all(monIds.map(id => mons.doc(id).get()));
  if (snapshots.some(snapshot => !snapshot.exists)) throw apiError(404, 'not-found', 'One of your selected Mon is no longer in your collection.');
  const playerTeam = snapshots.map(snapshot => combatant(snapshot.data().species));
  const botConfig = BOT_TEAMS[difficulty];
  const battle = {
    battleId: battles.doc().id,
    difficulty,
    botTrainer: botConfig.trainer,
    playerTeam,
    botTeam: botConfig.species.map(combatant),
    playerIndex: 0,
    botIndex: 0,
    status: 'active',
    turn: 1,
    reward: botConfig.reward,
    lastMessage: 'The battle is ready. Choose Attack to take your turn.',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  };
  const battleRef = battles.doc(battle.battleId);
  await battleRef.set(battle);
  return {
    battleId: battle.battleId,
    difficulty: battle.difficulty,
    botTrainer: battle.botTrainer,
    playerTeam: battle.playerTeam,
    botTeam: battle.botTeam,
    playerIndex: battle.playerIndex,
    botIndex: battle.botIndex,
    status: battle.status,
    turn: battle.turn,
    reward: battle.reward,
    lastMessage: battle.lastMessage
  };
}));

app.post('/api/battleTurn', endpoint(async req => {
  const battleId = req.body?.battleId;
  if (typeof battleId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(battleId)) {
    throw apiError(400, 'invalid-argument', 'A valid battle ID is required.');
  }
  const { user, battles } = userRefs(req.user.uid);
  const battleRef = battles.doc(battleId);
  const result = await db.runTransaction(async tx => {
    const [battleSnapshot, profileSnapshot] = await Promise.all([tx.get(battleRef), tx.get(user)]);
    if (!battleSnapshot.exists) throw apiError(404, 'not-found', 'This battle could not be found.');
    const battle = battleSnapshot.data();
    if (battle.status !== 'active') {
      return { battle: stripBattle(battle), rewardGranted: 0 };
    }
    if (!Array.isArray(battle.playerTeam) || !Array.isArray(battle.botTeam)
        || !battle.playerTeam[battle.playerIndex] || !battle.botTeam[battle.botIndex]) {
      throw apiError(500, 'internal', 'The saved battle state is incomplete.');
    }

    const player = battle.playerTeam[battle.playerIndex];
    const enemy = battle.botTeam[battle.botIndex];
    const playerDamage = damage(player, enemy);
    enemy.hp = Math.max(0, enemy.hp - playerDamage);
    let message = `${player.name} dealt ${playerDamage} damage to ${enemy.name}.`;

    if (enemy.hp <= 0) {
      battle.botIndex += 1;
      if (battle.botIndex >= battle.botTeam.length) {
        battle.status = 'won';
        message += ' The opposing team has been defeated!';
      } else {
        message += ` ${enemy.name} was defeated! ${battle.botTeam[battle.botIndex].name} enters the battle.`;
      }
    }

    if (battle.status === 'active') {
      const currentEnemy = battle.botTeam[battle.botIndex];
      const currentPlayer = battle.playerTeam[battle.playerIndex];
      const botDamage = damage(currentEnemy, currentPlayer);
      currentPlayer.hp = Math.max(0, currentPlayer.hp - botDamage);
      message += ` ${currentEnemy.name} dealt ${botDamage} damage to ${currentPlayer.name}.`;
      if (currentPlayer.hp <= 0) {
        battle.playerIndex += 1;
        if (battle.playerIndex >= battle.playerTeam.length) {
          battle.status = 'lost';
          message += ' Your team has been defeated.';
        } else {
          message += ` ${currentPlayer.name} was defeated! ${battle.playerTeam[battle.playerIndex].name} joins the battle.`;
        }
      }
    }

    battle.turn = Number(battle.turn || 0) + 1;
    battle.lastMessage = message;
    battle.updatedAt = FieldValue.serverTimestamp();
    let rewardGranted = 0;
    if (battle.status === 'won' && !battle.rewardPaid) {
      rewardGranted = Number(battle.reward || 0);
      battle.rewardPaid = true;
      const currentBolts = Number(profileSnapshot.data()?.bolts || 0);
      tx.set(user, { bolts: currentBolts + rewardGranted, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    tx.set(battleRef, battle, { merge: true });
    return { battle: stripBattle(battle), rewardGranted };
  });
  return result;
}));

function stripBattle(battle) {
  return {
    battleId: battle.battleId,
    difficulty: battle.difficulty,
    botTrainer: battle.botTrainer,
    playerTeam: battle.playerTeam,
    botTeam: battle.botTeam,
    playerIndex: battle.playerIndex,
    botIndex: battle.botIndex,
    status: battle.status,
    turn: battle.turn,
    reward: battle.reward,
    lastMessage: battle.lastMessage
  };
}

app.post('/api/openRoboPack', endpoint(async req => {
  const { user, mons } = userRefs(req.user.uid);
  const monRef = mons.doc();
  const robotSpecies = ['robomon', 'robobit', 'robopup'];
  const species = robotSpecies[randomInt(0, robotSpecies.length - 1)];
  await db.runTransaction(async tx => {
    const profileSnapshot = await tx.get(user);
    if (!profileSnapshot.exists) throw apiError(404, 'not-found', 'Your player profile was not found.');
    const bolts = Number(profileSnapshot.data().bolts || 0);
    if (bolts < 20) throw apiError(409, 'failed-precondition', 'You need 20 iron bolts to open a RoboPack.');
    tx.set(user, { bolts: bolts - 20, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.create(monRef, createMon(species));
  });
  return { species };
}));


app.use((error, _req, res, _next) => {
  const status = Number(error.status) || 500;
  const code = error.code || 'internal';
  const message = status >= 500 && code === 'internal'
    ? 'The Collectomon server encountered an error. Please try again.'
    : error.message || 'The request could not be completed.';
  if (status >= 500) console.error('API error:', error);
  res.status(status).json({ error: { code, message } });
});

const port = Number(process.env.PORT || 10000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Collectomon API listening on 0.0.0.0:${port}`);
});
