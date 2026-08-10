# SMS Templates

## Overview

15 SMS templates for a school SMS gateway. Templates use **type-based variables** — the system auto-detects which CSV/Excel columns map to which variables based on data type, not hard-coded column names.

---

## How Variable Matching Works

Templates define variables by **type**. When a CSV/Excel is uploaded, the system:

1. Reads all column headers
2. Detects the **type** of each column (name, phone, numeric, text, date)
3. Maps columns to template variables by type match
4. Fills the template and sends SMS

**No column names are hard-coded.** The system adapts to any school's Excel format.

### Variable Types

| Type | What It Matches | CSV Detection |
|------|-----------------|---------------|
| `name` | Student's full name | Header contains: name, jina, mwanafunzi, first, last, surname |
| `phone` | Phone number (recipient) | Header contains: number, phone, simu, namba, tel |
| `numeric` | Any score/value (0-1000+) | Column values are all numbers |
| `text` | Any text description | Column values are non-numeric text |
| `date` | Any date value | Header contains: date, tarehe, siku, mwaka |
| `computed` | Total, Average, Grade, Position | Header variants: TOT, AVR, GRD, POS, COM, REMARKS |

**Numbered variants:** When a template uses the same type multiple times, suffixes are used: `{text_1}`, `{text_2}`, `{date_1}`, `{date_2}`, `{numeric_1}`, `{numeric_2}`. The system maps columns in order — first text column → `{text_1}`, second text column → `{text_2}`, etc.

### Name Detection (Auto-Combine)

Multiple name columns are auto-combined into one `{name}` value:

| Detected Columns | Combined Result |
|------------------|-----------------|
| `F.Name` + `M.Name` + `Surname` | "John Peter Mwangi" |
| `FirstName` + `LastName` | "John Mwangi" |
| `Name` | "John Mwangi" |
| `Jina la Kwanza` + `Jina la Mwisho` | "John Mwangi" |

### Phone Detection

Any column with header containing "number", "phone", "simu", "namba", or "tel" is treated as the phone column. SMS is sent to this number.

### Numeric Columns (Subjects + Computed)

Any column with **numeric values** that is NOT a computed column is treated as a subject or data field:

| Auto-Detected as Numeric | Example |
|--------------------------|---------|
| `BIO`, `CHE`, `ENG`, `MAT` | Subject scores |
| `PHY`, `HIS`, `KIS`, `GEO` | Subject scores |
| `CIV`, `B/K` | Subject scores |
| Any new column with numbers | The system adapts automatically |

### Computed Columns (Auto-Included)

| Header Variants | Output Format |
|-----------------|---------------|
| `TOT`, `TOTL`, `TOTAL` | "Jumla: 844" |
| `AVR`, `AVG`, `AVERAGE` | "Wastani: 84" |
| `GRD`, `GRADE`, `GDE` | "Daraja: A" |
| `POS`, `POSITION`, `PST` | "Nafasi: 3" |
| `COM`, `COMMENT`, `COMMENTS` | "Comment: Good" |
| `REMARKS`, `RMK` | "Remarks: Pass" |

---

## Template 1: Parent Meeting (Kikao cha Wazazi)

**Purpose:** Invite parents to a school meeting.

**Message:**
```
Ndugu Mzazi/Mlezi wa {name}, unakaribishwa kwenye kikao cha wazazi kitakachofanyika shuleni tarehe {date} kuanzia saa {text}. Uwepo wako ni muhimu.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name (auto-detected) |
| `{date}` | date | Meeting date |
| `{text}` | text | Meeting time |

---

## Template 2: Exam Results (Majibu ya Mtihani)

**Purpose:** Send exam results to parents.

**Message:**
```
Habari, mwanafunzi {name} amepata alama zifuatazo kwenye mtihani: {numeric}. {computed}. Shule itafunguliwa tarehe {date}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name (auto-combined from name columns) |
| `{numeric}` | numeric | All subject scores (auto-combined from numeric columns) |
| `{computed}` | computed | Total, Average, Grade, Position, Comments, Remarks |
| `{date}` | date | School reopening date |

