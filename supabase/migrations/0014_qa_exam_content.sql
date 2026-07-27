-- =============================================================================
-- LBET — QA test exam content (5 sections × 10 items, Foundation → Executive)
-- =============================================================================
-- Idempotent. Requires 0001–0002 (items table + question_type 1..6 + source
-- types) and the exam row 11111111-1111-1111-1111-111111111111 (placeholder
-- exam from seed_placeholder.sql).
--
-- Replaces the placeholder items with real, escalating business-English content
-- for end-to-end QA. Composition per section (matches the engine): 6× type 1
-- (MCQ correct), 1× type 2 (choose the wrong one), 1× type 4 (name the term,
-- auto/AI), 1× type 5 (write the definition, AI), 1× voice (type 3 respond to a
-- situation on odd sections / type 6 speak about the source on even sections).
-- Types 3/4/5/6 carry real rubrics. Deterministic ids → safe to re-run.
--
-- Existing items for this exam are deactivated first (not deleted, to avoid FK
-- issues with any responses); the 50 rows below are upserted as the active set.
-- =============================================================================

update public.items set active = false
 where exam_id = '11111111-1111-1111-1111-111111111111';

insert into public.items
  (id, exam_id, lbe_level, question_type, source_type, prompt, options, answer_key, rubric, active)
values
-- ===================== SECTION 1 — Foundation (LBE 1) =====================
('a0000000-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111',1,1,null,
 'Which word means a fixed date by which work must be finished?',
 '[{"id":"a","text":"Agenda"},{"id":"b","text":"Deadline"},{"id":"c","text":"Invoice"},{"id":"d","text":"Colleague"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111',1,1,null,
 'Your manager writes "Please CC me on that email." What does CC mean?',
 '[{"id":"a","text":"Delete the email"},{"id":"b","text":"Send them a copy"},{"id":"c","text":"Reply only to the manager"},{"id":"d","text":"Print the email"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111',1,1,'email',
 'Email — "Hi Sam, please send me the sales figures before 3 pm today. Thanks, Lin." What does Lin want?',
 '[{"id":"a","text":"A meeting"},{"id":"b","text":"The sales figures before 3 pm"},{"id":"c","text":"A phone call"},{"id":"d","text":"A day off"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000004','11111111-1111-1111-1111-111111111111',1,1,null,
 'Choose the correct way to begin a formal email.',
 '[{"id":"a","text":"Yo!"},{"id":"b","text":"Dear Mr Ali,"},{"id":"c","text":"Hey there,"},{"id":"d","text":"Sup,"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000005','11111111-1111-1111-1111-111111111111',1,1,'dialogue',
 'A: "Are you free for a quick call at 2 pm?"
B: "___"
Which reply is polite and clear?',
 '[{"id":"a","text":"No."},{"id":"b","text":"Sure, 2 pm works for me."},{"id":"c","text":"Maybe, whatever."},{"id":"d","text":"Why?"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000006','11111111-1111-1111-1111-111111111111',1,1,null,
 'Which word means a person you work with?',
 '[{"id":"a","text":"Customer"},{"id":"b","text":"Colleague"},{"id":"c","text":"Supplier"},{"id":"d","text":"Client"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000007','11111111-1111-1111-1111-111111111111',1,2,null,
 'All of these are polite ways to ask for help EXCEPT one. Choose the impolite option.',
 '[{"id":"a","text":"Could you help me with this?"},{"id":"b","text":"Would you mind checking this?"},{"id":"c","text":"Do this now."},{"id":"d","text":"When you have a moment, could you review this?"}]'::jsonb,
 '{"correct":"c"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000008','11111111-1111-1111-1111-111111111111',1,4,null,
 'Name the term: a document a seller sends a buyer that lists goods or services and requests payment.',
 null,'{"accept":["invoice","an invoice"]}'::jsonb,
 '{"version":1,"max_score":1,"pass_threshold":0.6,"criteria":[{"id":"term","description":"Names the correct business term (accept minor spelling variants)","weight":1}],"model_answer":"invoice","guidance":"Full credit for the correct term; ignore spelling variants."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000009','11111111-1111-1111-1111-111111111111',1,5,null,
 'Write the definition of the term: "deadline".',
 null,null,
 '{"version":1,"max_score":2,"pass_threshold":0.6,"criteria":[{"id":"accuracy","description":"Captures the core meaning of the term","weight":1},{"id":"clarity","description":"Expressed clearly in the candidate''s own words","weight":1}],"model_answer":"The date or time by which a task must be completed.","guidance":"Credit correct meaning even if wording differs; ignore spelling/grammar."}'::jsonb,true),
