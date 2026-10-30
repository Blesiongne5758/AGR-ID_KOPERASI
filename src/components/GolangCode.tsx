import { useState } from 'react';

const goCode = `package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ============================================================================
// GenerateMemberID - Senior Golang Developer Implementation
// ============================================================================
// Fungsi ini menghasilkan Member ID unik per koperasi dengan format:
// [COOP_CODE]-[YEAR]-[6_DIGIT_PADDED_SEQUENCE]
//
// Contoh output: AGR-2026-000001, KPM-2026-000042
//
// Race Condition Prevention:
// - Menggunakan database transaction dengan isolation level Serializable
// - Menggunakan SELECT ... FOR UPDATE pada tabel id_sequences
// - Menggunakan pessimistic locking untuk mencegah concurrent updates
// ============================================================================

// Custom Errors
var (
	ErrCooperativeNotFound = errors.New("cooperative not found")
	ErrSequenceNotFound    = errors.New("id sequence not found for cooperative")
	ErrTransactionFailed   = errors.New("transaction failed")
	ErrInvalidCoopID       = errors.New("invalid cooperative ID")
)

// MemberIDRepository handles member ID generation with race condition prevention
type MemberIDRepository struct {
	db   *sql.DB
	pool *pgxpool.Pool
}

// NewMemberIDRepository creates a new repository instance
func NewMemberIDRepository(db *sql.DB) *MemberIDRepository {
	return &MemberIDRepository{db: db}
}

// NewMemberIDRepositoryWithPgx creates repository with pgx pool (recommended)
func NewMemberIDRepositoryWithPgx(pool *pgxpool.Pool) *MemberIDRepository {
	return &MemberIDRepository{pool: pool}
}

// GenerateMemberID generates unique member ID for a cooperative
// Uses Serializable isolation level + FOR UPDATE to prevent race conditions
func (r *MemberIDRepository) GenerateMemberID(ctx context.Context, coopID uuid.UUID) (string, error) {
	// Validate input
	if coopID == uuid.Nil {
		return "", ErrInvalidCoopID
	}

	// Set timeout context to prevent hanging transactions
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Use pgx pool if available (recommended)
	if r.pool != nil {
		return r.generateWithPgx(ctx, coopID)
	}

	// Fallback to database/sql
	return r.generateWithSQL(ctx, coopID)
}

// generateWithPgx uses pgx pool with Serializable isolation
func (r *MemberIDRepository) generateWithPgx(ctx context.Context, coopID uuid.UUID) (string, error) {
	// Begin transaction with Serializable isolation level
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{
		IsoLevel: pgx.Serializable,
	})
	if err != nil {
		return "", fmt.Errorf("%w: failed to begin transaction: %v", ErrTransactionFailed, err)
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(ctx); rbErr != nil {
				err = fmt.Errorf("%w, rollback error: %v", err, rbErr)
			}
		}
	}()

	// Step 1: Get cooperative code with FOR UPDATE lock
	var coopCode string
	query := \`
		SELECT coop_code 
		FROM cooperatives 
		WHERE id = $1 AND is_active = true
		FOR UPDATE
	\`
	err = tx.QueryRow(ctx, query, coopID).Scan(&coopCode)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("%w: cooperative ID %s not found", ErrCooperativeNotFound, coopID)
		}
		return "", fmt.Errorf("failed to get cooperative code: %w", err)
	}

	// Step 2: Get current year and sequence with FOR UPDATE lock
	var currentYear, currentSequence int
	query = \`
		SELECT current_year, current_sequence
		FROM id_sequences
		WHERE cooperative_id = $1
		FOR UPDATE
	\`
	err = tx.QueryRow(ctx, query, coopID).Scan(&currentYear, &currentSequence)
	
	if err == pgx.ErrNoRows {
		currentYear = time.Now().Year()
		currentSequence = 0
		
		insertQuery := \`
			INSERT INTO id_sequences (cooperative_id, current_year, current_sequence)
			VALUES ($1, $2, $3)
		\`
		_, err = tx.Exec(ctx, insertQuery, coopID, currentYear, currentSequence)
		if err != nil {
			return "", fmt.Errorf("failed to initialize id sequence: %w", err)
		}
	} else if err != nil {
		return "", fmt.Errorf("failed to get id sequence: %w", err)
	}

	// Step 3: Reset sequence if year changed
	currentActualYear := time.Now().Year()
	if currentYear != currentActualYear {
		currentYear = currentActualYear
		currentSequence = 0
		
		resetQuery := \`
			UPDATE id_sequences
			SET current_year = $1, current_sequence = $2, last_reset_at = NOW()
			WHERE cooperative_id = $3
		\`
		_, err = tx.Exec(ctx, resetQuery, currentYear, currentSequence, coopID)
		if err != nil {
			return "", fmt.Errorf("failed to reset sequence: %w", err)
		}
	}

	// Step 4: Increment sequence
	currentSequence++
	
	updateQuery := \`
		UPDATE id_sequences
		SET current_sequence = $1, updated_at = NOW()
		WHERE cooperative_id = $2
	\`
	_, err = tx.Exec(ctx, updateQuery, currentSequence, coopID)
	if err != nil {
		return "", fmt.Errorf("failed to update sequence: %w", err)
	}

	// Step 5: Commit transaction
	if err = tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("%w: commit failed: %v", ErrTransactionFailed, err)
	}

	// Step 6: Format: [COOP_CODE]-[YEAR]-[6_DIGIT_PADDED_SEQUENCE]
	memberID := fmt.Sprintf("%s-%d-%06d", coopCode, currentYear, currentSequence)

	return memberID, nil
}`;

