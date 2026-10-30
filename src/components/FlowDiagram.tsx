export default function FlowDiagram() {
  const steps = [
    {
      id: 1,
      title: 'User Request',
      description: 'Anggota/Admin mengirim request melalui aplikasi mobile atau dashboard',
      icon: '👤',
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 2,
      title: 'API Gateway',
      description: 'Validasi JWT token, rate limiting, routing ke service yang sesuai',
      icon: '🔀',
      color: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-500/10',
    },
    {
      id: 3,
      title: 'Core Processing',
      description: 'Golang memproses: generate ID, hitung bunga, update ledger',
      icon: '🔄',
      color: 'from-purple-500 to-violet-500',
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 4,
      title: 'Data Persistence',
      description: 'PostgreSQL menyimpan dengan ACID guarantee & Row-Level Security',
      icon: '💾',
      color: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 5,
      title: 'Async Response',
      description: 'Redis queue mengirim notifikasi WhatsApp/Email ke pengguna',
      icon: '📬',
      color: 'from-rose-500 to-pink-500',
      borderColor: 'border-rose-500/30',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
      {/* Horizontal Flow for Desktop */}
      <div className="hidden lg:flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Card */}
            <div className={`flex-1 p-4 rounded-xl border ${step.borderColor} ${step.bgColor} transition-all hover:scale-105 duration-300`}>
              <div className="text-center">
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="text-xs font-bold text-white mb-1">Step {step.id}</div>
                <h4 className="text-sm font-semibold text-white mb-1">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
            
            {/* Arrow */}
            {index < steps.length - 1 && (
              <div className="flex items-center px-2 flex-shrink-0">
                <div className="w-8 h-0.5 bg-gradient-to-r from-white/20 to-white/10" />
                <svg className="w-4 h-4 text-white/30 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vertical Flow for Mobile */}
      <div className="lg:hidden flex flex-col items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="w-full flex flex-col items-center">
            {/* Step Card */}
            <div className={`w-full p-4 rounded-xl border ${step.borderColor} ${step.bgColor} transition-all hover:scale-[1.02] duration-300`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl flex-shrink-0">{step.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500">Step {step.id}</span>
                    <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
            
            {/* Arrow */}
            {index < steps.length - 1 && (
              <div className="flex flex-col items-center py-1">
                <div className="w-0.5 h-4 bg-gradient-to-b from-white/20 to-white/10" />
                <svg className="w-4 h-4 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transaction Example */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-semibold text-slate-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Contoh: Transaksi Simpanan Anggota
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: '1', label: 'Input', detail: 'Anggota input nominal', icon: '📝' },
            { step: '2', label: 'Validasi', detail: 'Gateway cek saldo & token', icon: '✅' },
            { step: '3', label: 'Proses', detail: 'Golang: lock + debit/kredit', icon: '🔐' },
            { step: '4', label: 'Notif', detail: 'Redis queue → WhatsApp', icon: '📱' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="text-xs font-bold text-white">{item.label}</div>
                <div className="text-xs text-slate-500">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