('a0000000-0000-4000-8000-00000000000a','11111111-1111-1111-1111-111111111111',1,3,'situation',
 'Situation: A colleague asks you to join a short team meeting tomorrow morning. Respond politely, saying whether you can attend and confirming the time.',
 null,null,
 '{"version":1,"max_score":3,"pass_threshold":0.6,"criteria":[{"id":"relevance","description":"Directly addresses the situation","weight":1},{"id":"appropriateness","description":"Uses tone and register appropriate to the workplace","weight":1},{"id":"clarity","description":"Communicates clearly and coherently","weight":1}],"guidance":"Grade from the transcript; ignore transcription artifacts and minor disfluencies."}'::jsonb,true),

-- ===================== SECTION 2 — Operational (LBE 2) =====================
('a0000000-0000-4000-8000-00000000000b','11111111-1111-1111-1111-111111111111',2,1,null,
 'A customer emails: "My order has not arrived." What is the best first response?',
 '[{"id":"a","text":"Ignore it"},{"id":"b","text":"Sorry to hear that — could you share your order number so I can check?"},{"id":"c","text":"That is not my problem."},{"id":"d","text":"Call back later."}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000000c','11111111-1111-1111-1111-111111111111',2,1,'email',
 'Email — "Please reschedule our Tuesday call to Thursday at the same time." What is being changed?',
 '[{"id":"a","text":"The day of the call"},{"id":"b","text":"The topic"},{"id":"c","text":"The attendees"},{"id":"d","text":"The price"}]'::jsonb,
 '{"correct":"a"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000000d','11111111-1111-1111-1111-111111111111',2,1,null,
 'Which phrase best confirms you will complete a task?',
 '[{"id":"a","text":"I will take care of it."},{"id":"b","text":"Maybe someday."},{"id":"c","text":"I am not sure."},{"id":"d","text":"It depends."}]'::jsonb,
 '{"correct":"a"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000000e','11111111-1111-1111-1111-111111111111',2,1,'memo',
 'Memo — "All staff must submit their timesheets by Friday at 5 pm." By when must timesheets be submitted?',
 '[{"id":"a","text":"Monday"},{"id":"b","text":"Friday at 5 pm"},{"id":"c","text":"End of the month"},{"id":"d","text":"Any time"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000000f','11111111-1111-1111-1111-111111111111',2,1,null,
 'In a product catalogue, what does "in stock" mean?',
 '[{"id":"a","text":"Sold out"},{"id":"b","text":"Available to buy now"},{"id":"c","text":"On sale"},{"id":"d","text":"Discontinued"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000010','11111111-1111-1111-1111-111111111111',2,1,'dialogue',
 'A: "Can we move the deadline?"
B: "___ we can extend it by two days."
Choose the best word to complete B.',
 '[{"id":"a","text":"Unfortunately,"},{"id":"b","text":"Sure,"},{"id":"c","text":"Never,"},{"id":"d","text":"No,"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000011','11111111-1111-1111-1111-111111111111',2,2,null,
 'Choose the WRONG (unprofessional) way to end a customer email.',
 '[{"id":"a","text":"Best regards,"},{"id":"b","text":"Kind regards,"},{"id":"c","text":"Whatever,"},{"id":"d","text":"Thank you for your patience,"}]'::jsonb,
 '{"correct":"c"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000012','11111111-1111-1111-1111-111111111111',2,4,null,
 'Name the term: a person or company that provides goods or services to a business.',
 null,'{"accept":["supplier","a supplier","vendor","a vendor"]}'::jsonb,
 '{"version":1,"max_score":1,"pass_threshold":0.6,"criteria":[{"id":"term","description":"Names the correct business term (accept supplier or vendor)","weight":1}],"model_answer":"supplier","guidance":"Full credit for supplier or vendor; ignore spelling variants."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000013','11111111-1111-1111-1111-111111111111',2,5,null,
 'Write the definition of the term: "refund".',
 null,null,
 '{"version":1,"max_score":2,"pass_threshold":0.6,"criteria":[{"id":"accuracy","description":"Captures the core meaning (money returned to a customer)","weight":1},{"id":"clarity","description":"Expressed clearly in the candidate''s own words","weight":1}],"model_answer":"Money returned to a customer for a product or service they paid for.","guidance":"Credit correct meaning even if wording differs."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000014','11111111-1111-1111-1111-111111111111',2,6,'memo',
 'Memo — "Delivery of the March order is delayed by one week due to a supplier issue. Please inform affected customers."
Speak for 30–60 seconds: explain the situation to a customer and say what you will do next.',
 null,null,
 '{"version":1,"max_score":3,"pass_threshold":0.6,"criteria":[{"id":"comprehension","description":"Shows understanding of the source material","weight":1},{"id":"development","description":"Explains the delay and a clear next step","weight":1},{"id":"delivery","description":"Speaks clearly and professionally","weight":1}],"guidance":"Grade from the transcript; ignore transcription artifacts."}'::jsonb,true),

