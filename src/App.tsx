import { useState } from 'react';
import { Copy, Check, Code2, Shield, Database, Zap } from 'lucide-react';

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

// Custom Errors
var (
	ErrCooperativeNotFound = errors.New("cooperative not found")
	ErrSequenceNotFound    = errors.New("id sequence not found")
	ErrTransactionFailed   = errors.New("transaction failed")
	ErrInvalidCoopID       = errors.New("invalid cooperative ID")
)

// MemberIDRepository handles member ID generation
type MemberIDRepository struct {
	db   *sql.DB
	pool *pgxpool.Pool
}

// GenerateMemberID generates unique member ID
// Format: [COOP_CODE]-[YEAR]-[6_DIGIT_PADDED_SEQUENCE]
// Example: AGR-2026-000001
func (r *MemberIDRepository) GenerateMemberID(
	ctx context.Context, 
	coopID uuid.UUID,
) (string, error) {
	// Validate input
	if coopID == uuid.Nil {
		return "", ErrInvalidCoopID
	}

	// Set timeout context
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// Use pgx pool if available
	if r.pool != nil {
		return r.generateWithPgx(ctx, coopID)
	}

	// Fallback to database/sql
	return r.generateWithSQL(ctx, coopID)
}

// generateWithPgx uses pgx with Serializable isolation
func (r *MemberIDRepository) generateWithPgx(
	ctx context.Context, 
	coopID uuid.UUID,
) (string, error) {
	// Begin transaction with Serializable isolation
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{
		IsoLevel: pgx.Serializable,
	})
	if err != nil {
		return "", fmt.Errorf("%w: %v", ErrTransactionFailed, err)
	}
	
	// Deferred rollback on error
	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		}
	}()

	// Step 1: Get coop_code with FOR UPDATE lock
	var coopCode string
	err = tx.QueryRow(ctx, \`
		SELECT coop_code 
		FROM cooperatives 
		WHERE id = $1 AND is_active = true
		FOR UPDATE
	\`, coopID).Scan(&coopCode)
	
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("%w: %s", 
				ErrCooperativeNotFound, coopID)
		}
		return "", err
	}

	// Step 2: Get sequence with FOR UPDATE lock
	var currentYear, currentSequence int
	err = tx.QueryRow(ctx, \`
		SELECT current_year, current_sequence
		FROM id_sequences
		WHERE cooperative_id = $1
		FOR UPDATE
	\`, coopID).Scan(&currentYear, &currentSequence)

	// Initialize if not exists
	if err == pgx.ErrNoRows {
		currentYear = time.Now().Year()
		currentSequence = 0
		
		_, err = tx.Exec(ctx, \`
			INSERT INTO id_sequences 
			(cooperative_id, current_year, current_sequence)
			VALUES ($1, $2, $3)
		\`, coopID, currentYear, currentSequence)
		
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	// Step 3: Reset if year changed
	if currentYear != time.Now().Year() {
		currentYear = time.Now().Year()
		currentSequence = 0
		
		_, err = tx.Exec(ctx, \`
			UPDATE id_sequences
			SET current_year = $1, 
			    current_sequence = $2
			WHERE cooperative_id = $3
		\`, currentYear, currentSequence, coopID)
		
		if err != nil {
			return "", err
		}
	}

	// Step 4: Increment sequence
	currentSequence++
	
	_, err = tx.Exec(ctx, \`
		UPDATE id_sequences
		SET current_sequence = $1
		WHERE cooperative_id = $2
	\`, currentSequence, coopID)
	
	if err != nil {
		return "", err
	}

	// Step 5: Commit transaction
	if err = tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("%w: %v", 
			ErrTransactionFailed, err)
	}

	// Step 6: Format: [CODE]-[YEAR]-[6_DIGITS]
	return fmt.Sprintf("%s-%d-%06d", 
		coopCode, currentYear, currentSequence), nil
}`;

function highlightGo(code: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="text-slate-500 italic">$1</span>');

  // Strings
  highlighted = highlighted.replace(/(`[^`]*`)/g, '<span class="text-emerald-400">$1</span>');
  highlighted = highlighted.replace(/("[^"]*")/g, '<span class="text-emerald-400">$1</span>');

  // Keywords
  const keywords = ['package', 'import', 'func', 'return', 'var', 'const', 'type', 'struct', 'if', 'else', 'for', 'range', 'defer', 'nil', 'true', 'false', 'error'];
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-purple-400 font-semibold">$1</span>');
  });

  // Types
  const types = ['string', 'int', 'bool', 'error', 'context\\.Context', 'uuid\\.UUID', '\\*sql\\.DB', '\\*pgxpool\\.Pool'];
  types.forEach(t => {
    const regex = new RegExp(`\\b(${t})\\b`, 'g');
    highlighted = highlighted.replace(regex, '<span class="text-cyan-400">$1</span>');
  });

  // Numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

  return highlighted;
}

export default function App() {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(goCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = goCode.split('\n');
  const displayLines = showCode ? lines : lines.slice(0, 80);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
              <Code2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            GenerateMemberID
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Golang Implementation dengan Race Condition Prevention
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <code className="text-cyan-400 text-sm">
              Format: [COOP_CODE]-[YEAR]-[6_DIGIT_PADDED_SEQUENCE]
            </code>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { icon: Shield, title: 'Serializable Isolation', desc: 'Transaction isolation level tertinggi', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
            { icon: Database, title: 'FOR UPDATE Lock', desc: 'Pessimistic locking pada SELECT', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Zap, title: 'Race Condition Safe', desc: 'Mencegah concurrent updates', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Code2, title: 'Error Handling', desc: 'Custom errors dengan wrapping', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Example Output */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">📝 Example Output</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { example: 'AGR-2026-000001', coop: 'Koperasi AGRID' },
              { example: 'KPM-2026-000042', coop: 'Koperasi Maju' },
              { example: 'SPR-2026-000123', coop: 'Koperasi Sejahtera' },
            ].map((item) => (
              <div key={item.example} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <code className="text-lg font-bold text-cyan-400 block mb-1">{item.example}</code>
                <div className="text-xs text-slate-500">{item.coop}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Display */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-cyan-400" />
            Implementation Code
          </h2>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 ml-2 font-mono">generate_member_id.go</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  {showCode ? '▼ Collapse' : `▶ Show Full (${lines.length} lines)`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
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

            {!showCode && lines.length > 80 && (
              <div className="border-t border-white/10 p-4 text-center">
                <button
                  onClick={() => setShowCode(true)}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                  Lihat {lines.length - 80} baris lainnya
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Usage Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🚀 Usage Example</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
              <span className="text-xs text-slate-500 font-mono">main.go</span>
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
    // Initialize pgx pool
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
        </div>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>© 2026 AGR.BIZ.ID - KOPERASI DIGITAL. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
