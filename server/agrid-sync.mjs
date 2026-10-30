import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.AGRID_BASE_URL?.replace(/\/$/, '');
const token = process.env.AGRID_API_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function required(value, name) {
  if (!value) throw new Error(name + ' is required.');
  return value;
}

function createSupabaseClient() {
  return createClient(required(supabaseUrl, 'SUPABASE_URL'), required(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readAll(query) {
  const rows = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) throw new Error('Gagal membaca data registri koperasi.');
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

export async function buildSnapshot(client = createSupabaseClient()) {
  const cooperatives = await readAll(
    client.from('cooperatives').select('id, coop_code, name, is_active').order('id')
  );
  if (cooperatives.length === 0) throw new Error('Snapshot kosong ditolak; tidak ada koperasi sumber.');
  if (cooperatives.length > 500) throw new Error('Batas AGR-ID adalah 500 koperasi per sinkronisasi.');

  const memberships = await readAll(
    client.from('memberships')
      .select('id, cooperative_id, member_number, status, users(id, member_id, full_name)')
      .order('id')
  );
  const byCooperative = new Map(cooperatives.map((coop) => [String(coop.id), []]));

  for (const membership of memberships) {
    const coopMembers = byCooperative.get(String(membership.cooperative_id));
    if (!coopMembers) continue;
    const user = Array.isArray(membership.users) ? membership.users[0] : membership.users;
    if (!user) continue;
    const number = String(membership.member_number || user.member_id || '').trim();
    const name = String(user.full_name || '').trim();
    if (!number || !name) continue;
    coopMembers.push({
      id: String(membership.id),
      number,
      name,
      active: membership.status === 'ACTIVE',
    });
  }

  const snapshot = {
    snapshot: true,
    cooperatives: cooperatives.map((coop) => ({
      id: String(coop.id),
      code: String(coop.coop_code || '').trim().toUpperCase(),
      name: String(coop.name || '').trim(),
      active: coop.is_active === true,
      members: byCooperative.get(String(coop.id)),
    })),
  };
  const seenCodes = new Set();
  for (const coop of snapshot.cooperatives) {
    if (!/^[A-Z0-9_-]{2,40}$/.test(coop.code) || !coop.name) {
      throw new Error('Kode atau nama koperasi tidak valid; sinkronisasi dibatalkan.');
    }
    if (seenCodes.has(coop.code)) throw new Error('Kode koperasi duplikat; sinkronisasi dibatalkan.');
    seenCodes.add(coop.code);
    if (coop.members.length > 10000) throw new Error('Batas AGR-ID adalah 10.000 anggota per koperasi.');
    const memberNumbers = new Set();
    for (const member of coop.members) {
      if (memberNumbers.has(member.number)) throw new Error('Nomor anggota duplikat di koperasi ' + coop.code + '.');
      memberNumbers.add(member.number);
    }
  }
  return snapshot;
}

export async function syncToAgrid() {
  required(baseUrl, 'AGRID_BASE_URL');
  required(token, 'AGRID_API_TOKEN');
  const localHost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl);
  if (!localHost && !baseUrl.startsWith('https://')) {
    throw new Error('AGRID_BASE_URL harus memakai HTTPS.');
  }

  const payload = await buildSnapshot();
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(new URL('/api/v1/cooperatives/sync', baseUrl), {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });
      if (response.ok) {
        const result = await response.json();
        console.info('Sinkronisasi AGR-ID selesai: ' + (result.cooperatives_synced ?? 0) + ' koperasi, ' + (result.members_synced ?? 0) + ' anggota.');
        return result;
      }
      if (response.status < 500) {
        throw new Error('AGR-ID menolak sinkronisasi (HTTP ' + response.status + '). Periksa URL, token, dan format data.');
      }
      lastError = new Error('AGR-ID sementara gagal (HTTP ' + response.status + ').');
    } catch (error) {
      lastError = error;
      if (error.message.includes('menolak sinkronisasi')) throw error;
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
  }
  throw lastError || new Error('Sinkronisasi AGR-ID gagal.');
}

if (process.argv[1]?.endsWith('agrid-sync.mjs')) {
  syncToAgrid().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
