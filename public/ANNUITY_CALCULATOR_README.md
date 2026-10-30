# 🧮 Annuity Loan Calculator - Golang Implementation

## 📋 Overview

Implementasi Golang untuk menghitung jadwal angsuran pinjaman dengan metode **Anuitas** (cicilan tetap). Fungsi ini menghitung dan menyimpan jadwal angsuran ke database dalam **1 transaksi** untuk memastikan konsistensi data.

**File:** `src/components/AnnuityCalculator.tsx`  
**Method:** Annuity (Fixed Payment)  
**Database:** PostgreSQL dengan Transaction

---

## 🎯 Fitur Utama

### ✅ Annuity Formula
```
A = P × [ r(1+r)^n ] / [ (1+r)^n - 1 ]
```

**Where:**
- **A** = Annuity Payment (cicilan tetap per bulan)
- **P** = Principal (pokok pinjaman)
- **r** = Monthly Interest Rate (bunga bulanan dalam desimal)
- **n** = Number of Months (jumlah bulan)

### ✅ Rounding Error Fix
Penyesuaian khusus untuk bulan terakhir guna menghindari sisa pembulatan (rounding error) yang bisa menyebabkan saldo tidak nol.

### ✅ Transaction Safe
Semua jadwal angsuran di-insert ke database dalam **1 transaksi** untuk memastikan:
- Atomicity: Semua berhasil atau semua gagal
- Consistency: Data tetap konsisten
- Isolation: Tidak ada interferensi dari transaksi lain
- Durability: Data tersimpan permanen setelah commit

---

## 📊 Calculator Features

### Interactive Input
- **Pokok Pinjaman**: Input angka dengan format Rupiah
- **Bunga Tahunan**: Persentase per tahun (auto-convert ke bulanan)
- **Jangka Waktu**: Jumlah bulan (1-360 bulan)
- **Tanggal Mulai**: Date picker untuk start date

### Real-time Calculation
- Cicilan tetap per bulan
- Total pembayaran
- Total bunga
- Effective interest rate
- Tabel jadwal lengkap

### Payment Schedule Table
| Kolom | Deskripsi |
|-------|-----------|
| Bulan | Nomor angsuran (1, 2, 3, ...) |
| Jatuh Tempo | Tanggal jatuh tempo (auto +1 bulan) |
| Pokok | Bagian cicilan untuk pokok |
| Bunga | Bagian cicilan untuk bunga |
| Total | Total cicilan (pokok + bunga) |
| Sisa | Sisa pinjaman setelah pembayaran |

---

## 🔧 Implementation Details

### 1. Monthly Rate Conversion
```go
monthlyRate := (annualRatePercent / 100) / 12
```

**Example:**
- Annual: 12% → Monthly: 1% (0.01)
- Annual: 18% → Monthly: 1.5% (0.015)

### 2. Annuity Calculation
```go
numerator := monthlyRate * math.Pow(1+monthlyRate, float64(months))
denominator := math.Pow(1+monthlyRate, float64(months)) - 1
fixedPayment := principal * (numerator / denominator)

// Round to 2 decimals (Rupiah)
fixedPayment = math.Round(fixedPayment*100) / 100
```

### 3. Monthly Breakdown
```go
for i := 1; i <= months; i++ {
    // Interest for this month
    interestDue := math.Round(remainingBalance*monthlyRate*100) / 100
    
    // Principal for this month
    principalDue := fixedPayment - interestDue
    
    // Last month adjustment (rounding fix)
    if i == months {
        principalDue = remainingBalance
        fixedPayment = principalDue + interestDue
    }
    
    // Update remaining balance
    remainingBalance -= principalDue
}
```

