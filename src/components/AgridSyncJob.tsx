import { AlertCircle, Clock, Database, ShieldCheck } from 'lucide-react';

export default function AgridSyncJob() {
  return (
    <section className="space-y-6 text-slate-200">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
          <Database className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Sinkronisasi AGR-ID</h2>
          <p className="mt-1 text-sm text-slate-400">Roster resmi koperasi ke marketplace</p>
        </div>
      </header>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <h3 className="font-semibold text-white">Jalankan dari server</h3>
            <p className="mt-1 text-sm text-slate-300">
              Sinkronisasi membaca database KOPERASI dan mengirim snapshot melalui HTTPS. Token dan service role key tidak boleh diletakkan di browser. Dashboard ini tidak menampilkan hasil sukses palsu; jalankan perintah berikut pada lingkungan server yang sudah dikonfigurasi.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-sm text-emerald-300"><code>npm run sync:agrid</code></pre>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-white"><ShieldCheck className="h-5 w-5 text-emerald-400" /><h3 className="font-semibold">Konfigurasi secret server</h3></div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><code>SUPABASE_URL</code> — URL proyek KOPERASI</li>
            <li><code>SUPABASE_SERVICE_ROLE_KEY</code> — hanya di secret manager server</li>
            <li><code>AGRID_BASE_URL</code> — URL deployment AGR-ID</li>
            <li><code>AGRID_API_TOKEN</code> — token integrasi berperan koperasi dari admin AGR-ID</li>
          </ul>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-white"><Clock className="h-5 w-5 text-blue-400" /><h3 className="font-semibold">Jadwal operasional</h3></div>
          <p className="text-sm text-slate-300">Untuk sinkron berkala, atur scheduler pada host server agar menjalankan perintah setiap hari pukul 02.00 WIB.</p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300"><code>0 2 * * * npm run sync:agrid</code></pre>
        </article>
      </div>

      <p className="text-xs text-slate-500">Data yang dikirim hanya kode/nama koperasi dan nomor/nama/status anggota. Data contoh pada dashboard tidak digunakan sebagai roster.</p>
    </section>
  );
}