**Real Excel Example (wide format — one row per student):**

```
S/N | F.Name | M.Name | Surname  | BIO | B/K | CHE | CIV | ENG | GEO | HIS | KIS | MAT | PHY | TOT | AVR | GRD | POS | COM  | REMARKS   | Number
1   | John   | Peter  | Mwangi   | 85  | 78  | 92  | 88  | 76  | 80  | 85  | 90  | 88  | 82  | 844 | 84  | A   | 3   | Good | Pass      | 0712345678
2   | Amina  |        | Kimaro   | 90  | 85  | 76  | 81  | 88  | 75  | 80  | 92  | 85  | 78  | 830 | 83  | A   | 5   | V.G  | Excellent | 0787654321
```

**How system processes this:**

1. Detects name columns → combines `F.Name + M.Name + Surname` → `{name}`
2. Detects numeric columns (BIO, B/K, CHE, etc.) → builds scores string → `{numeric}`
3. Detects computed columns (TOT, AVR, GRD, POS, COM, REMARKS) → builds summary → `{computed}`
4. Reads `Number` column → sends SMS to that phone

**Final SMS sent to 0712345678:**
```
Habari, mwanafunzi John Peter Mwangi amepata alama zifuatazo kwenye mtihani: 
BIO: 85, B/K: 78, CHE: 92, CIV: 88, ENG: 76, GEO: 80, HIS: 85, KIS: 90, 
MAT: 88, PHY: 82. Jumla: 844, Wastani: 84, Daraja: A, Nafasi: 3, Comment: 
Good, Remarks: Pass. Shule itafunguliwa tarehe 3 Oktoba 2026.
```

---

## Template 3: Free Out (Ruhusa ya Kutoka Shuleni)

**Purpose:** Notify parents when a student is released from school early.

**Message:**
```
Ndugu Mzazi, mwanafunzi {name} amepewa ruhusa (Free out) ya kutoka shuleni leo tarehe {date}. Tafadhali thibitisha akifika nyumbani.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{date}` | date | Release date |

---

## Template 4: School Opening/Closing (Shule Kufunguliwa/Kufungwa)

**Purpose:** Inform parents about school term start or end dates.

**Message:**
```
Ndugu Mzazi, tunapenda kukuarifu kuwa shule itafungwa/itafunguliwa rasmi tarehe {date}. Hakikisha mwanafunzi {name} anaripoti kwa wakati akiwa na mahitaji yote.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{date}` | date | Opening/closing date |
| `{name}` | name | Student's full name |

---

## Template 5: Student Debt Reminder (Madeni ya Mwanafunzi)

**Purpose:** Remind parents about outstanding school fees or contributions.

**Message:**
```
Ndugu Mzazi wa {name}, tunakukumbusha kulipia deni la mwanafunzi la kiasi cha Tsh {numeric} linalohusiana na {text}. Tafadhali kamilisha malipo kabla ya {date}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{numeric}` | numeric | Amount owed |
| `{text}` | text | Debt type (fees, contributions, etc.) |
| `{date}` | date | Payment deadline |

---

## Template 6: Fee Payment Confirmation (Uthibitisho wa Malipo)

**Purpose:** Confirm receipt of fee payment from parent.

**Message:**
```
Ndugu Mzazi wa {name}, tunathibitisha kupokea malipo ya Tsh {numeric} kwa ajili ya {text_1}. Salio la sasa ni Tsh {numeric_1}. Asante.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{numeric}` | numeric | Amount paid (first numeric column) |
| `{text_1}` | text | Payment type (first text column) |
| `{numeric_1}` | numeric | Balance (second numeric column) |

---

## Template 7: Absence Alert (Taarifa ya Uonekano)

**Purpose:** Notify parent when student is absent from school.

**Message:**
```
Ndugu Mzazi/Mlezi wa {name}, tunakufahamisha kuwa mwanafunzi hajaripoti shuleni leo tarehe {date}. Tafadhali wasiliana na ofisi ya shule.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{date}` | date | Date of absence |

---