-- ===================== SECTION 3 — Professional (LBE 3) =====================
('a0000000-0000-4000-8000-000000000015','11111111-1111-1111-1111-111111111111',3,1,'email',
 'Email — "We would like to proceed, but the timeline is tight. Could you confirm whether delivery by 30 June is feasible?" What is the sender asking?',
 '[{"id":"a","text":"To cancel the project"},{"id":"b","text":"Whether delivery by 30 June is possible"},{"id":"c","text":"For a discount"},{"id":"d","text":"To change suppliers"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000016','11111111-1111-1111-1111-111111111111',3,1,null,
 'Which sentence is the most diplomatic way to disagree in a meeting?',
 '[{"id":"a","text":"You are wrong."},{"id":"b","text":"I see your point, but I have a different view."},{"id":"c","text":"That makes no sense."},{"id":"d","text":"No."}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000017','11111111-1111-1111-1111-111111111111',3,1,'mini_article',
 'Article — "The company will pilot the new system with one team before a full rollout." What does "pilot" mean here?',
 '[{"id":"a","text":"Fly a plane"},{"id":"b","text":"Test on a small scale first"},{"id":"c","text":"Cancel"},{"id":"d","text":"Launch to everyone at once"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000018','11111111-1111-1111-1111-111111111111',3,1,null,
 'What does it mean "to follow up" on an email?',
 '[{"id":"a","text":"Delete it"},{"id":"b","text":"Send a later message to check progress"},{"id":"c","text":"Forward it to everyone"},{"id":"d","text":"Ignore it"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000019','11111111-1111-1111-1111-111111111111',3,1,'dialogue',
 'A: "Can you take the lead on this proposal?"
B: "___"
Choose the most professional acceptance.',
 '[{"id":"a","text":"I guess so."},{"id":"b","text":"Yes, I will own it and share a draft by Friday."},{"id":"c","text":"Not really my job."},{"id":"d","text":"Whatever works."}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000001a','11111111-1111-1111-1111-111111111111',3,1,null,
 'Which word means the people or groups affected by a project or decision?',
 '[{"id":"a","text":"Competitors"},{"id":"b","text":"Stakeholders"},{"id":"c","text":"Auditors"},{"id":"d","text":"Suppliers"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000001b','11111111-1111-1111-1111-111111111111',3,2,null,
 'In a written proposal, choose the phrase that is TOO informal and should NOT be used.',
 '[{"id":"a","text":"We recommend the following approach."},{"id":"b","text":"Our proposed solution is as follows."},{"id":"c","text":"Anyway, here is the stuff."},{"id":"d","text":"We estimate the timeline as follows."}]'::jsonb,
 '{"correct":"c"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000001c','11111111-1111-1111-1111-111111111111',3,4,null,
 'Name the term: a planned series of tasks with a defined goal, timeline, and resources.',
 null,'{"accept":["project","a project"]}'::jsonb,
 '{"version":1,"max_score":1,"pass_threshold":0.6,"criteria":[{"id":"term","description":"Names the correct business term","weight":1}],"model_answer":"project","guidance":"Full credit for the correct term."}'::jsonb,true),
