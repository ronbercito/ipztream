#!/usr/bin/env node
const [baseArg, username, password] = process.argv.slice(2);

if (!baseArg || !username || !password) {
  console.error('Uso: node scripts/test-iptv-client.mjs <base-url> <usuario> <contraseña>');
  process.exit(2);
}

const base = baseArg.replace(/\/+$/, '');
const qs = new URLSearchParams({ username, password });

async function getJson(path) {
  const res = await fetch(`${base}${path}`, { redirect: 'follow' });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${text.slice(0, 160)}`);
  return JSON.parse(text);
}

async function getText(path) {
  const res = await fetch(`${base}${path}`, { redirect: 'follow' });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${text.slice(0, 160)}`);
  return { res, text };
}

try {
  const auth = await getJson(`/player_api.php?${qs}`);
  if (Number(auth?.user_info?.auth) !== 1) throw new Error('Autenticación IPTV rechazada.');
  console.log('OK autenticación');

  const categories = await getJson(`/player_api.php?${qs}&action=get_live_categories`);
  console.log(`OK categorías: ${Array.isArray(categories) ? categories.length : 0}`);

  const streams = await getJson(`/player_api.php?${qs}&action=get_live_streams`);
  if (!Array.isArray(streams) || !streams.length) throw new Error('No hay canales disponibles para este usuario.');
  console.log(`OK canales: ${streams.length}`);

  const playlist = await getText(`/get.php?${qs}&type=m3u_plus&output=m3u8`);
  if (!playlist.text.startsWith('#EXTM3U')) throw new Error('La playlist M3U no es válida.');
  console.log('OK playlist M3U');

  const xmltv = await getText(`/xmltv.php?${qs}`);
  if (!xmltv.text.includes('<tv') || !xmltv.text.includes('<channel')) throw new Error('XMLTV no devolvió canales válidos.');
  console.log('OK XMLTV / EPG');

  const streamId = streams[0].stream_id;
  if (!String(streamId).length) throw new Error('El primer canal no tiene stream_id público.');
  const liveUrl = `/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(streamId)}.m3u8`;
  const live = await getText(liveUrl);
  if (!live.text.includes('#EXTM3U')) throw new Error('El primer canal no devolvió un manifiesto HLS.');
  console.log(`OK reproducción HLS: ${streams[0].name}`);

  const tsUrl = `/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${encodeURIComponent(streamId)}.ts`;
  const ts = await fetch(`${base}${tsUrl}`, { redirect: 'manual' });
  if (![301, 302, 307, 308].includes(ts.status)) throw new Error(`Compatibilidad .ts inesperada: HTTP ${ts.status}`);
  console.log('OK compatibilidad URL .ts');

  console.log('IPZStream IPTV core: validación básica completada.');
} catch (error) {
  console.error(`FALLO: ${error.message}`);
  process.exit(1);
}
