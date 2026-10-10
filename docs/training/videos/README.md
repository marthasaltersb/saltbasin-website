# Training videos

Narrated walkthroughs recorded in a real browser by `scripts/record-training-video.mjs`: a caption bar says what is
happening and the control about to be used is outlined first. Each walkthrough is a small JSON script in this folder
(format in the script's header) and follows the same journeys as the feature's training spec, on fictional data only
(this repo is public).

    node scripts/record-training-video.mjs --script docs/training/videos/<name>.json --out <dir> --base http://127.0.0.1:<port> [--phone]

Output: `<name>.mp4` (H.264), `<name>.webm` and `<name>.steps.json` (each step, its time and result). A step that
fails stops the recording and exits 1 with the reason. Videos are build output: they are not committed; record
them from a server running a fresh database with `scripts/create-test-member.mjs` accounts.