('a0000000-0000-4000-8000-00000000001d','11111111-1111-1111-1111-111111111111',3,5,null,
 'Write the definition of the term: "negotiation".',
 null,null,
 '{"version":1,"max_score":2,"pass_threshold":0.6,"criteria":[{"id":"accuracy","description":"Captures the core meaning (reaching agreement between parties)","weight":1},{"id":"clarity","description":"Expressed clearly in the candidate''s own words","weight":1}],"model_answer":"A discussion aimed at reaching an agreement between two or more parties.","guidance":"Credit correct meaning even if wording differs."}'::jsonb,true),
('a0000000-0000-4000-8000-00000000001e','11111111-1111-1111-1111-111111111111',3,3,'situation',
 'Situation: A client is unhappy that a deliverable is two days late. Respond professionally: acknowledge the delay, explain briefly, and propose a way forward.',
 null,null,
 '{"version":1,"max_score":3,"pass_threshold":0.6,"criteria":[{"id":"relevance","description":"Acknowledges the delay and addresses the client concern","weight":1},{"id":"appropriateness","description":"Professional, accountable tone","weight":1},{"id":"clarity","description":"Proposes a clear way forward","weight":1}],"guidance":"Grade from the transcript; ignore transcription artifacts and minor disfluencies."}'::jsonb,true),

