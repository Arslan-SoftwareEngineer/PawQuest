# 🐾 Paw Quest · AU Animal Welfare Society Recruitment

**Paw Quest** is an interactive, gamified 7-level recruitment application designed for the **AU Animal Welfare Society (@pets.secure)**. The application streamlines student onboarding, screens candidates through squad-specific readiness questions and strict filter logic, saves submissions in real time to **Supabase**, and generates an exportable **Official Rescuer Pass** badge.

---

## ✨ Features

- **7-Level Gamified Application Flow:**
  - **Level 1 (Welcome):** Interactive campus animal pals showcase with audio/sound effects (Web Audio API).
  - **Level 2 (Council):** Introduction to executive council leadership (President, VP, General Secretary).
  - **Level 3 (Details):** Applicant contact information, roll number, and past volunteering background.
  - **Level 4 (Teams & Role):** Squad selection (Core, Rescue, Events, PR/Social, Video Editing, Graphics) and choice between Squad Lead vs. Active Member.
  - **Level 5 (Your Story):** Narrative questions evaluating applicant compassion, skills, and comfort level around animals.
  - **Level 6 (Commitment & Readiness):** General availability check combined with dynamic team-specific technical questions (including strict rabies/tetanus vaccination requirements for rescue teams).
  - **Level 7 (Rescuer Pass & Review):** Final application summary, solemn rescuer pledge, database submission, and instant HTML5 Canvas PNG badge exporter.
- **Strict Filtering System:** Automatically detects key policy mismatches (e.g., unwillingness to assist during critical emergencies or refusal of required safety vaccinations) and offers tailored guidance or entry into the Honorary Supporter Circle.
- **Real-Time Database Storage:** Powered by **Supabase PostgreSQL** with Row Level Security (RLS) policies enabled for secure inserts.
- **Admin Portal & Data Export:** Built-in modal for council leads to view local and remote submissions or export data to standard CSV files.
- **Responsive & Accessible Design:** Handcrafted layout built using semantic HTML, custom CSS variable themes, and mobile-friendly touch targets.

---

## 📁 Project Structure

```
paw-quest/
├── index.html           # Main entry HTML file with 7-level step containers
├── style.css            # Custom CSS styling, animations, card UI & responsive layouts
├── app.js               # Application logic, stepper navigation, audio synthesizer & handlers
├── supabase.js          # Supabase client initialization & API connection
├── supabase_schema.sql  # Database table schema and Row Level Security (RLS) policies
├── package.json         # Node metadata & dependencies
├── README.md            # Project documentation
└── images/              # Static branding logos & council leadership photos
    ├── logo.png
    ├── arslan.jpg
    ├── areej.jpg
    └── ali.jpg
```

---

## 🗄️ Database Setup (Supabase)

The application uses PostgreSQL on Supabase. To initialize or restore the database table, run the following SQL snippet in your **Supabase SQL Editor**:

```sql
create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  rescuer_id text not null,
  full_name text not null,
  roll_no text not null,
  degree_sem text not null,
  uni_email text not null,
  whatsapp_no text not null,
  past_volunteering text,
  volunteer_details text,
  first_choice_team text not null,
  team_role text default 'Member',
  second_choice_team text,
  why_team text,
  q10_care_meaning text,
  q11_helped_stray text,
  q12_skills_brought text,
  q13_comfort text,
  q14_miss_class text,
  q15_leniency text,
  q16_hours text,
  q17_campus text,
  q18_responsibility text,
  team_specific_answers jsonb default '{}'::jsonb,
  q19_call_hour text,
  q20_response_time text,
  q21_transport text,
  q22_handling text,
  shots_status text[],
  q23b_willing_shots text,
  q24_scenario text,
  q25_anything_else text,
  q26_confirmation boolean default true,
  submitted_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.submissions enable row level security;

-- Setup Access Policies
drop policy if exists "Allow public inserts" on public.submissions;
drop policy if exists "Allow public select" on public.submissions;

create policy "Allow public inserts" on public.submissions
  for insert to public with check (true);

create policy "Allow public select" on public.submissions
  for select to public using (true);
```

---

## 🚀 Environment & API Configuration

Ensure your `supabase.js` file contains your active Supabase URL and public anonymous key:

```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gjuwyyvuqozudbiisxnk.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 🌐 Deploying to Vercel

### Option 1: Static Site Deployment (Recommended)
Because Paw Quest uses browser-native ES modules and CDN scripts, you can deploy it cleanly as a static web application:

1. Connect your GitHub repository to **Vercel**.
2. Go to **Project Settings** -> **Build & Development Settings**.
3. Set **Framework Preset** to **`Other`**.
4. Set **Build Command** to **`OVERRIDE`** with the command `echo "Static deployment"`.
5. Set **Output Directory** to **`OVERRIDE`** with `.`.
6. Click **Deploy**.

---

## 🐾 Official Community Channels

- **Instagram:** [@pets.secure](https://www.instagram.com/pets.secure/?hl=en)
- **WhatsApp Channel:** [@pets.secure](https://whatsapp.com/channel/0029VbAr64N7IUYYN2NxB10V)

---
*Powered by Compassion · AU Animal Welfare Society Chapter · Every Paw Matters*