## Template 8: Report Card Ready (Ripoti Tayari)

**Purpose:** Inform parents that report cards are available for collection.

**Message:**
```
Ndugu Mzazi wa {name}, ripoti ya mwanafunzi iko tayari kuchukuliwa ofisini. Matokeo: {text}. Karibu kuchukua kabla ya {date}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text}` | text | Summary of results |
| `{date}` | date | Collection deadline |

---

## Template 9: Exam Schedule (Ratiba ya Mtihani)

**Purpose:** Notify about upcoming exam dates and subjects.

**Message:**
```
Ndugu Mzazi wa {name}, mitihani ya {text_1} itaanza tarehe {date}. Mwanafunzi {name} anatakiwa kusoma vizuri. Muda: {text_2}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text_1}` | text | Exam name (Mid-term, Final) (first text column) |
| `{date}` | date | Exam start date |
| `{text_2}` | text | Exam time (second text column) |

---

## Template 10: Discipline Notice (Taarifa ya Adabu)

**Purpose:** Inform parents about student misbehavior.

**Message:**
```
Ndugu Mzazi/Mlezi wa {name}, tunakufahamisha kuwa mwanafunzi amefanya utovu wa adabu: {text}. Tafadhali fika shuleni kwa mazungumzo tarehe {date}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text}` | text | Issue description |
| `{date}` | date | Meeting date |

---

## Template 11: School Trip (Zaara ya Shule)

**Purpose:** Notify about upcoming school trips with details.

**Message:**
```
Ndugu Mzazi wa {name}, shule inaenda ziara ya {text_1} tarehe {date}. Ada ni Tsh {numeric}. Mwanafunzi anahitaji: {text_2}. Kibali chako kinahitajika.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text_1}` | text | Destination (first text column) |
| `{date}` | date | Trip date |
| `{numeric}` | numeric | Trip cost |
| `{text_2}` | text | Items to bring (second text column) |

---

## Template 12: Emergency Closure (Ufungaji wa Dharura)

**Purpose:** Sudden school closure due to weather, events, etc.

**Message:**
```
TAARIFA YA HARAKA: Shule imefungwa tarehe {date_1} kwa sababu ya {text}. Mwanafunzi {name} arudishwe nyumbani. Tarehe ya kufunguliwa: {date_2}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{date_1}` | date | Closure date (first date column) |
| `{text}` | text | Reason |
| `{date_2}` | date | Reopening date (second date column) |

---

## Template 13: Student Achievement (Fanaka ya Mwanafunzi)

**Purpose:** Congratulate parents on student excellence.

**Message:**
```
Pongezi! Mwanafunzi {name} amefanya vizuri katika {text_1}. Matokeo: {text_2}. Tafadhali endelea kumtia moyo.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text_1}` | text | Achievement area (first text column) |
| `{text_2}` | text | Result (second text column) |

---

## Template 14: Health Advisory (Taarifa ya Afya)

**Purpose:** Vaccination reminders, health notices.

**Message:**
```
TAARIFA YA AFYA: {text_1}. Mwanafunzi {name} anahitaji kuja na {text_2} tarehe {date}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text_1}` | text | Health notice (first text column) |
| `{text_2}` | text | Required items (second text column) |
| `{date}` | date | Date |

---

## Template 15: Uniform Reminder (Ukumbusho wa Sare)

**Purpose:** Remind about school uniform requirements or changes.

**Message:**
```
Ndugu Mzazi wa {name}, tunakukumbusha kuhusu muundo wa sare: {text}. Hakikisha mwanafunzi anavaa sare kamili kuanzia tarehe {date}.
```

**Variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `{name}` | name | Student's full name |
| `{text}` | text | Uniform description |
| `{date}` | date | Effective date |

---

## CSV/Excel Upload Format

The system is **flexible** — it auto-detects columns based on content type, not hard-coded names.

### Column Detection Rules

