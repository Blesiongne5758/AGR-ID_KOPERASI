package repository

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
	db  *sql.DB
	pool *pgxpool.Pool
}

// NewMemberIDRepository creates a new repository instance
// Supports both database/sql and pgx pool
func NewMemberIDRepository(db *sql.DB) *MemberIDRepository {
	return &MemberIDRepository{db: db}
}

// NewMemberIDRepositoryWithPgx creates repository with pgx pool (recommended for performance)
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
			// Rollback on error
			if rbErr := tx.Rollback(ctx); rbErr != nil {
				err = fmt.Errorf("%w, rollback error: %v", err, rbErr)
			}
		}
	}()

	// Step 1: Get cooperative code with FOR UPDATE lock
	var coopCode string
	query := `
		SELECT coop_code 
		FROM cooperatives 
		WHERE id = $1 AND is_active = true
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, query, coopID).Scan(&coopCode)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", fmt.Errorf("%w: cooperative ID %s not found or inactive", ErrCooperativeNotFound, coopID)
		}
		return "", fmt.Errorf("failed to get cooperative code: %w", err)
	}

	// Step 2: Get current year and sequence with FOR UPDATE lock
	var currentYear, currentSequence int
	query = `
		SELECT current_year, current_sequence
		FROM id_sequences
		WHERE cooperative_id = $1
		FOR UPDATE
	`
	err = tx.QueryRow(ctx, query, coopID).Scan(&currentYear, &currentSequence)
	
	// Initialize if not exists
	if err == pgx.ErrNoRows {
		currentYear = time.Now().Year()
		currentSequence = 0
		
		insertQuery := `
			INSERT INTO id_sequences (cooperative_id, current_year, current_sequence, last_reset_at)
			VALUES ($1, $2, $3, NOW())
		`
		_, err = tx.Exec(ctx, insertQuery, coopID, currentYear, currentSequence)
		if err != nil {
			return "", fmt.Errorf("failed to initialize id sequence: %w", err)
		}
	} else if err != nil {
		return "", fmt.Errorf("failed to get id sequence: %w", err)
	}

	// Step 3: Check if year has changed, reset sequence if needed
	currentActualYear := time.Now().Year()
	if currentYear != currentActualYear {
		currentYear = currentActualYear
		currentSequence = 0
		
		resetQuery := `
			UPDATE id_sequences
			SET current_year = $1, current_sequence = $2, last_reset_at = NOW()
			WHERE cooperative_id = $3
		`
		_, err = tx.Exec(ctx, resetQuery, currentYear, currentSequence, coopID)
		if err != nil {
			return "", fmt.Errorf("failed to reset sequence for new year: %w", err)
		}
	}

	// Step 4: Increment sequence
	currentSequence++
	
	updateQuery := `
		UPDATE id_sequences
		SET current_sequence = $1, updated_at = NOW()
		WHERE cooperative_id = $2
	`
	_, err = tx.Exec(ctx, updateQuery, currentSequence, coopID)
	if err != nil {
		return "", fmt.Errorf("failed to update sequence: %w", err)
	}

	// Step 5: Commit transaction
	if err = tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("%w: failed to commit transaction: %v", ErrTransactionFailed, err)
	}

	// Step 6: Format member ID: [COOP_CODE]-[YEAR]-[6_DIGIT_PADDED_SEQUENCE]
	memberID := fmt.Sprintf("%s-%d-%06d", coopCode, currentYear, currentSequence)

	return memberID, nil
}

// generateWithSQL uses database/sql with Serializable isolation
func (r *MemberIDRepository) generateWithSQL(ctx context.Context, coopID uuid.UUID) (string, error) {
	// Begin transaction with Serializable isolation level
	tx, err := r.db.BeginTx(ctx, &sql.TxOptions{
		Isolation: sql.LevelSerializable,
		ReadOnly:  false,
	})
	if err != nil {
		return "", fmt.Errorf("%w: failed to begin transaction: %v", ErrTransactionFailed, err)
	}
	defer func() {
		if err != nil {
			if rbErr := tx.Rollback(); rbErr != nil {
				err = fmt.Errorf("%w, rollback error: %v", err, rbErr)
			}
		}
	}()

	// Step 1: Get cooperative code with FOR UPDATE lock
	var coopCode string
	query := `
		SELECT coop_code 
		FROM cooperatives 
		WHERE id = $1 AND is_active = true
		FOR UPDATE
	`
	err = tx.QueryRowContext(ctx, query, coopID).Scan(&coopCode)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("%w: cooperative ID %s not found or inactive", ErrCooperativeNotFound, coopID)
		}
		return "", fmt.Errorf("failed to get cooperative code: %w", err)
	}

	// Step 2: Get current year and sequence with FOR UPDATE lock
	var currentYear, currentSequence int
	query = `
		SELECT current_year, current_sequence
		FROM id_sequences
		WHERE cooperative_id = $1
		FOR UPDATE
	`
	err = tx.QueryRowContext(ctx, query, coopID).Scan(&currentYear, &currentSequence)
	
	// Initialize if not exists
	if err == sql.ErrNoRows {
		currentYear = time.Now().Year()
		currentSequence = 0
		
		insertQuery := `
			INSERT INTO id_sequences (cooperative_id, current_year, current_sequence, last_reset_at)
			VALUES ($1, $2, $3, NOW())
		`
		_, err = tx.ExecContext(ctx, insertQuery, coopID, currentYear, currentSequence)
		if err != nil {
			return "", fmt.Errorf("failed to initialize id sequence: %w", err)
		}
	} else if err != nil {
		return "", fmt.Errorf("failed to get id sequence: %w", err)
	}

	// Step 3: Check if year has changed, reset sequence if needed
	currentActualYear := time.Now().Year()
	if currentYear != currentActualYear {
		currentYear = currentActualYear
		currentSequence = 0
		
		resetQuery := `
			UPDATE id_sequences
			SET current_year = $1, current_sequence = $2, last_reset_at = NOW()
			WHERE cooperative_id = $3
		`
		_, err = tx.ExecContext(ctx, resetQuery, currentYear, currentSequence, coopID)
		if err != nil {
			return "", fmt.Errorf("failed to reset sequence for new year: %w", err)
		}
	}

	// Step 4: Increment sequence
	currentSequence++
	
	updateQuery := `
		UPDATE id_sequences
		SET current_sequence = $1, updated_at = NOW()
		WHERE cooperative_id = $2
	`
	_, err = tx.ExecContext(ctx, updateQuery, currentSequence, coopID)
	if err != nil {
		return "", fmt.Errorf("failed to update sequence: %w", err)
	}

	// Step 5: Commit transaction
	if err = tx.Commit(); err != nil {
		return "", fmt.Errorf("%w: failed to commit transaction: %v", ErrTransactionFailed, err)
	}

	// Step 6: Format member ID: [COOP_CODE]-[YEAR]-[6_DIGIT_PADDED_SEQUENCE]
	memberID := fmt.Sprintf("%s-%d-%06d", coopCode, currentYear, currentSequence)

	return memberID, nil
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
package main

import (
	"context"
	"log"
	
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Initialize pgx pool
	pool, err := pgxpool.New(context.Background(), "postgresql://user:pass@localhost:5432/koperasi_db")
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
}
*/