### 4. Database Insert
```go
query := `
    INSERT INTO loan_schedules (
        id, loan_id, installment_number, due_date, 
        principal_due, interest_due, total_due, 
        remaining_balance, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UPCOMING')
`
_, err := tx.ExecContext(ctx, query, 
    uuid.New(), loanID, i, currentDate, 
    principalDue, interestDue, fixedPayment, remainingBalance,
)
```

---

## 📈 Example Calculation

### Input Parameters
- **Pokok**: Rp 10.000.000
- **Bunga Tahunan**: 12%
- **Jangka Waktu**: 12 bulan
- **Tanggal Mulai**: 15 Januari 2026

### Calculation Steps

#### Step 1: Monthly Rate
```
monthlyRate = (12 / 100) / 12 = 0.01 (1%)
```

#### Step 2: Annuity Payment
```
numerator = 0.01 × (1.01)^12 = 0.01 × 1.126825 = 0.011268
denominator = (1.01)^12 - 1 = 1.126825 - 1 = 0.126825
fixedPayment = 10,000,000 × (0.011268 / 0.126825)
fixedPayment = 10,000,000 × 0.088849
fixedPayment = Rp 888,490
```

#### Step 3: Monthly Breakdown

| Bulan | Jatuh Tempo | Pokok | Bunga | Total | Sisa |
|-------|-------------|-------|-------|-------|------|
| 1 | Feb 2026 | 788,490 | 100,000 | 888,490 | 9,211,510 |
| 2 | Mar 2026 | 796,375 | 92,115 | 888,490 | 8,415,135 |
| 3 | Apr 2026 | 804,339 | 84,151 | 888,490 | 7,610,796 |
| ... | ... | ... | ... | ... | ... |
| 12 | Jan 2027 | 880,683 | 7,807 | 888,490 | 0 |

**Total Pembayaran**: Rp 10,661,880  
**Total Bunga**: Rp 661,880  
**Effective Rate**: 6.62%

---

## 🔒 Transaction Safety

### Why Transaction?
1. **Atomicity**: Jika 1 insert gagal, semua rollback
2. **Consistency**: Data selalu dalam state valid
3. **Isolation**: Tidak ada race condition
4. **Durability**: Data tersimpan permanen

### Transaction Flow
```go
func CalculateAndInsertAnnuitySchedule(
    ctx context.Context,
    tx *sql.Tx,  // Transaction object
    loanID uuid.UUID,
    principal float64,
    annualRatePercent float64,
    months int,
    startDate time.Time,
) error {
    // All inserts use the same transaction
    for i := 1; i <= months; i++ {
        _, err := tx.ExecContext(ctx, query, ...)
        if err != nil {
            return fmt.Errorf("failed to insert month %d: %w", i, err)
        }
    }
    return nil
}
```

### Usage Example
```go
// Begin transaction
tx, err := db.BeginTx(ctx, nil)
if err != nil {
    return err
}
defer tx.Rollback() // Auto-rollback if not committed

// Calculate and insert schedule
err = CalculateAndInsertAnnuitySchedule(
    ctx, tx, loanID, 10000000, 12, 12, time.Now(),
)
if err != nil {
    return err // Transaction will rollback
}

// Commit transaction
return tx.Commit()
```

---

## 🎨 UI Components

### Formula Card
Menampilkan rumus anuitas dengan penjelasan variabel:
- Visual formula: `A = P × [ r(1+r)^n ] / [ (1+r)^n - 1 ]`
- 4 cards untuk A, P, r, n dengan deskripsi

### Calculator Input
- **Pokok Pinjaman**: Number input dengan format Rupiah
- **Bunga Tahunan**: Number input dengan auto-convert
- **Jangka Waktu**: Number input (bulan)
- **Tanggal Mulai**: Date picker

### Results Display
- **Cicilan Tetap**: Large display dengan gradient background
- **Total Pembayaran**: Grid 2 kolom
- **Total Bunga**: Highlighted dengan warna amber
- **Effective Rate**: Persentase total bunga

### Schedule Table
- Scrollable table dengan sticky header
- Color-coded columns (pokok: emerald, bunga: amber)
- Format Rupiah untuk semua angka
- Hover effect untuk rows

### Code Display
- Syntax highlighting untuk Go code
- Line numbers
- Copy to clipboard button
- Expandable/collapsible view

---

## 🧪 Testing Scenarios

### Scenario 1: Standard Loan
```
Principal: Rp 10,000,000
Rate: 12% per year
Months: 12
Expected: Rp 888,490 per month
```

### Scenario 2: Long-term Loan
```
Principal: Rp 100,000,000
Rate: 18% per year
Months: 60
Expected: Rp 2,539,286 per month
```

### Scenario 3: Short-term Loan
```
Principal: Rp 5,000,000
Rate: 10% per year
Months: 6
Expected: Rp 862,725 per month
```

### Scenario 4: Rounding Edge Case
```
Principal: Rp 1,000,000
Rate: 15% per year
Months: 3
Expected: Last month adjustment applied
```

---

## 📊 Database Schema

### loan_schedules Table
```sql
CREATE TABLE loan_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id),
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    principal_due NUMERIC(15,2) NOT NULL,
    interest_due NUMERIC(15,2) NOT NULL,
    total_due NUMERIC(15,2) NOT NULL,
    remaining_balance NUMERIC(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(loan_id, installment_number)
);

CREATE INDEX idx_loan_schedules_loan_id ON loan_schedules(loan_id);
CREATE INDEX idx_loan_schedules_due_date ON loan_schedules(due_date);
CREATE INDEX idx_loan_schedules_status ON loan_schedules(status);
```

### Status Values
- **UPCOMING**: Belum jatuh tempo
- **DUE**: Sudah jatuh tempo, belum dibayar
- **PAID**: Sudah dibayar
- **OVERDUE**: Terlambat bayar
- **PARTIAL**: Dibayar sebagian

---

## 🔐 Best Practices

### ✅ DO
- Always use transaction for batch inserts
- Round to 2 decimals for currency (Rupiah)
- Handle last month rounding error
- Use parameterized queries (prevent SQL injection)
- Validate input before calculation
- Log errors with context

### ❌ DON'T
- Don't insert without transaction
- Don't skip rounding adjustment
- Don't use FLOAT for currency (use NUMERIC/DECIMAL)
- Don't forget to handle edge cases (0 months, negative rate)
- Don't hardcode interest rate formula

---

## 🚀 Performance Optimization

### Index Strategy
```sql
-- For querying by loan
CREATE INDEX idx_loan_schedules_loan_id ON loan_schedules(loan_id);

-- For querying upcoming payments
CREATE INDEX idx_loan_schedules_due_date ON loan_schedules(due_date)
WHERE status IN ('UPCOMING', 'DUE');

-- For reporting
CREATE INDEX idx_loan_schedules_status ON loan_schedules(status);
```

### Batch Insert Optimization
```go
// Instead of individual inserts, use batch
var values []string
for i := 1; i <= months; i++ {
    values = append(values, fmt.Sprintf(
        "($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, 'UPCOMING')",
        // ... parameters
    ))
}
query := `INSERT INTO loan_schedules (...) VALUES ` + strings.Join(values, ",")
tx.ExecContext(ctx, query, allParams...)
```

---

## 📚 Related Components

- **Webhook Endpoint**: `src/components/WebhookEndpoint.tsx`
- **Golang Code**: `src/components/GolangCode.tsx`
- **Node.js Auth**: `src/components/NodejsCode.tsx`
- **Database Schema**: `public/migrations/001_initial_schema.sql`

---

## 🎓 Learning Resources

- [Annuity Formula](https://www.investopedia.com/terms/a/annuity.asp)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Go Database SQL](https://go.dev/doc/database/)
- [Rounding Errors in Finance](https://en.wikipedia.org/wiki/Rounding_error)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** Senior Golang Developer  
**License:** MIT
