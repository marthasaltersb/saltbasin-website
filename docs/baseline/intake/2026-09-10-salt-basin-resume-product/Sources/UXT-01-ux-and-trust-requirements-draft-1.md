# Salt Basin — UX and trust requirements, draft 1

The existing Salt Basin website already has established standards, 3D elements, views, and requirements. Extend that existing experience with the following interactions and guardrails. The goal is a differentiated, verifiable, trustworthy foundation for job searches and application outputs.

This specification captures desired product behavior. It does not authorize sending emails, contacting references, or changing the existing system yet.

## 1. Evidence and user review

Resume language, job recommendations, and job-title recommendations must have accessible explanations linking to the supporting sources, relevant matches, and assumptions. Users must be able to approve or reject recommendations at the appropriate level: individual wording, sentence, paragraph, or recommendation.

Expose these explanations and review controls in the actual user interface. Provide a testing interface that makes the behavior demonstrable and verifiable. Whether this is a production test experience or a separate test mode remains to be decided.

Provide configurable Salt Basin defaults:

| Match score | Default interaction |
|---|---|
| **90% or higher** | Proceed without requesting user input. Keep supporting evidence and explanation accessible. |
| **75% to under 90%** | Recommend review without blocking output if the user skips approval. Transparently describe the review status in the output. |
| **Below 75%** | Require additional sources, context, or explicit human judgment supporting the recommendation before proceeding. Guide the user through defending, approving, correcting, or reframing a stretch recommendation. |

Relevant matching factors include keywords, direct job-title alignment, demonstrated skills and proficiency, years of experience, and transferable experience. Differences in titles or experience duration should be considered alongside supporting experience.

**Still to define:** how scores are calculated and validated, what qualifies as sufficient human input below 75%, and where review disclosures appear in delivered outputs. A match score must not be presented as a verified probability of success.

## 2. Search preferences and ongoing personalization

Users must be able to configure and revise:

- Target roles and job titles.
- Desired base salary.
- Deal breakers.
- A prioritized list of job preferences.
- Relevant industries, experience, and career-transition goals.

The experience must support flexible changes and continuous feedback. Use approved resume language, title preferences, and other user decisions to improve subsequent recommendations.

Provide email notifications and in-product prompts when job history or resume information may need updating after inactivity.

**Still to define:** inactivity timing and the precise reminder behavior; this part of the initial description was unfinished.

## 3. Personal links and disclosure controls

Default to “LinkedIn upon request” and “References upon request,” with explicit user control over these settings.

Users must be able to:

- Indicate that they do not have LinkedIn and remove it completely.
- Add multiple personal or social links.
- Choose whether each link appears directly, appears as available upon request, or is omitted.
- Control when personal information becomes available.

AI must not independently decide which personal information to display or withhold. Surface missing disclosure choices so the user can resolve them.

Define polished display text and clear, accurate hyperlink behavior for information the user chooses to show.

## 4. References and optional verification

Users may provide references and explicitly opt in to Salt Basin contacting them for advance verification.

The experience must let users review verification feedback and choose whether to:

- Include references on the resume.
- Show an accurate Salt Basin verification indicator when verification has occurred.
- State that references are available upon request.
- Release references during an application.
- Withhold references until an interview or a specific request.

Reference verification and reference disclosure must be separately configurable.

## 5. Responsive experience

Provide dynamic mobile and tablet views that fit the existing design system, including the additional footer information appropriate to each view.

**Still to define:** the specific footer content and differences between device views.

## 6. Editing and synchronized information

Users must be able to edit all application documentation directly within the website. Editing must not require downloading a document and modifying it in Word.

Keep the following synchronized:

- Stored profile and application data.
- Inputs used by the user’s agent.
- Edits made directly inside application documents.

Provide a way to distinguish factual updates from alternative job descriptions, transferable-skill wording, translations, and interpretations. Define how each kind of change affects future recommendations and application-specific outputs.

## 7. Application records and output choices

Track whether a user has actually applied, rather than treating document generation as an application.

For each application, retain the user’s preferences, edits, and output choices, including whether they included:

- A cover letter.
- A portfolio.
- Other supporting materials.

Automated application tracking is an eventual capability. The experience must also let users report progress directly.

## 8. Interviews, calendars, and follow-ups

Let users record interview status and the next interview date.

Provide calendar integration that associates relevant interview invitations with the correct application and synchronizes them into Salt Basin.

Support automatic follow-up emails after meetings or interviews, with user-configurable authorization and recipient controls.

**Still to define:** whether follow-ups require approval each time or may run under a standing opt-in, and how timing and message content are controlled.

## 9. Outcomes and the learning loop

Track application outcomes, including callbacks, interview counts, subsequent interviews, and job offers.

Connect those outcomes to the application’s actual materials and choices, including:

- Methods and inputs used.
- Resume language and supporting evidence.
- Transferable-skill interpretations.
- Recommendation weights.
- Included application materials.

Use this history to tailor future recommendations and outputs to the user. Provide understandable updates about what the system has learned and how recommendations have changed.

Distinguish observed associations from proven causes: receiving an interview does not by itself prove that a particular wording choice caused it.

## 10. UX specification and verification deliverables

Translate these requirements into user flows that extend the existing website and lead clearly from profile setup through job selection, document editing, review, application, interviews, and outcomes.

For each flow, specify:

- What the user sees and can configure.
- What the agent does automatically.
- What evidence and explanation are available.
- When review is optional or required.
- How approvals, rejections, edits, and outcomes are recorded.
- How the behavior can be tested through the interface.

Include test cases for the exact 75% and 90% boundaries, skipped optional reviews, stretch-role decisions, missing LinkedIn information, reference disclosure choices, synchronized document edits, and the distinction between generating an output and actually applying.

Keep unresolved choices explicit rather than silently inventing product decisions.