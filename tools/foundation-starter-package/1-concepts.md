# 1. Concepts

## The one-paragraph version

You log in and set up a **foundation**: a short definition of how your work is organised, answered as
seven questions. You then **plant seeds**: raw entries of anything new, from an idea to a task to
something an agent found for you. You review and nurture seeds, and **grow** them into real things such
as a career entry, an opportunity or a **feature**. Every piece of work on a feature names the seeds it
was for. A **release tracker** shows each feature moving through build, test, triage and fix until it
passes, and **scenes** let you see all of it as connected 3D objects. Nothing is ever overwritten
without a trace, so you can always answer "what was done, when, for which seed, in which feature".

## The pieces

| Term | Plain meaning | Example |
|---|---|---|
| **Foundation** | One definition of how a body of work is organised and where its data lives. A person can have several: a personal career foundation, plus foundations they reach through each organization they belong to. | "My career", "Org A delivery (Jira)", "Org A revenue (Salesforce)" |
| **The seven mapping questions** | What every foundation answers once, so the tracker understands your words. | See the table below. |
| **Seed** | The entry point for anything new or unassigned, almost like a lead. Planted by you, an agent or an import. | "I led a data migration in 2021", "Admins can't see stuck bugs" |
| **Planting / reviewing / nurturing / growing** | A seed's life: entered, then accepted or merged or set aside, then made richer with answers and proof, then turned into something real. | A seed grows into a Career Master entry and two skills |
| **Feature** | A capability. Created **only** from a seed. Linked to as many seeds as it solves, and a seed can be linked to several features. | "Release board" solves seeds S-14 and S-15 |
| **Work** | Builds, fixes, test rounds, documents, agent runs, approvals. Each one names the seeds it was for. | "11 Oct, fix, commit c3d4, for S-15" |
| **Release tracker** | The board that shows every feature's stage, test rounds, bugs and who is working on what. | "bravo-forms: needs a person after 2 fix attempts" |
| **Scene** | A saved, versioned 3D view of connected data, built in six steps: data, objects, connections, interactions, preview, publish. | Features orbit a release crystal; bugs circle their feature |
| **Channel Rod** | Salt Basin's record for anything that has a journey: an owner, stages and a full history. Foundations and features are rods. Seeds, links and test results are *evidence* attached to rods. | A feature rod with its seeds and work history |

## The seven mapping questions

1. What one thing in your system is a **feature**, and what key names it?
2. Which of your **statuses** mean build, integrate, test, triage and fix?
3. What counts as one **test round**, and where do *steps passed / steps total* come from?
4. How is each **bug tied to its feature**?
5. How do you tell a **returning bug** from a new one?
6. Which status means **"needs a business decision"**?
7. After how many failed fix attempts does a bug **go to a person**?

## How Salt Basin stores it (rods in one table)

| Normal database | Salt Basin |
|---|---|
| Table | Channel (a rod type) |
| Record | Channel Rod |
| Column definition | Atom definition |
| Cell value | Evidence (with source, confidence and date, so two sources can disagree side by side) |
| Change log | Rod events (append-only, the source of truth) |
| Relationship | Tributary or parent rod |

**A rod has four layers.**
- *Identity* never changes, and rods are retired, not deleted.
- *History* is only ever added to.
- *Definition* gains new numbered versions.
- *Current state* is a summary that can always be rebuilt from history.

## What is real today and what is designed

The release tracker kit and the 3D demo board are working. Foundations, seeds, features-from-seeds,
scenes and the audit-history fixes are designed in versioned specs (in `specs/`), with the owner's open
decisions listed at the end of each.
