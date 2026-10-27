/**
 * Paw Quest · Animal Welfare Society Recruitment Application Logic
 * Full 7-level gamified flow, Web Audio SFX, Strict Filters, Dynamic Team Questions, Canvas Card Export & Local Storage
 */
import { supabase } from './supabase.js';
(function () {
  'use strict';

  // --- APP STATE ---
  const state = {
    currentLevel: 1,
    audioEnabled: true,
    audioCtx: null,
    strictViolations: [],
    draft: {
      fullName: '',
      rollNo: '',
      degreeSem: '',
      uniEmail: '',
      whatsappNo: '',
      pastVolunteering: '',
      volunteerDetails: '',
      firstChoiceTeam: '',
      teamRole: 'Member', // 'Lead' or 'Member'
      secondChoiceTeam: '',
      whyTeam: '',
      q10CareMeaning: '',
      q11HelpedStray: '',
      q12SkillsBrought: '',
      q13Comfort: '',
      // Part A: General Commitment (Everyone including Core)
      q14MissClass: '',
      q15Leniency: '',
      q16Hours: '',
      q17Campus: '',
      q18Responsibility: '',
      // Part B: Team Specific Answers
      teamSpecificAnswers: {},
      // Rescue specific fields
      q19CallHour: '',
      q20ResponseTime: '',
      q21Transport: '',
      q22Handling: '',
      shotsStatus: [],
      q23bWillingShots: '',
      q24Scenario: '',
      // Final level
      q25AnythingElse: '',
      q26Confirmation: false,
      rescuerId: '',
      submittedAt: ''
    }
  };

  // --- TEAM METADATA ---
  const TEAMS = {
    core: {
      name: 'Paw Patrol HQ',
      alt: 'Core Council Team',
      emoji: '🐾',
      vibe: 'Leads & Decides',
      cadetRank: 'Core Leadership Cadet'
    },
    rescue: {
      name: 'Tail Savers',
      alt: 'Rescue Team',
      emoji: '🚑',
      vibe: '24/7 First Responders',
      cadetRank: 'Emergency Rescue Guardian'
    },
    events: {
      name: 'Paw-ty Planners',
      alt: 'Event Management Team',
      emoji: '🎪',
      vibe: 'Drives & Camps',
      cadetRank: 'Campaign & Events Coordinator'
    },
    social: {
      name: 'The Purr-suaders',
      alt: 'Social Media & PR',
      emoji: '📱',
      vibe: 'Awareness & Stories',
      cadetRank: 'Chief Storyteller & PR Cadet'
    },
    video: {
      name: 'Reel Rescuers',
      alt: 'Video Editing Team',
      emoji: '🎬',
      vibe: 'Rescue Reels & Mini-Docs',
      cadetRank: 'Cinematic Rescue Documentarian'
    },
    graphics: {
      name: 'Fur-ever Creatives',
      alt: 'Graphics & Design',
      emoji: '🎨',
      vibe: 'Posters & Branding',
      cadetRank: 'Brand & Visual Artificer'
    }
  };

  // --- WEB AUDIO API SYNTHESIZER ---
  function getAudioContext() {
    if (!state.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        state.audioCtx = new AudioCtx();
      }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    return state.audioCtx;
  }

  function playSound(type) {
    if (!state.audioEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'step') {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.1, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.26);
        });
      } else if (type === 'warning') {
        [392.00, 311.13].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.15, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.36);
        });
      } else if (type === 'success') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.15, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.42);
        });
      }
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  // --- LOCAL STORAGE HANDLING ---
  function saveDraft() {
    try {
      localStorage.setItem('paw_quest_draft', JSON.stringify(state.draft));
    } catch (e) {
      console.warn('Failed to save draft', e);
    }
  }

  function loadDraft() {
    try {
      const saved = localStorage.getItem('paw_quest_draft');
      if (saved) {
        Object.assign(state.draft, JSON.parse(saved));
        populateFormFromDraft();
      }
    } catch (e) {
      console.warn('Failed to load draft', e);
    }
  }

  function getSubmissions() {
    try {
      return JSON.parse(localStorage.getItem('paw_quest_submissions') || '[]');
    } catch (e) {
      return [];
    }
  }

  async function saveSubmission(data) {
    // 1. Save locally to keep localStorage features intact
    const subs = getSubmissions();
    subs.unshift(data);
    localStorage.setItem('paw_quest_submissions', JSON.stringify(subs));
    updateSubmissionCountBadge();

    // 2. Insert into Supabase database
    const { error } = await supabase
      .from('submissions')
      .insert([{
        rescuer_id: data.rescuerId,
        full_name: data.fullName,
        roll_no: data.rollNo,
        degree_sem: data.degreeSem,
        uni_email: data.uniEmail,
        whatsapp_no: data.whatsappNo,
        past_volunteering: data.pastVolunteering,
        volunteer_details: data.volunteerDetails,
        first_choice_team: data.firstChoiceTeam,
        team_role: data.teamRole,
        second_choice_team: data.secondChoiceTeam,
        why_team: data.whyTeam,
        q10_care_meaning: data.q10CareMeaning,
        q11_helped_stray: data.q11HelpedStray,
        q12_skills_brought: data.q12SkillsBrought,
        q13_comfort: data.q13Comfort,
        q14_miss_class: data.q14MissClass,
        q15_leniency: data.q15Leniency,
        q16_hours: data.q16Hours,
        q17_campus: data.q17Campus,
        q18_responsibility: data.q18Responsibility,
        team_specific_answers: data.teamSpecificAnswers || {},
        q19_call_hour: data.q19CallHour || null,
        q20_response_time: data.q20ResponseTime || null,
        q21_transport: data.q21Transport || null,
        q22_handling: data.q22Handling || null,
        shots_status: data.shotsStatus || [],
        q23b_willing_shots: data.q23bWillingShots || null,
        q24_scenario: data.q24Scenario || null,
        q25_anything_else: data.q25AnythingElse || null,
        q26_confirmation: data.q26Confirmation
      }]);

    if (error) {
      throw error;
    }
  }

  function updateSubmissionCountBadge() {
    const badge = document.getElementById('submissionBadge');
    if (badge) {
      badge.textContent = getSubmissions().length;
    }
  }

  // --- STEP PROGRESSION ---
  function goToStep(targetStep) {
    if (targetStep === 'success') {
      showSuccessScreen();
      return;
    }
    if (targetStep < 1 || targetStep > 7) return;

    const screens = document.querySelectorAll('.quest-screen');
    screens.forEach(s => s.classList.remove('active'));

    const targetScreen = document.getElementById(`level-${targetStep}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    state.currentLevel = targetStep;

    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      const percentage = (targetStep / 7) * 100;
      progressFill.style.width = `${percentage}%`;
    }

    const stepNodes = document.querySelectorAll('.quest-steps-row .step-node');
    stepNodes.forEach((node, idx) => {
      const stepIndex = idx + 1;
      node.classList.remove('active', 'completed');
      if (stepIndex === targetStep) {
        node.classList.add('active');
      } else if (stepIndex < targetStep) {
        node.classList.add('completed');
      }
    });

    if (targetStep === 6) {
      renderLevel6Questions();
    } else if (targetStep === 7) {
      renderSummaryReview();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    playSound('step');
  }

  // --- POPULATE FORM CONTROLS ---
  function populateFormFromDraft() {
    const d = state.draft;
    if (d.fullName) setValue('fullName', d.fullName);
    if (d.rollNo) setValue('rollNo', d.rollNo);
    if (d.degreeSem) setValue('degreeSem', d.degreeSem);
    if (d.uniEmail) setValue('uniEmail', d.uniEmail);
    if (d.whatsappNo) setValue('whatsappNo', d.whatsappNo);
    if (d.pastVolunteering) {
      setRadio('pastVolunteering', d.pastVolunteering);
      const box = document.getElementById('volunteerDetailsBox');
      if (box) box.classList.toggle('hidden', d.pastVolunteering !== 'Yes');
    }
    if (d.volunteerDetails) setValue('volunteerDetails', d.volunteerDetails);

    if (d.firstChoiceTeam) {
      setValue('firstChoiceTeam', d.firstChoiceTeam);
      highlightTeamCard(d.firstChoiceTeam);
    }
    if (d.teamRole) setRadio('teamRole', d.teamRole);
    if (d.secondChoiceTeam) setValue('secondChoiceTeam', d.secondChoiceTeam);
    if (d.whyTeam) setValue('whyTeam', d.whyTeam);

    if (d.q10CareMeaning) setValue('q10CareMeaning', d.q10CareMeaning);
    if (d.q11HelpedStray) setValue('q11HelpedStray', d.q11HelpedStray);
    if (d.q12SkillsBrought) setValue('q12SkillsBrought', d.q12SkillsBrought);
    if (d.q13Comfort) setRadio('q13Comfort', d.q13Comfort);

    if (d.q14MissClass) setRadio('q14MissClass', d.q14MissClass);
    if (d.q15Leniency) setRadio('q15Leniency', d.q15Leniency);
    if (d.q16Hours) setRadio('q16Hours', d.q16Hours);
    if (d.q17Campus) setRadio('q17Campus', d.q17Campus);
    if (d.q18Responsibility) setRadio('q18Responsibility', d.q18Responsibility);
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function setRadio(name, val) {
    const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (el) el.checked = true;
  }

  function getRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  }

  function highlightTeamCard(teamKey) {
    const cards = document.querySelectorAll('.team-card');
    cards.forEach(card => {
      card.classList.toggle('selected', card.getAttribute('data-team') === teamKey);
    });
  }

  // --- LEVEL 6 SETUP: DYNAMIC PART B FOR SPECIFIC CHOSEN TEAM ONLY ---
  function renderLevel6Questions() {
    const container = document.getElementById('partBSpecificQuestionsContainer');
    const titleEl = document.getElementById('partBTeamTitle');
    const subEl = document.getElementById('partBTeamSubtitle');
    if (!container) return;
    container.innerHTML = '';

    const primaryTeamKey = state.draft.firstChoiceTeam || 'core';
    const t = TEAMS[primaryTeamKey] || TEAMS.core;

    if (titleEl) {
      titleEl.innerHTML = `${t.emoji} ${t.name} (${t.alt}) Specific Questions <span class="required">*</span>`;
    }
    if (subEl) {
      subEl.textContent = `Because you selected ${t.name} as your 1st choice squad, please answer all technical & readiness questions below:`;
    }

    const saved = state.draft.teamSpecificAnswers || {};

    if (primaryTeamKey === 'rescue') {
      // 🚑 Tail Savers (Rescue Team)
      container.innerHTML = `
        <!-- Q19 -->
        <div class="filter-question-card">
          <div class="question-header">
            <label>19. Are you okay being called at any hour, day or night, for an emergency rescue? <span class="required">*</span></label>
          </div>
          <p class="question-note">Campus emergencies frequently occur after midnight or dawn.</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="q19CallHour" value="Yes" ${state.draft.q19CallHour === 'Yes' ? 'checked' : ''} required>
              <span>Yes, day or night</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="q19CallHour" value="Mostly" ${state.draft.q19CallHour === 'Mostly' ? 'checked' : ''}>
              <span>Mostly (as long as in town)</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="q19CallHour" value="No" ${state.draft.q19CallHour === 'No' ? 'checked' : ''}>
              <span>No, daytime only</span>
            </label>
          </div>
        </div>

        <!-- Q20 -->
        <div class="filter-question-card">
          <div class="question-header">
            <label>20. How quickly can you reach a rescue spot once called? <span class="required">*</span></label>
          </div>
          <p class="question-note">Speed of dispatch determines survival during critical trauma.</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="q20ResponseTime" value="Under 30 min" ${state.draft.q20ResponseTime === 'Under 30 min' ? 'checked' : ''} required>
              <span>Under 30 minutes ⚡</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="q20ResponseTime" value="30-60 min" ${state.draft.q20ResponseTime === '30-60 min' ? 'checked' : ''}>
              <span>30 – 60 minutes</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="q20ResponseTime" value="Over 1 hr" ${state.draft.q20ResponseTime === 'Over 1 hr' ? 'checked' : ''}>
              <span>Over 1 hour</span>
            </label>
          </div>
        </div>

        <!-- Q21 -->
        <div class="filter-question-card">
          <div class="question-header">
            <label>21. Do you have your own transport (Bike, Car, Scooter)? <span class="required">*</span></label>
          </div>
          <p class="question-note">Having personal transport helps rapid response across campus and vet runs.</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="q21Transport" value="Yes" ${state.draft.q21Transport === 'Yes' ? 'checked' : ''} required>
              <span>Yes, I have my own vehicle</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="q21Transport" value="Sometimes" ${state.draft.q21Transport === 'Sometimes' ? 'checked' : ''}>
              <span>Sometimes / Shared</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="q21Transport" value="No" ${state.draft.q21Transport === 'No' ? 'checked' : ''}>
              <span>No (Rely on walking/public)</span>
            </label>
          </div>
        </div>

        <!-- Q22 -->
        <div class="filter-question-card">
          <div class="question-header">
            <label>22. Are you comfortable handling injured, sick, or bleeding animals, or willing to be trained? <span class="required">*</span></label>
          </div>
          <p class="question-note">Frontline rescue work requires composure during distress.</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="q22Handling" value="Yes" ${state.draft.q22Handling === 'Yes' ? 'checked' : ''} required>
              <span>Yes, comfortable</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="q22Handling" value="Willing to learn" ${state.draft.q22Handling === 'Willing to learn' ? 'checked' : ''}>
              <span>Willing to learn & be trained</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="q22Handling" value="No" ${state.draft.q22Handling === 'No' ? 'checked' : ''}>
              <span>No, cannot handle this</span>
            </label>
          </div>
        </div>

        <!-- Q23: VACCINATION BREAKDOWN -->
        <div class="filter-question-card vaccine-box">
          <div class="vaccine-header">
            <span class="vaccine-badge">Mandatory Protocol</span>
            <h4 class="vaccine-title">23. Vaccination & Safety Immunization Status <span class="required">*</span></h4>
          </div>
          
          <div class="vaccine-alert-note">
            <span class="note-icon">💉</span>
            <div>
              <strong>Volunteer Safety Mandate:</strong>
              <p>Active rescue involves direct contact with stray animals. For your safety, rabies and tetanus protection is required. <em>(Note: You have to get these shots updated yourself at a clinic/hospital).</em></p>
            </div>
          </div>

          <!-- 23a -->
          <div class="sub-q-block">
            <label class="sub-q-label">23a. Mark which shots you are currently updated on: <span class="required">*</span></label>
            <div class="checkbox-options-list">
              <label class="check-pill">
                <input type="checkbox" name="shotsStatus" value="Rabies" ${state.draft.shotsStatus.includes('Rabies') ? 'checked' : ''}>
                <span>🛡️ Anti-Rabies Vaccine (Active Pre-exposure or Post-exposure course)</span>
              </label>
              <label class="check-pill">
                <input type="checkbox" name="shotsStatus" value="Tetanus" ${state.draft.shotsStatus.includes('Tetanus') ? 'checked' : ''}>
                <span>🛡️ Tetanus Toxoid (TT Shot within the past 12 months)</span>
              </label>
              <label class="check-pill">
                <input type="checkbox" name="shotsStatus" value="None" id="shotNoneCheckbox" ${state.draft.shotsStatus.includes('None') ? 'checked' : ''}>
                <span>⚠️ Neither / None of the above currently</span>
              </label>
            </div>
          </div>

          <!-- 23b -->
          <div class="sub-q-block">
            <label class="sub-q-label">23b. If you are missing any of these shots, are you willing to get them updated yourself before participating in physical field rescues? <span class="required">*</span></label>
            <div class="radio-pill-group">
              <label class="radio-pill">
                <input type="radio" name="q23bWillingShots" value="Yes" ${state.draft.q23bWillingShots === 'Yes' ? 'checked' : ''} required>
                <span>Yes, I will get the required shots myself for safety</span>
              </label>
              <label class="radio-pill danger-opt">
                <input type="radio" name="q23bWillingShots" value="No" ${state.draft.q23bWillingShots === 'No' ? 'checked' : ''}>
                <span>No, I am not willing to get vaccinated</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Q24 -->
        <div class="filter-question-card">
          <div class="question-header">
            <label for="q24Scenario">24. Scenario: You arrive at a rescue spot and find a seriously injured stray dog that is growling, frightened, and snapping in pain. What exact steps would you take? <span class="required">*</span></label>
          </div>
          <p class="question-note">Describe your safety precautions, approach, containment, and communication with the vet/team.</p>
          <textarea id="q24Scenario" name="q24Scenario" rows="3" placeholder="Describe your safety precautions, approach, containment, and communication with the vet/team..." required>${state.draft.q24Scenario || ''}</textarea>
        </div>
      `;

      // Attach vaccine none checkbox toggle
      const noneCb = document.getElementById('shotNoneCheckbox');
      if (noneCb) {
        noneCb.addEventListener('change', (e) => {
          if (e.target.checked) {
            document.querySelectorAll('input[name="shotsStatus"]').forEach(cb => {
              if (cb !== noneCb) cb.checked = false;
            });
          }
        });
      }
      document.querySelectorAll('input[name="shotsStatus"]').forEach(cb => {
        if (cb !== noneCb) {
          cb.addEventListener('change', (e) => {
            if (e.target.checked && noneCb) noneCb.checked = false;
          });
        }
      });

    } else if (primaryTeamKey === 'core') {
      // 🐾 Paw Patrol HQ (Core Team)
      container.innerHTML = `
        <div class="filter-question-card">
          <div class="question-header">
            <label>19. Crisis Leadership & Conflict Resolution <span class="required">*</span></label>
          </div>
          <p class="question-note">Why do you want to lead in Paw Patrol HQ? Describe a specific time you resolved a conflict or handled a high-pressure crisis under pressure within a team.</p>
          <textarea rows="3" data-skill-key="core_leadership" placeholder="Describe the crisis, your decision, and how your team overcame it..." required>${saved.core_leadership || ''}</textarea>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>20. Strategic Campus Vision <span class="required">*</span></label>
          </div>
          <p class="question-note">What is one specific system, procedure, or policy (e.g. campus stray feeding spots, emergency alert hotline, teacher approvals) you want to build or improve for our society?</p>
          <textarea rows="3" data-skill-key="core_vision" placeholder="Explain your proposal and how it helps animals and students..." required>${saved.core_vision || ''}</textarea>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>21. Crisis Decision Availability <span class="required">*</span></label>
          </div>
          <p class="question-note">Core Leaders coordinate fast rescue decisions and administrative approvals. Can you commit to being reachable on WhatsApp/calls for urgent squad decisions?</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="core_availability" value="Yes" ${saved.core_availability === 'Yes' ? 'checked' : ''} required>
              <span>Yes, always reachable for council alerts</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="core_availability" value="Mostly" ${saved.core_availability === 'Mostly' ? 'checked' : ''}>
              <span>Mostly reachable</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="core_availability" value="No" ${saved.core_availability === 'No' ? 'checked' : ''}>
              <span>No, hard to reach</span>
            </label>
          </div>
        </div>
      `;

    } else if (primaryTeamKey === 'events') {
      // 🎪 Paw-ty Planners (Events)
      container.innerHTML = `
        <div class="filter-question-card">
          <div class="question-header">
            <label>19. Past Event & Drive Experience <span class="required">*</span></label>
          </div>
          <p class="question-note">Have you organised or volunteered in any university event, stray feeding drive, or donation camp before? Describe your exact role and key lessons learned.</p>
          <textarea rows="3" data-skill-key="events_experience" placeholder="Describe the event, turnout, your duties, and what worked..." required>${saved.events_experience || ''}</textarea>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>20. Creative Adoption / Fundraiser Pitch <span class="required">*</span></label>
          </div>
          <p class="question-note">Pitch a creative concept for a campus stray adoption drive, rabies camp, or fundraiser bake-sale that would attract both students and faculty.</p>
          <textarea rows="3" data-skill-key="events_pitch" placeholder="Share your theme, activities, food/stalls, and safety plan..." required>${saved.events_pitch || ''}</textarea>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>21. On-ground Logistics Readiness <span class="required">*</span></label>
          </div>
          <p class="question-note">Are you comfortable with hands-on logistics (setting up booths, sound, managing crowd flow, carrying animal crates/supplies)?</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="events_logistics" value="Yes" ${saved.events_logistics === 'Yes' ? 'checked' : ''} required>
              <span>Yes, love hands-on field logistics</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="events_logistics" value="Willing" ${saved.events_logistics === 'Willing' ? 'checked' : ''}>
              <span>Willing to learn and assist</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="events_logistics" value="No" ${saved.events_logistics === 'No' ? 'checked' : ''}>
              <span>No, prefer online tasks only</span>
            </label>
          </div>
        </div>
      `;

    } else if (primaryTeamKey === 'social') {
      // 📱 The Purr-suaders (Social Media)
      container.innerHTML = `
        <div class="filter-question-card">
          <div class="question-header">
            <label>19. Content Handles & Proof of Work <span class="required">*</span></label>
          </div>
          <p class="question-note">Share a link to content, Instagram handles, TikTok/reels, or public campaigns you’ve created or managed.</p>
          <input type="text" data-skill-key="social_portfolio" placeholder="e.g. instagram.com/myhandle or Google Drive link" value="${saved.social_portfolio || ''}" required>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>20. Viral Rescue Campaign Strategy <span class="required">*</span></label>
          </div>
          <p class="question-note">How would you tell the emotional story of a newly rescued injured puppy to turn campus sympathy into real adoptions and food donations?</p>
          <textarea rows="3" data-skill-key="social_storytelling" placeholder="Outline hook, visuals, caption, audio choice, and call-to-action..." required>${saved.social_storytelling || ''}</textarea>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>21. Publishing Consistency <span class="required">*</span></label>
          </div>
          <p class="question-note">Can you commit to creating and publishing high-quality awareness stories/reels consistently (at least 2–3 times a week during drives)?</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="social_consistency" value="Yes" ${saved.social_consistency === 'Yes' ? 'checked' : ''} required>
              <span>Yes, fully committed to consistent posting</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="social_consistency" value="Sometimes" ${saved.social_consistency === 'Sometimes' ? 'checked' : ''}>
              <span>Sometimes (depending on exams)</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="social_consistency" value="No" ${saved.social_consistency === 'No' ? 'checked' : ''}>
              <span>No, irregular availability</span>
            </label>
          </div>
        </div>
      `;

    } else if (primaryTeamKey === 'video') {
      // 🎬 Reel Rescuers (Video Editing)
      container.innerHTML = `
        <div class="filter-question-card">
          <div class="question-header">
            <label>19. Editing Software & Sample Video Links <span class="required">*</span></label>
          </div>
          <p class="question-note">Which video editing software do you use (Premiere Pro, CapCut, DaVinci)? Please provide a Google Drive / YouTube link to your sample video edits.</p>
          <input type="text" data-skill-key="video_portfolio" placeholder="e.g. CapCut / Premiere · drive.google.com/..." value="${saved.video_portfolio || ''}" required>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>20. Rapid Emergency Turnaround <span class="required">*</span></label>
          </div>
          <p class="question-note">Rescue appeals often need to be edited and posted within 2–3 hours to secure emergency donor funds or blood donors. Can you handle fast-turnaround emergency edits?</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="video_turnaround" value="Yes" ${saved.video_turnaround === 'Yes' ? 'checked' : ''} required>
              <span>Yes, ready for fast-turnaround crisis clips</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="video_turnaround" value="Within 24h" ${saved.video_turnaround === 'Within 24h' ? 'checked' : ''}>
              <span>Usually need 24 hours</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="video_turnaround" value="No" ${saved.video_turnaround === 'No' ? 'checked' : ''}>
              <span>No, need several days</span>
            </label>
          </div>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>21. Emotion & Sound Philosophy <span class="required">*</span></label>
          </div>
          <p class="question-note">Describe how you use pacing, music, and sound to make rescue videos emotionally touching without being overly graphic.</p>
          <textarea rows="3" data-skill-key="video_style" placeholder="Your creative approach to ethical animal welfare storytelling..." required>${saved.video_style || ''}</textarea>
        </div>
      `;

    } else if (primaryTeamKey === 'graphics') {
      // 🎨 Fur-ever Creatives (Graphics)
      container.innerHTML = `
        <div class="filter-question-card">
          <div class="question-header">
            <label>19. Design Tools & Portfolio Link <span class="required">*</span></label>
          </div>
          <p class="question-note">Which design tools do you use (Illustrator, Photoshop, Figma, Canva)? Please share a link to your portfolio, Behance, or Google Drive folder.</p>
          <input type="text" data-skill-key="graphics_portfolio" placeholder="e.g. Illustrator & Figma · behance.net/... or Drive link" value="${saved.graphics_portfolio || ''}" required>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>20. Campus Kindness Concept <span class="required">*</span></label>
          </div>
          <p class="question-note">Describe a visual poster, sticker, or infographic concept that would convince students not to harm or fear campus stray dogs and cats.</p>
          <textarea rows="3" data-skill-key="graphics_concept" placeholder="Visual layout, colors, mascot illustration, and slogan..." required>${saved.graphics_concept || ''}</textarea>
        </div>

        <div class="filter-question-card">
          <div class="question-header">
            <label>21. Urgent Alert Design Commitment <span class="required">*</span></label>
          </div>
          <p class="question-note">Are you able to deliver urgent emergency posters (e.g. Critical Blood Donor appeal or Lost Animal flyer) within a few hours when needed?</p>
          <div class="radio-pill-group">
            <label class="radio-pill">
              <input type="radio" name="graphics_urgent" value="Yes" ${saved.graphics_urgent === 'Yes' ? 'checked' : ''} required>
              <span>Yes, ready for same-day emergency flyers</span>
            </label>
            <label class="radio-pill">
              <input type="radio" name="graphics_urgent" value="Within 24h" ${saved.graphics_urgent === 'Within 24h' ? 'checked' : ''}>
              <span>Usually within 24 hours</span>
            </label>
            <label class="radio-pill danger-opt">
              <input type="radio" name="graphics_urgent" value="No" ${saved.graphics_urgent === 'No' ? 'checked' : ''}>
              <span>No, need more notice</span>
            </label>
          </div>
        </div>
      `;
    }
  }


  // --- STRICT FILTER RULES & EVALUATION ---
  function evaluateStrictFilters() {
    const violations = [];

    // Q14 Filter
    if (state.draft.q14MissClass === 'No') {
      violations.push({
        title: 'Class Availability During Emergencies (Q14)',
        message: 'Animal welfare emergencies (e.g. severe bleeding, animal trapped in drain, critical accident) happen without warning. Active members and core team must be willing to step out or adjust class hours when a life is in danger on campus.'
      });
    }

    // Q15 Filter
    if (state.draft.q15Leniency === 'No') {
      violations.push({
        title: 'Attendance Leniency & Society Commitment (Q15)',
        message: 'The society actively advocates for official academic leniency with faculty so students face no penalties; in return, our covenant requires you to show up when called.'
      });
    }

    // Q18 Filter
    if (state.draft.q18Responsibility === 'No') {
      violations.push({
        title: 'Responsibility vs Title (Q18)',
        message: 'Our society cannot accept passive members looking solely for a society logo on their resume. We are caretakers of living, feeling beings.'
      });
    }

    // Tail Savers (Rescue Team) Strict Filters
    if (state.draft.firstChoiceTeam === 'rescue') {
      if (state.draft.q19CallHour === 'No') {
        violations.push({
          title: 'Tail Savers 24/7 Availability (Q19)',
          message: 'Campus animals often suffer accidents late at night or early morning. Rescuers must be reachable and prepared for emergency shifts outside standard daytime hours.'
        });
      }

      if (state.draft.q22Handling === 'No') {
        violations.push({
          title: 'Handling Sick / Bleeding Animals (Q22)',
          message: 'Tail Savers are on the frontlines. Even if you don\'t have veterinary experience today, you must be willing to learn hands-on safe handling and basic triage.'
        });
      }

      if (state.draft.q23bWillingShots === 'No') {
        violations.push({
          title: 'Mandatory Rabies & Tetanus Vaccination (Q23b)',
          message: 'Volunteer safety is sacred. Handling distressed or injured animals carries real risk of bites and scratches. Active rescuers MUST obtain rabies and tetanus immunization yourself before going into the field.'
        });
      }
    }

    return violations;
  }

  function showStrictModal(violations) {
    state.strictViolations = violations;
    const modal = document.getElementById('filterModal');
    const reasonText = document.getElementById('modalReasonText');
    if (!modal || !reasonText) return;

    let html = '';
    violations.forEach(v => {
      html += `
        <div style="margin-bottom: 0.85rem; text-align: left; background: #FFF5F2; padding: 0.75rem 1rem; border-radius: 8px; border-left: 3px solid #DE6B48;">
          <strong style="color: #DE6B48; display: block; font-size: 0.9rem; margin-bottom: 0.2rem;">⚠️ ${v.title}</strong>
          <span style="font-size: 0.84rem; color: #555;">${v.message}</span>
        </div>
      `;
    });

    reasonText.innerHTML = html;
    modal.classList.remove('hidden');
    playSound('warning');
  }

  function hideStrictModal() {
    const modal = document.getElementById('filterModal');
    if (modal) modal.classList.add('hidden');
  }

  // --- LEVEL 7: SUMMARY & RESCUER CARD GENERATION ---
  function renderSummaryReview() {
    const grid = document.getElementById('summaryDetailsGrid');
    if (!grid) return;

    const team1 = TEAMS[state.draft.firstChoiceTeam]?.name || state.draft.firstChoiceTeam;
    const team2 = TEAMS[state.draft.secondChoiceTeam]?.name || state.draft.secondChoiceTeam;
    const roleTitle = state.draft.teamRole === 'Lead' ? '👑 Squad Lead' : '🐾 Active Member';

    grid.innerHTML = `
      <div class="summary-item">
        <span class="summary-label">Full Name</span>
        <span class="summary-val">${escapeHtml(state.draft.fullName)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Roll Number</span>
        <span class="summary-val">${escapeHtml(state.draft.rollNo)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Degree & Semester</span>
        <span class="summary-val">${escapeHtml(state.draft.degreeSem)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">WhatsApp Contact</span>
        <span class="summary-val">${escapeHtml(state.draft.whatsappNo)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Primary Squad</span>
        <span class="summary-val" style="color: var(--primary-coral); font-weight:700;">${escapeHtml(team1)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Applied Role</span>
        <span class="summary-val" style="color: #B46E14; font-weight:700;">${escapeHtml(roleTitle)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Secondary Squad</span>
        <span class="summary-val">${escapeHtml(team2)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Hours / Week</span>
        <span class="summary-val">${escapeHtml(state.draft.q16Hours)} hrs</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Willing to Skip Class</span>
        <span class="summary-val">${escapeHtml(state.draft.q14MissClass)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Vaccination Status</span>
        <span class="summary-val">${state.draft.shotsStatus.join(', ') || 'Safety pledge confirmed'}</span>
      </div>
    `;
  }

  function generateRescuerCard(candidate) {
    const t = TEAMS[candidate.firstChoiceTeam] || TEAMS.core;
    const roleSuffix = candidate.teamRole === 'Lead' ? 'Squad Lead' : 'Active Rescuer';

    document.getElementById('badgeCandidateName').textContent = candidate.fullName || 'Valued Rescuer';
    document.getElementById('badgeCandidateRoll').textContent = candidate.rollNo || 'AWS-STUDENT';
    document.getElementById('badgeAssignedTeam').textContent = `${t.name} · ${roleSuffix}`;
    document.getElementById('badgeRankTag').textContent = candidate.teamRole === 'Lead' ? 'Squad Lead' : t.cadetRank;
    document.getElementById('badgeRescuerId').textContent = candidate.rescuerId;
    document.getElementById('badgeAvatarEmoji').textContent = t.emoji;
  }

  // --- DOWNLOAD CARD AS PNG (HTML5 CANVAS RENDERING) ---
  function downloadCardAsPng() {
    const cardEl = document.getElementById('rescuerCardElement');
    if (!cardEl) return;

    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = 480 * scale;
    canvas.height = 290 * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const candidate = state.draft;
    const t = TEAMS[candidate.firstChoiceTeam] || TEAMS.core;
    const roleSuffix = candidate.teamRole === 'Lead' ? 'Squad Lead' : 'Rescuer';

    // Draw card background
    const grad = ctx.createLinearGradient(0, 0, 480, 290);
    grad.addColorStop(0, '#1C1512');
    grad.addColorStop(1, '#2D221D');
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, 480, 290, 20);
    ctx.fill();

    // Card border
    ctx.strokeStyle = '#E29933';
    ctx.lineWidth = 3;
    roundRect(ctx, 0, 0, 480, 290, 20);
    ctx.stroke();

    // Top header
    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('🐾 ANIMAL WELFARE SOCIETY', 20, 36);

    ctx.fillStyle = '#E29933';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('OFFICIAL CADET PASS · 2026 · @PETS.SECURE', 20, 52);

    // Verified badge
    ctx.fillStyle = '#E29933';
    roundRect(ctx, 395, 20, 65, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#1C1512';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('VERIFIED', 405, 36);

    // Divider line
    ctx.strokeStyle = 'rgba(226, 153, 51, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 68);
    ctx.lineTo(460, 68);
    ctx.stroke();

    // Avatar box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, 25, 85, 80, 80, 12);
    ctx.fill();
    ctx.strokeStyle = '#E29933';
    ctx.stroke();

    // Avatar emoji
    ctx.font = '40px "Segoe UI Emoji", sans-serif';
    ctx.fillText(t.emoji, 45, 140);

    // Rank tag below avatar
    ctx.fillStyle = 'rgba(226, 153, 51, 0.15)';
    roundRect(ctx, 16, 175, 98, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#E29933';
    ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(roleSuffix.toUpperCase(), 65, 188);
    ctx.textAlign = 'left';

    // Candidate details
    ctx.fillStyle = 'rgba(250, 247, 242, 0.5)';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CANDIDATE NAME', 125, 95);

    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 17px "Outfit", sans-serif';
    ctx.fillText(candidate.fullName || 'Candidate Rescuer', 125, 115);

    ctx.fillStyle = 'rgba(250, 247, 242, 0.5)';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ROLL NUMBER', 125, 138);

    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(candidate.rollNo || '00-BS-000', 125, 154);

    // Row: Squad + Rescuer ID
    ctx.fillStyle = 'rgba(250, 247, 242, 0.5)';
    ctx.fillText('SQUAD & ROLE', 125, 178);
    ctx.fillStyle = '#DE6B48';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${t.name} (${roleSuffix})`, 125, 194);

    ctx.fillStyle = 'rgba(250, 247, 242, 0.5)';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('RESCUER ID', 315, 178);
    ctx.fillStyle = '#E29933';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(candidate.rescuerId, 315, 194);

    // Bottom barcode area
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(20, 220);
    ctx.lineTo(460, 220);
    ctx.stroke();

    ctx.fillStyle = 'rgba(250, 247, 242, 0.4)';
    ctx.font = '8px monospace';
    ctx.fillText('||||||| | ||||| || |||||||| |||| | |||||||||| || |||', 25, 242);
    ctx.fillText('CODE OF COMPASSION · AWS CHAPTER · @PETS.SECURE', 25, 260);

    ctx.font = '22px "Segoe UI Emoji", sans-serif';
    ctx.fillText('🐾', 430, 255);

    const link = document.createElement('a');
    link.download = `Rescuer-Card-${candidate.fullName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    playSound('success');
  }

  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y + radius, x + radius, y);
    ctx.closePath();
  }

  // --- SEPARATE SUCCESS SCREEN: WELCOME TO THE PACK ---
  function showSuccessScreen() {
    const screens = document.querySelectorAll('.quest-screen');
    screens.forEach(s => s.classList.remove('active'));

    const successScreen = document.getElementById('level-success');
    if (successScreen) {
      successScreen.classList.add('active');
    }

    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
      progressFill.style.width = '100%';
    }

    const stepNodes = document.querySelectorAll('.quest-steps-row .step-node');
    stepNodes.forEach(node => {
      node.classList.remove('active');
      node.classList.add('completed');
    });

    state.currentLevel = 8;
    generateRescuerCard(state.draft);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playSound('success');
  }

  // --- SUBMISSION HANDLER ---
  async function handleFormSubmit() {
    const confirmation = document.getElementById('q26Confirmation');
    if (!confirmation || !confirmation.checked) {
      alert('Please check the confirmation pledge in Question 26 to seal your application!');
      return;
    }

    // Disable button to prevent double-submit
    const submitBtn = document.getElementById('btnFinalSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
    }

    state.draft.q25AnythingElse = document.getElementById('q25AnythingElse')?.value.trim() || '';
    state.draft.q26Confirmation = true;

    const randomHex = Math.floor(1000 + Math.random() * 9000);
    state.draft.rescuerId = `AWS-2026-PAW-${randomHex}`;
    state.draft.submittedAt = new Date().toLocaleString();

    try {
      // Await the database operation so errors catch properly
      await saveSubmission(state.draft);
    } catch (err) {
      console.error('Supabase save error:', err);
      alert('Failed to save application to Supabase: ' + (err.message || err));
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Seal My Application 🐾';
      }
      return; // Stop execution if database insert fails
    }

    saveDraft();

    if (window.confetti) {
      window.confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#DE6B48', '#E29933', '#4E7C6D', '#FFD166']
      });
    }

    showSuccessScreen();
  }

  // --- ADMIN PORTAL LOGIC ---
  function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;
    renderSubmissionsTable();
    modal.classList.remove('hidden');
  }

  function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.add('hidden');
  }

  function renderSubmissionsTable() {
    const tbody = document.getElementById('submissionsTableBody');
    if (!tbody) return;
    const subs = getSubmissions();

    if (subs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 2rem;">No applicants yet. Share the quest link!</td></tr>`;
      return;
    }

    tbody.innerHTML = subs.map(s => {
      const t = TEAMS[s.firstChoiceTeam]?.name || s.firstChoiceTeam;
      return `
        <tr>
          <td><strong style="font-family:monospace; color:var(--primary-coral);">${escapeHtml(s.rescuerId || '-')}</strong></td>
          <td><strong>${escapeHtml(s.fullName || '-')}</strong> (${escapeHtml(s.teamRole || 'Member')})</td>
          <td>${escapeHtml(s.rollNo || '-')}</td>
          <td>${escapeHtml(t || '-')}</td>
          <td><a href="https://wa.me/${encodeURIComponent(s.whatsappNo.replace(/[^0-9]/g, ''))}" target="_blank" style="color:#25D366; text-decoration:none; font-weight:700;">${escapeHtml(s.whatsappNo || '-')}</a></td>
          <td>${escapeHtml(s.q14MissClass || '-')}</td>
          <td>${escapeHtml((s.shotsStatus || []).join(', ') || 'Pledged')}</td>
          <td style="font-size:0.75rem;">${escapeHtml(s.submittedAt || '-')}</td>
        </tr>
      `;
    }).join('');
  }

  function exportSubmissionsCSV() {
    const subs = getSubmissions();
    if (subs.length === 0) {
      alert('No submissions to export yet!');
      return;
    }

    const headers = [
      'Rescuer ID', 'Full Name', 'Roll Number', 'Degree & Semester', 'Email',
      'WhatsApp', 'Past Volunteering', '1st Choice Team', 'Applied Role', '2nd Choice Team',
      'Why Team', 'Care Meaning', 'Helped Stray Story', 'Skills', 'Animal Comfort',
      'Willing Miss Class (Q14)', 'Leniency Agreed (Q15)', 'Hours/Week (Q16)',
      'Campus Presence (Q17)', 'Responsibility Understood (Q18)', 'Shots Status',
      'Additional Info (Q25)', 'Submitted Date'
    ];

    const rows = subs.map(s => [
      s.rescuerId,
      s.fullName,
      s.rollNo,
      s.degreeSem,
      s.uniEmail,
      s.whatsappNo,
      s.pastVolunteering + (s.volunteerDetails ? ` (${s.volunteerDetails})` : ''),
      TEAMS[s.firstChoiceTeam]?.name || s.firstChoiceTeam,
      s.teamRole || 'Member',
      TEAMS[s.secondChoiceTeam]?.name || s.secondChoiceTeam,
      s.whyTeam,
      s.q10CareMeaning,
      s.q11HelpedStray,
      s.q12SkillsBrought,
      s.q13Comfort,
      s.q14MissClass,
      s.q15Leniency,
      s.q16Hours,
      s.q17Campus,
      s.q18Responsibility,
      (s.shotsStatus || []).join('; ') || s.q23bWillingShots || 'N/A',
      s.q25AnythingElse || 'N/A',
      s.submittedAt
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = `AWS-Recruitment-Submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    playSound('success');
  }

  function escapeCsv(val) {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- INITIALIZATION & EVENT LISTENERS ---
  function init() {
    loadDraft();
    updateSubmissionCountBadge();

    // 1. Interactive 6 Characters on Welcome Page
    document.querySelectorAll('.animal-char-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.animal-char-card').forEach(c => c.classList.remove('active-char'));
        card.classList.add('active-char');
        const speech = card.getAttribute('data-speech');
        const speechText = document.getElementById('characterSpeechText');
        if (speechText && speech) {
          speechText.textContent = speech;
        }
        playSound('click');
      });
    });

    // 2. Audio Toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        document.getElementById('audioIcon').textContent = state.audioEnabled ? '🔊' : '🔇';
        document.getElementById('audioText').textContent = state.audioEnabled ? 'Audio On' : 'Muted';
        if (state.audioEnabled) playSound('click');
      });
    }

    // 3. Admin Modal Toggle
    document.getElementById('adminToggleBtn')?.addEventListener('click', openAdminModal);
    document.getElementById('btnCloseAdmin')?.addEventListener('click', closeAdminModal);
    document.getElementById('btnExportCSV')?.addEventListener('click', exportSubmissionsCSV);
    document.getElementById('btnClearData')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all stored submissions? This cannot be undone.')) {
        localStorage.removeItem('paw_quest_submissions');
        renderSubmissionsTable();
        updateSubmissionCountBadge();
      }
    });

    // 4. Stepper navigation click
    document.querySelectorAll('.step-node').forEach(node => {
      node.addEventListener('click', () => {
        const step = parseInt(node.getAttribute('data-step'), 10);
        if (step <= state.currentLevel) {
          goToStep(step);
        }
      });
    });

    // 5. Level 1 -> 2
    document.getElementById('btnStartQuest')?.addEventListener('click', () => {
      goToStep(2);
    });

    // 6. Back / Next buttons generic handling
    document.querySelectorAll('.prev-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.getAttribute('data-target'), 10);
        goToStep(target);
      });
    });

    document.querySelectorAll('.next-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.getAttribute('data-target'), 10);
        goToStep(target);
      });
    });

    // 7. Level 3 validation
    document.querySelectorAll('input[name="pastVolunteering"]').forEach(r => {
      r.addEventListener('change', (e) => {
        const box = document.getElementById('volunteerDetailsBox');
        if (box) box.classList.toggle('hidden', e.target.value !== 'Yes');
        state.draft.pastVolunteering = e.target.value;
        saveDraft();
      });
    });

    document.getElementById('btnNextLevel3')?.addEventListener('click', () => {
      const name = document.getElementById('fullName').value.trim();
      const roll = document.getElementById('rollNo').value.trim();
      const deg = document.getElementById('degreeSem').value.trim();
      const email = document.getElementById('uniEmail').value.trim();
      const phone = document.getElementById('whatsappNo').value.trim();
      const pastVol = getRadio('pastVolunteering');

      if (!name || !roll || !deg || !email || !phone || !pastVol) {
        alert('Please fill in all required fields (1 to 6) before continuing!');
        return;
      }

      state.draft.fullName = name;
      state.draft.rollNo = roll;
      state.draft.degreeSem = deg;
      state.draft.uniEmail = email;
      state.draft.whatsappNo = phone;
      state.draft.pastVolunteering = pastVol;
      state.draft.volunteerDetails = document.getElementById('volunteerDetails')?.value.trim() || '';

      saveDraft();
      goToStep(4);
    });

    // 8. Level 4 Team Selection & Role Choice
    document.querySelectorAll('.team-card').forEach(card => {
      card.addEventListener('click', () => {
        const teamKey = card.getAttribute('data-team');
        highlightTeamCard(teamKey);
        state.draft.firstChoiceTeam = teamKey;
        setValue('firstChoiceTeam', teamKey);
        playSound('click');
        saveDraft();
      });
    });

    document.querySelectorAll('input[name="teamRole"]').forEach(r => {
      r.addEventListener('change', (e) => {
        state.draft.teamRole = e.target.value;
        saveDraft();
      });
    });

    document.getElementById('secondChoiceTeam')?.addEventListener('change', (e) => {
      state.draft.secondChoiceTeam = e.target.value;
      saveDraft();
    });

    document.getElementById('btnNextLevel4')?.addEventListener('click', () => {
      const team1 = state.draft.firstChoiceTeam;
      const role = getRadio('teamRole');
      const team2 = document.getElementById('secondChoiceTeam').value;
      const why = document.getElementById('whyTeam').value.trim();

      if (!team1) {
        alert('Please select your 1st Choice Team card!');
        return;
      }
      if (!role) {
        alert('Please select whether you are applying as Squad Lead or Active Team Member!');
        return;
      }
      if (!team2) {
        alert('Please pick your 2nd Choice Team (Backup Squad)!');
        return;
      }
      if (team1 === team2) {
        alert('Please select two distinct squads for your 1st and 2nd choices!');
        return;
      }
      if (!why) {
        alert('Please write 2-3 lines explaining why you chose this team and role!');
        return;
      }

      state.draft.teamRole = role;
      state.draft.secondChoiceTeam = team2;
      state.draft.whyTeam = why;
      saveDraft();
      goToStep(5);
    });

    // 9. Level 5 Story
    document.getElementById('btnNextLevel5')?.addEventListener('click', () => {
      const q10 = document.getElementById('q10CareMeaning').value.trim();
      const q11 = document.getElementById('q11HelpedStray').value.trim();
      const q12 = document.getElementById('q12SkillsBrought').value.trim();
      const q13 = getRadio('q13Comfort');

      if (!q10 || !q11 || !q12 || !q13) {
        alert('Please share your thoughts on all questions in this level before moving on.');
        return;
      }

      state.draft.q10CareMeaning = q10;
      state.draft.q11HelpedStray = q11;
      state.draft.q12SkillsBrought = q12;
      state.draft.q13Comfort = q13;

      saveDraft();
      goToStep(6);
    });

    // 10. Level 6 Commitment & Specific Team Questions Validation
    document.getElementById('btnNextLevel6')?.addEventListener('click', () => {
      // Validate Part A
      const q14 = getRadio('q14MissClass');
      const q15 = getRadio('q15Leniency');
      const q16 = getRadio('q16Hours');
      const q17 = getRadio('q17Campus');
      const q18 = getRadio('q18Responsibility');

      if (!q14 || !q15 || !q16 || !q17 || !q18) {
        alert('Please answer all General Commitment questions in Part A (Questions 14 to 18)!');
        return;
      }

      state.draft.q14MissClass = q14;
      state.draft.q15Leniency = q15;
      state.draft.q16Hours = q16;
      state.draft.q17Campus = q17;
      state.draft.q18Responsibility = q18;

      // Validate Part B (Specific Team Questions)
      const primaryTeam = state.draft.firstChoiceTeam;

      if (primaryTeam === 'rescue') {
        const q19 = getRadio('q19CallHour');
        const q20 = getRadio('q20ResponseTime');
        const q21 = getRadio('q21Transport');
        const q22 = getRadio('q22Handling');
        const q23b = getRadio('q23bWillingShots');
        const q24 = document.getElementById('q24Scenario')?.value.trim();

        const selectedShots = [];
        document.querySelectorAll('input[name="shotsStatus"]:checked').forEach(c => selectedShots.push(c.value));

        if (!q19 || !q20 || !q21 || !q22 || !q23b || !q24) {
          alert('Please answer all mandatory Rescue Team readiness questions in Part B (Questions 19 to 24)!');
          return;
        }

        if (selectedShots.length === 0) {
          alert('Please check at least one box in Question 23a regarding your vaccination status!');
          return;
        }

        state.draft.q19CallHour = q19;
        state.draft.q20ResponseTime = q20;
        state.draft.q21Transport = q21;
        state.draft.q22Handling = q22;
        state.draft.shotsStatus = selectedShots;
        state.draft.q23bWillingShots = q23b;
        state.draft.q24Scenario = q24;

      } else {
        // Collect & validate text inputs and radio buttons in Part B
        let allPartBAnswered = true;
        let missingFieldName = '';

        document.querySelectorAll('#partBSpecificQuestionsContainer textarea, #partBSpecificQuestionsContainer input[type="text"]').forEach(input => {
          const key = input.getAttribute('data-skill-key');
          if (key) {
            const val = input.value.trim();
            if (!val) {
              allPartBAnswered = false;
              missingFieldName = input.previousElementSibling?.textContent || 'Part B questions';
            }
            state.draft.teamSpecificAnswers[key] = val;
          }
        });

        // Validate Part B radio groups (e.g. core_availability, events_logistics, social_consistency, video_turnaround, graphics_urgent)
        document.querySelectorAll('#partBSpecificQuestionsContainer input[type="radio"]').forEach(radio => {
          const groupName = radio.name;
          const chosen = getRadio(groupName);
          if (!chosen) {
            allPartBAnswered = false;
          } else {
            state.draft.teamSpecificAnswers[groupName] = chosen;
          }
        });

        if (!allPartBAnswered) {
          alert('Please answer all mandatory team-specific questions marked with * in Part B before continuing!');
          return;
        }
      }

      // Evaluate Strict Filters
      const violations = evaluateStrictFilters();
      if (violations.length > 0) {
        showStrictModal(violations);
        return;
      }

      saveDraft();
      goToStep(7);
    });

    // 11. Strict Modal Actions
    document.getElementById('btnModalRevise')?.addEventListener('click', () => {
      hideStrictModal();
      goToStep(6);
    });

    document.getElementById('btnModalSupporter')?.addEventListener('click', () => {
      hideStrictModal();
      alert('❤️ Thank you! You have been registered in our Animal Welfare Honorary Supporter Circle. We will invite you to all community camps, adoption drives, and pet walks!');
      goToStep(1);
    });

    // 12. Level 7 Submit & Download
    document.getElementById('btnSubmitQuest')?.addEventListener('click', handleFormSubmit);
    document.getElementById('btnDownloadCard')?.addEventListener('click', downloadCardAsPng);

    document.getElementById('btnShareApp')?.addEventListener('click', () => {
      const text = `🐾 I just registered for the Animal Welfare Society recruitment quest! My Rescuer ID is ${state.draft.rescuerId}. Join us to protect campus paws: ${window.location.href}`;
      if (navigator.share) {
        navigator.share({ title: 'Animal Welfare Society Rescuer', text, url: window.location.href });
      } else {
        navigator.clipboard.writeText(text);
        alert('Share message copied to your clipboard!');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();