-- ================= SECTION 4 — Advanced Professional (LBE 4) =================
('a0000000-0000-4000-8000-00000000001f','11111111-1111-1111-1111-111111111111',4,1,'email',
 'Email — "Given the budget constraints this quarter, we need to prioritise initiatives with the highest ROI." What is being asked?',
 '[{"id":"a","text":"Spend more on everything"},{"id":"b","text":"Focus on initiatives with the best return on investment"},{"id":"c","text":"Cancel all projects"},{"id":"d","text":"Hire more staff"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000020','11111111-1111-1111-1111-111111111111',4,1,null,
 'What does "to escalate an issue" mean?',
 '[{"id":"a","text":"Make it smaller"},{"id":"b","text":"Raise it to a higher level of authority"},{"id":"c","text":"Delete it"},{"id":"d","text":"Ignore it"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000021','11111111-1111-1111-1111-111111111111',4,1,'mini_article',
 'Article — "The merger is expected to create synergies across the two firms'' sales teams." What are "synergies"?',
 '[{"id":"a","text":"Conflicts"},{"id":"b","text":"Combined benefits greater than the parts alone"},{"id":"c","text":"Layoffs"},{"id":"d","text":"Losses"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000022','11111111-1111-1111-1111-111111111111',4,1,null,
 'Choose the most appropriate phrase to manage stakeholder expectations.',
 '[{"id":"a","text":"It will definitely be perfect."},{"id":"b","text":"We anticipate strong results, though some risks remain."},{"id":"c","text":"Do not worry about anything."},{"id":"d","text":"It is impossible to say."}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000023','11111111-1111-1111-1111-111111111111',4,1,'memo',
 'Memo — "Effective Q3, all expenditures above 50,000 require director sign-off." What changes in Q3?',
 '[{"id":"a","text":"All spending stops"},{"id":"b","text":"Spending over 50,000 needs director approval"},{"id":"c","text":"Salaries increase"},{"id":"d","text":"Nothing changes"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000024','11111111-1111-1111-1111-111111111111',4,1,null,
 'Which term describes the potential for loss or an adverse outcome in a plan?',
 '[{"id":"a","text":"Milestone"},{"id":"b","text":"Risk"},{"id":"c","text":"Deliverable"},{"id":"d","text":"Agenda"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000025','11111111-1111-1111-1111-111111111111',4,2,null,
 'In a risk report, choose the statement that is inappropriately vague and should be avoided.',
 '[{"id":"a","text":"The main risk is supplier delay, rated high."},{"id":"b","text":"We will mitigate by dual-sourcing."},{"id":"c","text":"Stuff might go wrong somewhere."},{"id":"d","text":"Residual risk is low after controls."}]'::jsonb,
 '{"correct":"c"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000026','11111111-1111-1111-1111-111111111111',4,4,null,
 'Name the term: the expected financial gain from an investment relative to its cost, often shown as a percentage.',
 null,'{"accept":["ROI","return on investment","return-on-investment"]}'::jsonb,
 '{"version":1,"max_score":1,"pass_threshold":0.6,"criteria":[{"id":"term","description":"Names ROI / return on investment","weight":1}],"model_answer":"return on investment (ROI)","guidance":"Accept ROI or the full phrase."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000027','11111111-1111-1111-1111-111111111111',4,5,null,
 'Write the definition of the term: "stakeholder management".',
 null,null,
 '{"version":1,"max_score":2,"pass_threshold":0.6,"criteria":[{"id":"accuracy","description":"Captures identifying and engaging affected parties to align expectations","weight":1},{"id":"clarity","description":"Expressed clearly and professionally","weight":1}],"model_answer":"The process of identifying, engaging, and communicating with the people and groups affected by a project to align expectations and secure support.","guidance":"Credit correct meaning even if wording differs."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000028','11111111-1111-1111-1111-111111111111',4,6,'mini_article',
 'Article — "Our largest client has requested a 15% price reduction, threatening to move to a competitor. Margins are already thin."
Speak for 45–60 seconds: outline how you would respond and what factors you would weigh.',
 null,null,
 '{"version":1,"max_score":3,"pass_threshold":0.6,"criteria":[{"id":"comprehension","description":"Understands the commercial tension in the source","weight":1},{"id":"development","description":"Weighs relevant factors (margin, retention, precedent)","weight":1},{"id":"delivery","description":"Structured, professional delivery","weight":1}],"guidance":"Grade from the transcript; ignore transcription artifacts."}'::jsonb,true),

-- ===================== SECTION 5 — Executive (LBE 5) =====================
('a0000000-0000-4000-8000-000000000029','11111111-1111-1111-1111-111111111111',5,1,'email',
 'Email to the board — "We recommend divesting the underperforming division to focus capital on core growth areas." What is recommended?',
 '[{"id":"a","text":"Buying a new division"},{"id":"b","text":"Selling the underperforming division"},{"id":"c","text":"Closing the company"},{"id":"d","text":"Cutting all salaries"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000002a','11111111-1111-1111-1111-111111111111',5,1,null,
 'What does "fiduciary duty" refer to?',
 '[{"id":"a","text":"A tax form"},{"id":"b","text":"A legal obligation to act in another party''s best interest (e.g., shareholders)"},{"id":"c","text":"A marketing plan"},{"id":"d","text":"A type of invoice"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000002b','11111111-1111-1111-1111-111111111111',5,1,'mini_article',
 'Article — "The board approved a share buyback to return capital to shareholders." A share buyback primarily...',
 '[{"id":"a","text":"Issues new shares"},{"id":"b","text":"Repurchases the company''s own shares"},{"id":"c","text":"Pays suppliers"},{"id":"d","text":"Hires executives"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000002c','11111111-1111-1111-1111-111111111111',5,1,null,
 'Choose the most appropriate executive-level phrasing for uncertainty in a board update.',
 '[{"id":"a","text":"Everything is fine."},{"id":"b","text":"We are cautiously optimistic, contingent on Q4 demand."},{"id":"c","text":"Who knows what will happen."},{"id":"d","text":"It is guaranteed."}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000002d','11111111-1111-1111-1111-111111111111',5,1,'memo',
 'Memo — "Post-acquisition, we will consolidate duplicate functions to realise cost synergies within 12 months." What is the goal?',
 '[{"id":"a","text":"Increase duplication"},{"id":"b","text":"Reduce costs by combining overlapping functions"},{"id":"c","text":"Delay integration"},{"id":"d","text":"Raise prices"}]'::jsonb,
 '{"correct":"b"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000002e','11111111-1111-1111-1111-111111111111',5,1,null,
 'Which term describes the examination of financial records by an independent party?',
 '[{"id":"a","text":"Audit"},{"id":"b","text":"Agenda"},{"id":"c","text":"Merger"},{"id":"d","text":"Pitch"}]'::jsonb,
 '{"correct":"a"}'::jsonb,null,true),