| Column Type | How System Detects It | Required |
|-------------|----------------------|----------|
| **Phone** | Header contains: number, phone, simu, namba, tel | Yes |
| **Name** | Header contains: name, jina, mwanafunzi, first, last, surname | Yes |
| **Numeric** | Column values are all numbers (0-1000+) | Only for exam template |
| **Text** | Column values are non-numeric | Optional |
| **Date** | Header contains: date, tarehe, siku, mwaka | Optional |
| **Computed** | Header variants: TOT, AVR, GRD, POS, COM, REMARKS | No |

### Example: Any School Format Works

**Format A — 3 name columns:**
```
S/N | F.Name | M.Name | Surname | BIO | CHE | ENG | MAT | TOT | Number
```

**Format B — 2 name columns:**
```
S/N | FirstName | LastName | Physics | Math | English | Grade | Position | Phone
```

**Format C — single name column:**
```
S/N | Name | Subject1 | Subject2 | Subject3 | Average | phone
```

**Format D — non-English headers:**
```
Namba | Jina la Kwanza | Jina la Mwisho | Hisabati | Sayansi | Simu
```

All formats work — the system detects columns automatically.

### Minimal Required Columns

For **any template**, at minimum you need:
- A **name** column (any header containing "name" or "jina")
- A **phone** column (any header containing "number", "phone", "simu", or "namba")

For **exam results**, you also need:
- **Numeric** columns (any columns with numeric scores 0-100)

---

## Technical Requirements

### Database Schema (add to existing)

```sql
CREATE TABLE IF NOT EXISTS sms_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints (new)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/templates` | List user's templates |
| `POST` | `/api/templates` | Create new template |
| `PATCH` | `/api/templates/:id` | Update template |
| `DELETE` | `/api/templates/:id` | Delete template |
| `POST` | `/api/templates/:id/send` | Send template to multiple recipients (CSV upload) |
| `POST` | `/api/templates/bulk-send` | Send pre-filled CSV data |

### Bulk Send Flow

1. User selects a template (e.g. "Exam Results")
2. User uploads CSV/Excel file (any column format)
3. System auto-detects columns by type:
   - Finds phone column → recipients
   - Finds name column(s) → combines into full name
   - Finds numeric columns → builds scores/data string
   - Finds computed columns → builds summary string
   - Finds text columns → available for text variables
   - Finds date columns → available for date variables
4. System fills template placeholders by type match:
   - `{name}` ← combined name columns
   - `{numeric}` ← first numeric column, `{numeric_1}` ← second, etc.
   - `{text}` ← first text column, `{text_1}` ← first, `{text_2}` ← second, etc.
   - `{date}` ← first date column, `{date_1}` ← first, `{date_2}` ← second, etc.
   - `{computed}` ← total, average, grade, position, comments, remarks
5. System sends SMS to each phone number via online device (WebSocket)
6. Returns summary: total sent, failed, queued

### Frontend Components (new)

| Component | Purpose |
|-----------|---------|
| `TemplateList.jsx` | Grid of template cards with edit/delete |
| `TemplateEditor.jsx` | Create/edit template form with live preview |
| `BulkSend.jsx` | CSV upload + template selection + send button |
| `BulkSendHistory.jsx` | History of bulk send jobs with status |

### Integration with Existing Code

- Templates use the same `POST /api/v1/send` endpoint (via `apiKeyAuth` middleware)
- Bulk send iterates through CSV rows and calls the send logic for each
- Usage logs track each individual SMS sent from a bulk job
- WebSocket broadcast handles delivery to the Android device

---

## Template Categories

| Category | Templates | Icon |
|----------|-----------|------|
| School Events | Parent Meeting, School Opening/Closing, School Trip | 📅 |
| Academic | Exam Results, Report Card Ready, Exam Schedule | 📊 |
| Student Movement | Free Out | 🚶 |
| Finance | Student Debt Reminder, Fee Payment Confirmation | 💰 |
| Attendance | Absence Alert | 👁️ |
| Discipline | Discipline Notice | ⚠️ |
| Emergency | Emergency Closure | 🚨 |
| Achievement | Student Achievement | 🏆 |
| Health | Health Advisory | ❤️ |
| Uniform | Uniform Reminder | 👔 |