// Simple Go syntax highlighter
function highlightGo(code: string): string {
  let highlighted = code
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments (// and /* */)
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');
  highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-slate-500 italic">$1</span>');

  // Strings (backticks and quotes)
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/("[^"]*")/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['package', 'import', 'func', 'return', 'var', 'const', 'type', 'struct', 'interface', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'defer', 'go', 'chan', 'map', 'select', 'nil', 'true', 'false', 'error'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Types
  const types = ['string', 'int', 'bool', 'error', 'context\\.Context', 'uuid\\.UUID', '\\*sql\\.DB', '\\*pgxpool\\.Pool', 'pgx\\.TxOptions', 'sql\\.TxOptions', 'sql\\.LevelSerializable', 'pgx\\.Serializable', 'time\\.Second'];
  types.forEach(t => {
    const regex = new RegExp(`\\b(${t})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-cyan-400">$1</span>');
  });

  // Functions
  highlighted = highlighted.replace(/\b([A-Z][a-zA-Z0-9]*)\(/g, '<span class="text-blue-400">$1</span>(');

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function GolangCode() {
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(goCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = goCode.split('\n');
  const displayLines = showFullCode ? lines : lines.slice(0, 80);

  return (
    <section>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.825 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.047.07.082l-.023.28c0 .047-.047.082-.082.082z"/>
            <path d="M16.744 7.048c-1.133-.28-2.244-.35-3.33-.117-1.086.234-2.01.7-2.756 1.4-.746.7-1.28 1.587-1.603 2.66-.323 1.074-.35 2.17-.082 3.28.268 1.11.793 2.05 1.574 2.82.78.77 1.727 1.31 2.837 1.62 1.11.31 2.21.35 3.3.117 1.09-.233 2.02-.7 2.78-1.4.76-.7 1.3-1.587 1.62-2.66.32-1.074.35-2.17.08-3.28-.27-1.11-.79-2.05-1.57-2.82-.78-.77-1.73-1.31-2.85-1.62z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">GenerateMemberID — Golang Implementation</h2>
          <p className="text-sm text-slate-400 mt-1">Senior Golang Developer • Race Condition Safe • Production Ready</p>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🔒', title: 'Serializable Isolation', desc: 'Transaction isolation level tertinggi', color: 'from-purple-500 to-violet-500' },
          { icon: '⚡', title: 'FOR UPDATE Lock', desc: 'Pessimistic locking pada SELECT query', color: 'from-amber-500 to-orange-500' },
          { icon: '🛡️', title: 'Error Handling', desc: 'Custom errors + wrapped error messages', color: 'from-red-500 to-rose-500' },
          { icon: '📝', title: 'Format Output', desc: '[CODE]-[YEAR]-[6_DIGIT_SEQUENCE]', color: 'from-emerald-500 to-teal-500' },
        ].map(feature => (
          <div key={feature.title} className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${feature.color}`} />
            <span className="text-xl block mb-2">{feature.icon}</span>
            <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
            <p className="text-xs text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Code Display */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-xs text-slate-500 ml-2 font-mono">generate_member_id.go</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Golang 1.21+</span>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button
              onClick={() => setShowFullCode(!showFullCode)}
              className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              {showFullCode ? '▼ Collapse' : `▶ Show Full (${lines.length} lines)`}
            </button>
          </div>
        </div>

        {/* Code */}
        <div className="overflow-x-auto">
          <pre className="p-4 text-xs font-mono leading-relaxed">
            <code>
              {displayLines.map((line, i) => (
                <div key={i} className="flex hover:bg-white/5 transition-colors">
                  <span className="text-slate-600 select-none w-10 text-right pr-4 flex-shrink-0">{i + 1}</span>
                  <span 
                    className="flex-1"
                    dangerouslySetInnerHTML={{ __html: highlightGo(line) }}
                  />
                </div>
              ))}
            </code>
          </pre>
        </div>

        {!showFullCode && lines.length > 80 && (
          <div className="border-t border-white/10 p-4 text-center">
            <button
              onClick={() => setShowFullCode(true)}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
            >
              Lihat {lines.length - 80} baris lainnya
            </button>
          </div>
        )}
      </div>

      {/* Implementation Details */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* Flow */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🔄</span> Alur Eksekusi
          </h3>
          <div className="space-y-3">
            {[
              { step: 1, label: 'Validasi Input', desc: 'Check UUID nil, set timeout context', icon: '✅' },
              { step: 2, label: 'Begin Transaction', desc: 'Serializable isolation level', icon: '🔒' },
              { step: 3, label: 'SELECT coop_code', desc: 'FOR UPDATE lock pada cooperatives', icon: '🔍' },
              { step: 4, label: 'SELECT sequence', desc: 'FOR UPDATE lock pada id_sequences', icon: '🔢' },
              { step: 5, label: 'Increment & Update', desc: 'Update sequence dengan lock held', icon: '⬆️' },
              { step: 6, label: 'Commit', desc: 'Release all locks', icon: '✓' },
              { step: 7, label: 'Format Output', desc: 'CODE-YEAR-000001', icon: '📝' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <span>{item.icon}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Race Condition Prevention */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>🛡️</span> Race Condition Prevention
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-400 mb-2">1. Serializable Isolation</h4>
              <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded">
                pgx.TxOptions{'{'} IsoLevel: pgx.Serializable {'}'}
              </code>
              <p className="text-xs text-slate-400 mt-2">
                Isolation level tertinggi. Menjamin transaksi terlihat seakan dieksekusi secara serial.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <h4 className="text-sm font-semibold text-amber-400 mb-2">2. FOR UPDATE Lock</h4>
              <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded">
                SELECT ... FROM id_sequences ... FOR UPDATE
              </code>
              <p className="text-xs text-slate-400 mt-2">
                Pessimistic locking. Memblokir transaksi lain sampai transaksi saat ini commit/rollback.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">3. Context Timeout</h4>
              <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded">
                context.WithTimeout(ctx, 10*time.Second)
              </code>
              <p className="text-xs text-slate-400 mt-2">
                Mencegah transaksi menggantung (hanging) jika ada deadlock atau masalah koneksi.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <h4 className="text-sm font-semibold text-red-400 mb-2">4. Deferred Rollback</h4>
              <code className="text-xs text-slate-300 block bg-black/30 p-2 rounded">
                defer func() {'{'} if err != nil {'{'} tx.Rollback() {'}'} {'}'}()
              </code>
              <p className="text-xs text-slate-400 mt-2">
                Menjamin rollback jika terjadi error di tengah transaksi. Mencegah lock leak.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Example */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
          <span className="text-xs text-slate-500 font-mono">Contoh Penggunaan</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">main.go</span>
        </div>
        <pre className="p-4 text-xs text-slate-300 overflow-x-auto font-mono leading-relaxed">
          <code>{`package main

import (
    "context"
    "log"
    
    "github.com/google/uuid"
    "github.com/jackc/pgx/v5/pgxpool"
)

func main() {
    // Initialize pgx pool (recommended for production)
    pool, err := pgxpool.New(context.Background(), 
        "postgresql://user:pass@localhost:5432/koperasi_db")
    if err != nil {
        log.Fatal(err)
    }
    defer pool.Close()

    // Create repository
    repo := NewMemberIDRepositoryWithPgx(pool)

    // Generate member ID
    coopID := uuid.MustParse("123e4567-e89b-12d3-a456-426614174000")
    memberID, err := repo.GenerateMemberID(context.Background(), coopID)
    if err != nil {
        log.Fatal(err)
    }

    log.Printf("Generated Member ID: %s", memberID)
    // Output: AGR-2026-000001
}`}</code>
        </pre>
      </div>

      {/* Output Format */}
      <div className="mt-6 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>📝</span> Format Output
        </h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { example: 'AGR-2026-000001', coop: 'AGR.BIZ.ID - KOPERASI DIGITAL' },
            { example: 'KPM-2026-000042', coop: 'Koperasi Maju Bersama' },
            { example: 'SPR-2026-000123', coop: 'Koperasi Sumber Rejeki' },
          ].map(item => (
            <div key={item.example} className="p-3 rounded-lg bg-white/5 border border-white/5">
              <code className="text-sm font-bold text-cyan-400 block mb-1">{item.example}</code>
              <div className="text-xs text-slate-500">{item.coop}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-black/30 border border-white/5">
          <code className="text-xs text-slate-400">
            Format: <span className="text-emerald-400">[COOP_CODE]</span>-<span className="text-amber-400">[YEAR]</span>-<span className="text-purple-400">[6_DIGIT_PADDED_SEQUENCE]</span>
          </code>
        </div>
      </div>

      {/* Error Handling */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚠️</span> Custom Error Types
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { error: 'ErrInvalidCoopID', desc: 'UUID nil atau format tidak valid' },
            { error: 'ErrCooperativeNotFound', desc: 'Koperasi tidak ditemukan atau nonaktif' },
            { error: 'ErrSequenceNotFound', desc: 'Sequence belum diinisialisasi' },
            { error: 'ErrTransactionFailed', desc: 'Transaction commit/rollback gagal' },
          ].map(item => (
            <div key={item.error} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <code className="text-xs text-red-400 font-mono block mb-1">{item.error}</code>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