('a0000000-0000-4000-8000-00000000002f','11111111-1111-1111-1111-111111111111',5,2,null,
 'In a board memo, choose the sentence that is inappropriately casual for the audience.',
 '[{"id":"a","text":"We propose a phased integration over three quarters."},{"id":"b","text":"The projected uplift is 8% EBITDA."},{"id":"c","text":"Honestly, let us just wing the integration."},{"id":"d","text":"Key risks are regulatory approval and talent retention."}]'::jsonb,
 '{"correct":"c"}'::jsonb,null,true),
('a0000000-0000-4000-8000-000000000030','11111111-1111-1111-1111-111111111111',5,4,null,
 'Name the term: the combination of two companies into a single entity.',
 null,'{"accept":["merger","a merger"]}'::jsonb,
 '{"version":1,"max_score":1,"pass_threshold":0.6,"criteria":[{"id":"term","description":"Names the correct business term","weight":1}],"model_answer":"merger","guidance":"Full credit for the correct term (merger)."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000031','11111111-1111-1111-1111-111111111111',5,5,null,
 'Write the definition of the term: "corporate governance".',
 null,null,
 '{"version":1,"max_score":2,"pass_threshold":0.6,"criteria":[{"id":"accuracy","description":"Captures the system of rules/processes directing and controlling a company","weight":1},{"id":"clarity","description":"Expressed clearly at an executive level","weight":1}],"model_answer":"The system of rules, practices, and processes by which a company is directed and controlled, balancing the interests of its stakeholders.","guidance":"Credit correct meaning even if wording differs."}'::jsonb,true),
('a0000000-0000-4000-8000-000000000032','11111111-1111-1111-1111-111111111111',5,3,'situation',
 'Situation: At a board meeting, a director challenges your recommendation to acquire a competitor, citing integration risk. Respond as an executive: acknowledge the concern, defend the strategic rationale, and address the risk.',
 null,null,
 '{"version":1,"max_score":3,"pass_threshold":0.6,"criteria":[{"id":"relevance","description":"Engages the director''s specific concern","weight":1},{"id":"appropriateness","description":"Confident, board-appropriate executive register","weight":1},{"id":"clarity","description":"Defends the rationale and addresses the risk coherently","weight":1}],"guidance":"Grade from the transcript; ignore transcription artifacts."}'::jsonb,true)
on conflict (id) do update set
  exam_id       = excluded.exam_id,
  lbe_level     = excluded.lbe_level,
  question_type = excluded.question_type,
  source_type   = excluded.source_type,
  prompt        = excluded.prompt,
  options       = excluded.options,
  answer_key    = excluded.answer_key,
  rubric        = excluded.rubric,
  active        = excluded.active;

-- Verify: 5 sections × 10 active items each.
-- select lbe_level, count(*) from public.items
--   where exam_id = '11111111-1111-1111-1111-111111111111' and active
--   group by lbe_level order by lbe_level;

-- =============================================================================
-- End of migration.
-- =============================================================================
