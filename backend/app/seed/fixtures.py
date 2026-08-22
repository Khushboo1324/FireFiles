from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class ParticipantFixture:
    key: str
    name: str
    email: str
    role: str


@dataclass(frozen=True)
class TranscriptFixture:
    sequence_index: int
    speaker_key: str
    start_time_ms: int
    end_time_ms: int
    text: str


@dataclass(frozen=True)
class ActionItemFixture:
    sequence_index: int
    assignee_key: str
    text: str
    completed: bool
    timestamp_ms: int | None


@dataclass(frozen=True)
class TopicFixture:
    sequence_index: int
    name: str


@dataclass(frozen=True)
class ChapterFixture:
    sequence_index: int
    title: str
    start_time_ms: int
    end_time_ms: int | None
    summary: str


@dataclass(frozen=True)
class MeetingFixture:
    title: str
    meeting_date: datetime
    duration_seconds: int
    participant_keys: tuple[str, ...]
    organizer_key: str
    transcript: tuple[TranscriptFixture, ...]
    overview: str
    short_summary: str
    action_items: tuple[ActionItemFixture, ...]
    topics: tuple[TopicFixture, ...]
    chapters: tuple[ChapterFixture, ...]


PARTICIPANTS = (
    ParticipantFixture("amara", "Amara Voss", "amara.voss@example.com", "Product Lead"),
    ParticipantFixture("dev", "Dev Malik", "dev.malik@example.com", "Engineering Lead"),
    ParticipantFixture("nina", "Nina Calder", "nina.calder@example.com", "Design Lead"),
    ParticipantFixture("owen", "Owen Park", "owen.park@example.com", "Mobile Engineer"),
    ParticipantFixture("priya", "Priya Nand", "priya.nand@example.com", "QA Lead"),
    ParticipantFixture(
        "mateo", "Mateo Silva", "mateo.silva@example.com", "Customer Success Lead"
    ),
    ParticipantFixture(
        "leila", "Leila Hart", "leila.hart@example.com", "Growth Strategist"
    ),
    ParticipantFixture("jonah", "Jonah Reed", "jonah.reed@example.com", "Data Analyst"),
)


def _transcript(
    lines: tuple[tuple[str, str], ...], step_ms: int
) -> tuple[TranscriptFixture, ...]:
    segments: list[TranscriptFixture] = []
    for index, (speaker_key, text) in enumerate(lines):
        start_time_ms = index * step_ms + (index % 4) * 700
        # Text length gives natural variation while keeping each segment below the next.
        duration_ms = 8_000 + (len(text) % 13) * 850
        segments.append(
            TranscriptFixture(
                sequence_index=index,
                speaker_key=speaker_key,
                start_time_ms=start_time_ms,
                end_time_ms=start_time_ms + duration_ms,
                text=text,
            )
        )
    return tuple(segments)


def _make_meeting(
    *,
    title: str,
    meeting_date: datetime,
    duration_seconds: int,
    participant_keys: tuple[str, ...],
    organizer_key: str,
    lines: tuple[tuple[str, str], ...],
    step_ms: int,
    overview: str,
    short_summary: str,
    actions: tuple[tuple[str, str, bool, int | None], ...],
    topic_names: tuple[str, ...],
    chapter_specs: tuple[tuple[str, int, int, str], ...],
) -> MeetingFixture:
    transcript = _transcript(lines, step_ms)
    action_items = tuple(
        ActionItemFixture(
            sequence_index=index,
            assignee_key=assignee_key,
            text=text,
            completed=completed,
            timestamp_ms=(
                transcript[transcript_index].start_time_ms
                if transcript_index is not None
                else None
            ),
        )
        for index, (assignee_key, text, completed, transcript_index) in enumerate(actions)
    )
    chapters = tuple(
        ChapterFixture(
            sequence_index=index,
            title=chapter_title,
            start_time_ms=transcript[start_index].start_time_ms,
            end_time_ms=transcript[end_index].end_time_ms,
            summary=summary,
        )
        for index, (chapter_title, start_index, end_index, summary) in enumerate(
            chapter_specs
        )
    )
    return MeetingFixture(
        title=title,
        meeting_date=meeting_date,
        duration_seconds=duration_seconds,
        participant_keys=participant_keys,
        organizer_key=organizer_key,
        transcript=transcript,
        overview=overview,
        short_summary=short_summary,
        action_items=action_items,
        topics=tuple(
            TopicFixture(sequence_index=index, name=name)
            for index, name in enumerate(topic_names)
        ),
        chapters=chapters,
    )


MEETINGS = (
    _make_meeting(
        title="Product Weekly Sync",
        meeting_date=datetime(2026, 8, 17, 9, 30, tzinfo=timezone.utc),
        duration_seconds=2_040,
        participant_keys=("amara", "dev", "nina", "priya", "jonah"),
        organizer_key="amara",
        step_ms=61_000,
        lines=(
            ("amara", "Let's start with last week's commitments and then decide what must land before the workspace pilot."),
            ("jonah", "Activation improved four points after the checklist change, but invitation completion stayed flat across new workspaces."),
            ("nina", "The checklist is clearer now; the invitation screen still asks users to choose permissions before they understand the roles."),
            ("dev", "We can defer advanced permissions and default new invitees to member, which removes one API round trip as well."),
            ("priya", "That default needs regression coverage because existing workspace administrators must retain their current selection options."),
            ("amara", "Agreed. The decision is a simple member default for new workspaces while existing permission controls remain available."),
            ("jonah", "I will split invitation completion by new versus existing workspace so we can verify that change after release."),
            ("nina", "I can deliver the simplified invitation copy and a compact role explanation by tomorrow afternoon."),
            ("amara", "Next is transcript search. The pilot group found exact phrases, but several expected partial-word matches returned nothing."),
            ("dev", "The current query uses token boundaries. Prefix matching is inexpensive, while fuzzy matching would need a different index strategy."),
            ("priya", "Prefix matching covers the reported examples. We should also test punctuation, speaker filters, and an empty search result."),
            ("jonah", "Search latency is healthy at the median, but the ninety-fifth percentile rises on meetings longer than an hour."),
            ("dev", "I found repeated loading of speaker records in the result mapper. Eager loading should remove those extra queries."),
            ("amara", "Let's ship prefix matching and the query fix together, then measure before considering typo tolerance."),
            ("priya", "I'll add the long-transcript fixture to the performance smoke test so that regression is visible in CI."),
            ("nina", "For highlighted results, I need the API to return the exact matching range rather than making the browser infer it."),
            ("dev", "That is reasonable. I will include start and end character offsets with each search hit."),
            ("amara", "The other blocker is the empty overview shown briefly while summary data is still loading."),
            ("nina", "I propose a stable skeleton with the same height as the overview; that prevents the action list from jumping."),
            ("priya", "Please include slow-network and failed-summary states. The current retry button is only reachable after a refresh."),
            ("dev", "The failure came from summary and transcript requests sharing one error flag. I will separate those states."),
            ("amara", "Good. A transcript failure should not hide a summary that loaded successfully, and the reverse should also hold."),
            ("jonah", "We should instrument retry clicks; a high rate would tell us whether reliability remains an issue after the state change."),
            ("amara", "For pilot readiness, are there any issues that should stop Friday's ten-workspace rollout?"),
            ("priya", "No release blocker if invitation regression and summary failure handling pass by Thursday. Search performance is medium risk."),
            ("dev", "The eager-loading patch is small, but I want a query-count assertion before merging it."),
            ("nina", "I will pair with Priya on the loading and failure-state acceptance criteria rather than sending separate notes."),
            ("jonah", "I'll prepare a pilot dashboard covering activation, invitation completion, search success, and retry usage."),
            ("amara", "Then Friday remains the target, with a Thursday go-or-no-go check based on those tests and the query count."),
            ("amara", "I'll send the decision log today and confirm the ten fictional pilot workspaces with customer success."),
        ),
        overview=(
            "The team kept the Friday workspace pilot target and simplified invitations by defaulting new invitees to the member role. "
            "They chose prefix transcript search plus an eager-loading fix instead of fuzzy matching, and agreed to return match offsets for highlighting. "
            "Summary and transcript loading errors will be separated, with stable loading, retry states, and pilot instrumentation required for Thursday's go/no-go review."
        ),
        short_summary="Friday's pilot remains on track pending invitation, search, and loading-state checks.",
        actions=(
            ("nina", "Deliver simplified invitation copy and role guidance.", False, 7),
            ("jonah", "Segment invitation completion metrics by workspace age.", False, 6),
            ("dev", "Add prefix search, eager speaker loading, and match offsets.", False, 16),
            ("priya", "Add invitation, long-transcript, and failure-state regression coverage.", False, 14),
            ("amara", "Publish the pilot decision log and confirm the pilot workspace list.", True, 29),
        ),
        topic_names=("Invitation Flow", "Transcript Search", "Query Performance", "Loading States", "Pilot Readiness"),
        chapter_specs=(
            ("Activation and Invitations", 0, 7, "The team reviewed activation data and simplified the invitation permission flow."),
            ("Transcript Search", 8, 16, "Prefix matching, query efficiency, test coverage, and highlight offsets were agreed."),
            ("Summary Loading", 17, 22, "Independent loading and failure states will prevent one panel from hiding another."),
            ("Pilot Decision", 23, 29, "The Friday pilot remains conditional on Thursday quality and performance checks."),
        ),
    ),
    _make_meeting(
        title="Sprint Planning — Mobile Release",
        meeting_date=datetime(2026, 8, 18, 13, 0, tzinfo=timezone.utc),
        duration_seconds=2_220,
        participant_keys=("owen", "dev", "priya", "nina", "amara"),
        organizer_key="owen",
        step_ms=66_000,
        lines=(
            ("owen", "The sprint goal is a stable mobile release with offline note reading, reliable uploads, and the revised playback controls."),
            ("amara", "Offline reading matters most for the field pilot; offline editing can remain explicitly out of scope this sprint."),
            ("dev", "The API already exposes revision identifiers, so the app can cache a meeting and invalidate it after reconnecting."),
            ("priya", "What happens if a cached meeting was deleted on another device while the phone remained offline?"),
            ("owen", "On reconnect we will mark it unavailable, retain no editable copy, and explain that the meeting was removed."),
            ("nina", "I will design that unavailable state along with a clear last-synced timestamp for content that is still valid."),
            ("amara", "Decision recorded: read-only cache, no offline mutations, and deletion resolved in favor of the server."),
            ("owen", "For uploads, background transfer works on the newest operating system but pauses too aggressively on the previous version."),
            ("dev", "Could we chunk the media and resume from the last acknowledged part instead of restarting the entire request?"),
            ("owen", "Yes, the endpoint accepts byte ranges. The client still needs persisted upload state and checksum verification."),
            ("priya", "I'll need scenarios for interrupted networks, expired upload sessions, duplicate retries, and a checksum mismatch."),
            ("amara", "Do we need background upload in this release, or is resumable foreground upload enough for the pilot?"),
            ("owen", "Foreground resume addresses the known failure. Background execution adds review risk, so I recommend deferring it."),
            ("dev", "Agreed. I can add an endpoint test proving repeated chunks do not create duplicate media records."),
            ("amara", "Then resumable foreground upload is committed, and background upload moves to the next planning cycle."),
            ("nina", "The playback control mock uses fifteen-second skip buttons and keeps playback speed in a compact menu."),
            ("priya", "The skip control must announce its action to screen readers and preserve focus after the timeline updates."),
            ("owen", "I can use the platform media command instead of a custom timer, which also handles interrupted playback correctly."),
            ("amara", "Can the transcript follow playback without forcing the active segment to the very top every time?"),
            ("nina", "We'll center the active segment only when it leaves the viewport and pause auto-follow after manual scrolling."),
            ("owen", "That needs one shared playback state; separate player and transcript timers caused the jitter in the prototype."),
            ("dev", "No backend change is required for follow mode because segment timestamps already provide the synchronization boundary."),
            ("priya", "I will cover seeking at segment edges, changing speed, manual scroll pause, and returning to follow mode."),
            ("owen", "Capacity is twenty-two points after support rotation. Offline cache is eight, uploads eight, and playback is five."),
            ("amara", "That leaves one point for release notes; the background-upload investigation should not consume sprint capacity."),
            ("dev", "The upload idempotency test is backend work, but I can complete it within the existing support allocation."),
            ("nina", "Offline and playback specifications are ready; I only need the final wording for deleted cached meetings."),
            ("priya", "QA can begin cache testing Wednesday and upload interruption testing once the persisted state lands."),
            ("owen", "I'll break the work into vertical slices so each feature reaches a testable state before the sprint midpoint."),
            ("amara", "We have a committed goal, explicit exclusions, and owners. Let's review upload risk at Wednesday stand-up."),
        ),
        overview=(
            "The sprint will deliver read-only offline meeting access, resumable foreground media uploads, and accessible playback controls. "
            "Offline edits and background uploads were explicitly deferred. The team agreed that server deletion wins during cache reconciliation, "
            "uploads will persist resumable state with checksum and idempotency coverage, and transcript auto-follow will pause after manual scrolling."
        ),
        short_summary="The mobile sprint commits offline reading, resumable uploads, and synchronized playback controls.",
        actions=(
            ("nina", "Design offline unavailable and last-synced states.", False, 5),
            ("owen", "Implement read-only caching with server-authoritative reconciliation.", False, 4),
            ("owen", "Persist resumable foreground upload state with checksum validation.", False, 9),
            ("dev", "Add an idempotency test for repeated upload chunks.", False, 13),
            ("priya", "Test accessibility, cache reconciliation, upload interruption, and playback edges.", False, 22),
            ("amara", "Move background upload to the next planning cycle.", True, 14),
        ),
        topic_names=("Offline Access", "Resumable Uploads", "Playback Controls", "Accessibility", "Sprint Capacity"),
        chapter_specs=(
            ("Sprint Goal", 0, 6, "The team scoped offline access to a read-only, server-authoritative cache."),
            ("Upload Reliability", 7, 14, "Resumable foreground uploads were committed while background execution was deferred."),
            ("Playback Experience", 15, 22, "Accessible controls and a shared playback state will keep transcripts synchronized."),
            ("Capacity and Owners", 23, 29, "The group allocated capacity, confirmed owners, and scheduled a risk review."),
        ),
    ),
    _make_meeting(
        title="Engineering Architecture Review",
        meeting_date=datetime(2026, 8, 19, 10, 0, tzinfo=timezone.utc),
        duration_seconds=2_280,
        participant_keys=("dev", "owen", "priya", "jonah"),
        organizer_key="dev",
        step_ms=68_000,
        lines=(
            ("dev", "Today's decision is how to process long transcripts without tying request latency to summary generation."),
            ("jonah", "The current synchronous path reaches twelve seconds at the ninety-fifth percentile for ninety-minute meetings."),
            ("owen", "That delay also blocks mobile refresh because the meeting response waits for every derived field."),
            ("priya", "We need a design that is observable and recoverable; simply moving work to a thread would hide failures."),
            ("dev", "I propose a persisted processing job with explicit queued, running, succeeded, and failed states."),
            ("jonah", "Will a separate job table duplicate status already implied by whether a summary row exists?"),
            ("dev", "The absence of a summary cannot distinguish waiting, retrying, and terminal failure, so explicit state is worth it."),
            ("owen", "The client can poll that state initially and later switch to push updates without changing the processing contract."),
            ("priya", "What guarantees that two retries do not produce conflicting summaries or duplicated topics?"),
            ("dev", "Each job gets an idempotency key from meeting revision and processor version, with one active key enforced."),
            ("jonah", "Processor version is important because we will want to regenerate summaries when the prompt template changes."),
            ("owen", "Could a regeneration overwrite the last good result before the new job completes?"),
            ("dev", "No. Derived output is written in one transaction only after validation; the prior result remains readable until then."),
            ("priya", "I'll test a worker crash between generation and commit to prove the transaction leaves the prior result intact."),
            ("jonah", "For retries, exponential backoff with jitter should keep a downstream outage from producing synchronized traffic spikes."),
            ("dev", "We'll cap automatic attempts at four, then expose a manual retry while retaining the failure category."),
            ("owen", "The API should return a stable public error code, not the worker exception or provider response."),
            ("priya", "Agreed, and logs can carry the internal cause using a correlation identifier shared with the job."),
            ("jonah", "Metrics should include queue age, processing time, attempt count, result size, and failures by category."),
            ("dev", "I also want an alert on oldest queued job because averages can look normal while one partition is stuck."),
            ("owen", "How are jobs claimed if we run two workers during the pilot? SQLite does not offer the same locking primitives as larger databases."),
            ("dev", "For this assignment we can use a short claim transaction and conditional status update, with one worker as the default."),
            ("priya", "Let's document that concurrency boundary so nobody interprets the pilot design as unlimited worker scaling."),
            ("jonah", "I can build a load fixture with varied transcript sizes to establish queue and processing baselines."),
            ("dev", "Security review: job inputs should reference stored meeting data, never embed transcript text in command arguments or logs."),
            ("owen", "The polling response only needs status, progress stage, updated time, and the public error code when failed."),
            ("priya", "I will add authorization to the future-risk list even though authentication itself is outside this assignment."),
            ("dev", "Decision: persisted jobs, transactional replacement, four bounded retries, sanitized errors, and polling for the first version."),
            ("jonah", "I'll circulate the metric names and baseline plan so implementation and dashboards use the same vocabulary."),
            ("dev", "I'll write the architecture note with the SQLite claim constraint and schedule a schema review before implementation."),
        ),
        overview=(
            "The review selected persisted processing jobs to decouple long-transcript derivation from request latency. Jobs will use revision-and-version "
            "idempotency keys, transactional result replacement, four jittered retries, sanitized public errors, and correlation-aware logs. The initial client "
            "will poll job state, while metrics and an oldest-job alert will expose queue health; the SQLite worker-concurrency limit will be documented."
        ),
        short_summary="Persisted, idempotent processing jobs will add safe retries and observable asynchronous summaries.",
        actions=(
            ("dev", "Write the processing-job architecture note and SQLite concurrency constraint.", False, 29),
            ("priya", "Test crash recovery, transactional replacement, and sanitized failure behavior.", False, 13),
            ("jonah", "Define job metrics and build varied transcript load fixtures.", False, 23),
            ("owen", "Draft the minimal polling response contract for mobile and web clients.", False, 25),
            ("dev", "Schedule a job schema review before implementation begins.", True, 29),
        ),
        topic_names=("Asynchronous Processing", "Idempotency", "Retry Strategy", "Observability", "Worker Concurrency", "Error Handling"),
        chapter_specs=(
            ("Latency Problem", 0, 7, "Synchronous derivation delays API and client refresh, motivating persisted job state."),
            ("Consistency and Idempotency", 8, 13, "Versioned keys and transactional replacement protect against duplicate or partial results."),
            ("Retries and Observability", 14, 19, "Bounded retry, safe errors, correlation logs, metrics, and alerts were defined."),
            ("Worker Claiming", 20, 23, "The design accepts a documented SQLite concurrency boundary for the pilot."),
            ("Contract and Decision", 24, 29, "The group finalized input safety, polling fields, risks, and follow-up documentation."),
        ),
    ),
    _make_meeting(
        title="Customer Onboarding Review",
        meeting_date=datetime(2026, 8, 20, 14, 30, tzinfo=timezone.utc),
        duration_seconds=2_100,
        participant_keys=("mateo", "amara", "dev", "leila"),
        organizer_key="mateo",
        step_ms=63_000,
        lines=(
            ("mateo", "We reviewed five fictional pilot onboardings and found that setup succeeds, but teams hesitate before importing their first meeting."),
            ("leila", "The funnel confirms that: workspace creation is strong, while first-meeting import loses nearly a third of activated users."),
            ("amara", "Interview notes suggest two concerns, file privacy and uncertainty about which transcript formats are accepted."),
            ("dev", "The importer accepts plain text today, but the interface implies that audio and several document formats are already supported."),
            ("mateo", "That mismatch creates avoidable support conversations. We should state the current capability before the file picker opens."),
            ("amara", "Agreed. The onboarding step will say paste or upload a text transcript and link to a short formatting example."),
            ("leila", "Can we show sample data first so a new user understands the destination before deciding whether to import?"),
            ("mateo", "Three pilot admins asked for exactly that, provided the sample is obviously fictional and easy to remove."),
            ("dev", "A seeded sample can be copied into a workspace, but it should not share records across customers or affect usage metrics."),
            ("amara", "Let's offer an optional fictional sample and exclude it from activation until the user imports or pastes their own transcript."),
            ("leila", "I will update the funnel definition so sample exploration and genuine activation remain separate events."),
            ("mateo", "The second friction point is inviting colleagues. Admins do not know whether invites are sent immediately."),
            ("dev", "They are sent immediately after submission, and invalid addresses are rejected before any invitations are queued."),
            ("amara", "The button should say Send invitations, with a confirmation listing successes and any addresses that need correction."),
            ("leila", "That confirmation also gives us a clean event for measuring completed team setup."),
            ("mateo", "Support needs a recovery path when an invited person says the message never arrived."),
            ("dev", "We can expose resend with a sixty-second cooldown and show the last-send time without revealing delivery internals."),
            ("amara", "Please keep the resend control beside the pending member, not in a separate settings screen."),
            ("mateo", "Next, privacy language currently says data is secure but does not explain retention in concrete terms."),
            ("leila", "We should avoid broad claims. A direct link to the fictional workspace's retention setting is more useful."),
            ("dev", "The application stores imported text until the meeting is deleted; there is no hidden audio processing in this assignment."),
            ("amara", "We'll state what is stored, connect deletion to removal, and avoid promising features the product does not implement."),
            ("mateo", "I can rewrite the onboarding help article and include a troubleshooting section for format and invitation errors."),
            ("leila", "For the next cohort, I want a checklist event for format guidance opened, sample explored, import completed, and invites sent."),
            ("dev", "Use stable event names and no transcript content or email addresses in analytics properties."),
            ("amara", "The rollout can happen behind the existing onboarding flag, starting with two fictional test workspaces."),
            ("mateo", "I'll run a thirty-minute walkthrough with support before enabling it for the next pilot cohort."),
            ("leila", "I will compare first-import completion and time-to-first-meeting against the prior cohort after one week."),
            ("dev", "I will verify the sample-copy path creates independent records and that deletion removes the copied content."),
            ("mateo", "We have owners for capability wording, sample data, invitation recovery, analytics, and the support walkthrough."),
        ),
        overview=(
            "The onboarding review identified first-meeting import as the main funnel loss, driven by unclear format support and privacy questions. "
            "The team will state text-only import capabilities, offer an optional fictional sample without counting it as activation, clarify immediate invitations, "
            "and add a cooldown-based resend path. Concrete storage and deletion language, privacy-safe analytics, and a support walkthrough will precede rollout."
        ),
        short_summary="Onboarding will clarify imports and privacy, add optional sample data, and improve invitation recovery.",
        actions=(
            ("amara", "Write explicit text-import, storage, and deletion copy for onboarding.", False, 21),
            ("dev", "Verify independent sample copying and cascade deletion behavior.", False, 28),
            ("dev", "Implement pending-invite resend with a sixty-second cooldown.", False, 16),
            ("leila", "Define privacy-safe onboarding funnel events and cohort comparison.", False, 23),
            ("mateo", "Update the help article and run the support walkthrough.", False, 26),
        ),
        topic_names=("Import Friction", "Sample Workspace", "Team Invitations", "Privacy Language", "Onboarding Analytics"),
        chapter_specs=(
            ("Import Drop-off", 0, 5, "Pilot evidence showed unclear transcript support and privacy concerns before first import."),
            ("Fictional Sample", 6, 10, "An optional copied sample will demonstrate value without inflating activation."),
            ("Invitation Recovery", 11, 17, "Immediate send feedback and a safe resend cooldown will clarify team setup."),
            ("Privacy and Help", 18, 22, "Concrete storage and deletion language will replace broad security claims."),
            ("Measurement and Rollout", 23, 29, "Privacy-safe events, limited rollout, and support preparation were assigned."),
        ),
    ),
    _make_meeting(
        title="Design Critique — Meeting Workspace",
        meeting_date=datetime(2026, 8, 21, 11, 0, tzinfo=timezone.utc),
        duration_seconds=2_160,
        participant_keys=("nina", "amara", "owen", "mateo"),
        organizer_key="nina",
        step_ms=65_000,
        lines=(
            ("nina", "The critique focus is information hierarchy in the meeting workspace, especially how transcript, summary, and actions compete for attention."),
            ("amara", "The primary job after a meeting is understanding the outcome, then checking evidence and assigning follow-up."),
            ("mateo", "Pilot users often open the transcript first because they do not trust that the summary captured a specific customer concern."),
            ("owen", "On smaller screens, forcing three permanent columns makes every panel too narrow and creates nested scrolling."),
            ("nina", "The new concept uses a wide content area plus a side panel that switches between overview, actions, topics, and participants."),
            ("amara", "I like the focus, but actions should remain discoverable without requiring users to remember the active side-panel tab."),
            ("mateo", "Could the header show the incomplete action count and open the action panel when selected?"),
            ("nina", "Yes, a labeled action count is clearer than another icon and provides a persistent status cue."),
            ("owen", "The side panel can preserve its selected view per meeting, but global persistence may surprise users."),
            ("amara", "Let's remember the panel within a meeting session only and default new meetings to overview."),
            ("nina", "For the transcript, speaker color alone is insufficient, so every segment keeps the name and avatar initials."),
            ("mateo", "Long customer names caused the timestamp to wrap in the current build and made scanning difficult."),
            ("owen", "A fixed metadata column can hold the timestamp, while speaker and text share the flexible content column."),
            ("nina", "That layout also aligns search hits and prevents timestamps from shifting between segments."),
            ("amara", "How will the active playback segment differ from a selected search result? They currently use the same background."),
            ("nina", "Playback gets a slim leading indicator; search uses inline text highlight, and keyboard focus gets an outline."),
            ("owen", "Those states can coexist without overwriting one another, which simplifies transcript navigation logic."),
            ("mateo", "Please include a visible label for the current speaker when the transcript is followed during playback."),
            ("nina", "The overview is currently one uninterrupted paragraph. I propose short sections for decisions, risks, and key discussion."),
            ("amara", "Only show a section when content exists; empty headings make an ordinary sync look unfinished."),
            ("mateo", "Support would benefit from copying one section without copying the entire overview and action list."),
            ("owen", "We can add section-level copy controls with accessible feedback and keep full-summary copy in the menu."),
            ("nina", "Action rows now put completion, assignee, timestamp, and overflow controls at equal visual weight."),
            ("amara", "Make the action text primary, completion first in reading order, and assignee a quieter secondary element."),
            ("mateo", "An unassigned task needs explicit wording; a blank avatar looks like data failed to load."),
            ("owen", "On mobile, the side panel becomes a full-height sheet and returns focus to its trigger when dismissed."),
            ("nina", "I'll prototype desktop widths, the mobile sheet, long names, empty sections, and combined playback-search states."),
            ("amara", "The acceptance review should use real fixture density rather than two-line placeholder transcripts."),
            ("mateo", "I can recruit three internal fictional-role walkthroughs: support lead, product manager, and implementation specialist."),
            ("nina", "Decision summary: focused content area, contextual side panel, persistent action count, structured overview, and distinct transcript states."),
        ),
        overview=(
            "The critique chose a focused content area with a contextual side panel instead of three permanent columns. A labeled incomplete-action count "
            "will remain visible, while panel choice persists only within the current meeting session. Transcript metadata will align consistently and use distinct, "
            "coexisting playback, search, and focus states. The overview gains optional decision, risk, and discussion sections, and mobile uses a focus-managed sheet."
        ),
        short_summary="The workspace will use a focused layout, contextual panel, clearer transcript states, and structured summaries.",
        actions=(
            ("nina", "Prototype responsive workspace states using full-density fixture content.", False, 26),
            ("owen", "Validate side-panel session state and mobile focus restoration.", False, 25),
            ("nina", "Specify coexisting playback, search, and keyboard-focus transcript treatments.", True, 15),
            ("amara", "Write acceptance criteria for conditional overview sections and action hierarchy.", False, 23),
            ("mateo", "Arrange three role-based design walkthroughs.", False, 28),
        ),
        topic_names=("Workspace Hierarchy", "Contextual Panel", "Transcript States", "Structured Overview", "Action Design", "Responsive Layout"),
        chapter_specs=(
            ("Information Hierarchy", 0, 9, "A focused content area and session-scoped side panel replace competing columns."),
            ("Transcript Layout", 10, 17, "Aligned metadata and distinct playback, search, and focus states improve scanning."),
            ("Overview Structure", 18, 21, "Conditional sections and scoped copy controls make summaries easier to use."),
            ("Actions and Mobile", 22, 25, "Action hierarchy, explicit unassigned state, and mobile focus handling were refined."),
            ("Prototype Plan", 26, 29, "The team assigned realistic prototypes, walkthroughs, and final decision documentation."),
        ),
    ),
    _make_meeting(
        title="Q3 Growth Strategy",
        meeting_date=datetime(2026, 8, 22, 15, 0, tzinfo=timezone.utc),
        duration_seconds=2_340,
        participant_keys=("leila", "jonah", "amara", "mateo", "nina"),
        organizer_key="leila",
        step_ms=70_000,
        lines=(
            ("leila", "Our Q3 objective is sustainable activation growth, not raw sign-ups, so today we need one audience and a measurable product loop."),
            ("jonah", "Teams that review a summary and complete one action within two days retain much better than teams that only upload."),
            ("amara", "That suggests the first value moment is a completed follow-up, with transcript import serving as the setup step."),
            ("mateo", "Implementation teams reach that moment quickly because they already leave meetings with owners and deadlines."),
            ("nina", "Their pain is not generating tasks; it is finding the exact discussion when an owner questions the context later."),
            ("leila", "Then our primary audience is small implementation teams, and the message connects accountable follow-up with searchable evidence."),
            ("jonah", "We should validate audience fit by role and team size rather than treating every workspace in the cohort equally."),
            ("amara", "What product change most directly helps them reach the first completed action?"),
            ("mateo", "A guided review that moves from decisions to incomplete actions and then to the supporting transcript timestamp."),
            ("nina", "We can test that flow with a lightweight review checklist before redesigning the entire workspace."),
            ("leila", "The experiment should compare the checklist against the current overview, with completed action in forty-eight hours as primary."),
            ("jonah", "Secondary measures can be action creation, timestamp opens, teammate invitations, and seven-day return."),
            ("amara", "Guardrails should include summary errors, task deletions, and users abandoning the meeting page immediately."),
            ("mateo", "We also need qualitative interviews because a completion event does not tell us whether the assigned work was meaningful."),
            ("nina", "I can make the checklist dismissible and ensure it does not cover the transcript for returning users."),
            ("leila", "Decision: two-week experiment, new implementation workspaces only, and no forced checklist after dismissal."),
            ("jonah", "At current traffic, detecting a large lift is realistic, but small differences will remain directional in two weeks."),
            ("amara", "That is acceptable for a first signal if we pair it with six structured interviews."),
            ("mateo", "I can recruit interview participants from fictional sandbox accounts and use scenario-based prompts rather than real customer data."),
            ("leila", "For acquisition, the resource hub draft currently targets generic meeting productivity and has no clear product bridge."),
            ("nina", "A practical follow-up template can demonstrate decisions, owners, and evidence without making exaggerated productivity claims."),
            ("amara", "The template should mirror the product vocabulary so users recognize the same structure after importing a transcript."),
            ("jonah", "We can attribute template visits to workspace creation, but avoid claiming causality until the volume supports it."),
            ("leila", "Let's publish one high-quality implementation follow-up guide instead of five broad articles this quarter."),
            ("mateo", "I will contribute common fictional scenarios: scope clarification, launch risk, data dependency, and training follow-up."),
            ("nina", "I will create diagrams using invented project names and ensure no screenshot contains personal or real company information."),
            ("jonah", "Reporting will separate acquisition, activation, and retention so sign-up growth cannot mask weaker follow-through."),
            ("amara", "The quarterly target should be a fifteen-percent relative lift in new workspaces completing an action within forty-eight hours."),
            ("leila", "I'll document the target, experiment eligibility, interview plan, content deliverable, and weekly decision checkpoints."),
            ("leila", "We leave with one audience, one activation loop, one product experiment, and one focused acquisition asset."),
        ),
        overview=(
            "Q3 growth will focus on small implementation teams and define activation as completing a meeting action within forty-eight hours. "
            "A two-week, dismissible guided-review experiment will connect decisions, incomplete actions, and transcript evidence, measured with behavioral guardrails "
            "and six interviews. Acquisition will center on one fictional implementation follow-up guide, while reporting keeps acquisition, activation, and retention separate."
        ),
        short_summary="Q3 targets implementation teams with a guided follow-up experiment and one focused acquisition guide.",
        actions=(
            ("jonah", "Define experiment eligibility, success metrics, guardrails, and segmented reporting.", False, 16),
            ("nina", "Design the dismissible guided-review checklist and fictional guide visuals.", False, 25),
            ("mateo", "Recruit six scenario-based interviews and provide fictional implementation examples.", False, 24),
            ("amara", "Confirm the fifteen-percent relative activation target with stakeholders.", True, 27),
            ("leila", "Publish the Q3 experiment brief and weekly decision schedule.", False, 28),
        ),
        topic_names=("Activation Definition", "Audience Focus", "Guided Review", "Experiment Design", "Content Strategy", "Growth Measurement"),
        chapter_specs=(
            ("Audience and Value Moment", 0, 6, "The strategy focuses on implementation teams completing accountable follow-up."),
            ("Guided Review Concept", 7, 15, "A dismissible checklist will connect decisions, tasks, and transcript evidence."),
            ("Experiment Measurement", 16, 18, "The team accepted directional power and paired behavior data with interviews."),
            ("Acquisition Asset", 19, 25, "One focused fictional follow-up guide will bridge useful content and product structure."),
            ("Targets and Commitments", 26, 29, "Reporting boundaries, a relative activation target, and owners were finalized."),
        ),
    ),
)


CANONICAL_MEETING_TITLES = frozenset(meeting.title for meeting in MEETINGS)


def _require_text(value: str, location: str) -> None:
    if not value.strip():
        raise ValueError(f"Seed fixture text is blank at {location}.")


def _validate_ordered_indexes(items: tuple[object, ...], location: str) -> None:
    indexes = [getattr(item, "sequence_index") for item in items]
    if indexes != list(range(len(items))):
        raise ValueError(f"Seed fixture indexes must be sequential at {location}.")


def validate_fixtures() -> None:
    participant_keys = {participant.key for participant in PARTICIPANTS}
    participant_emails = {participant.email.lower() for participant in PARTICIPANTS}
    if len(participant_keys) != len(PARTICIPANTS):
        raise ValueError("Seed participant keys must be unique.")
    if len(participant_emails) != len(PARTICIPANTS):
        raise ValueError("Seed participant emails must be unique.")

    for participant in PARTICIPANTS:
        _require_text(participant.name, f"participant {participant.key} name")
        _require_text(participant.role, f"participant {participant.key} role")
        if not participant.email.lower().endswith("@example.com"):
            raise ValueError(f"Seed email must use example.com: {participant.email}")

    if len(MEETINGS) != 6 or len(CANONICAL_MEETING_TITLES) != len(MEETINGS):
        raise ValueError("Seed fixtures must define six uniquely titled meetings.")

    for meeting in MEETINGS:
        location = f"meeting {meeting.title!r}"
        duration_ms = meeting.duration_seconds * 1_000
        _require_text(meeting.title, f"{location} title")
        _require_text(meeting.overview, f"{location} overview")
        _require_text(meeting.short_summary, f"{location} short summary")
        if meeting.meeting_date.tzinfo is None:
            raise ValueError(f"Seed meeting date must be timezone-aware at {location}.")
        if meeting.duration_seconds <= 0:
            raise ValueError(f"Seed meeting duration must be positive at {location}.")
        if not 3 <= len(meeting.participant_keys) <= 5:
            raise ValueError(f"Seed meeting must have 3-5 participants at {location}.")
        if len(set(meeting.participant_keys)) != len(meeting.participant_keys):
            raise ValueError(f"Seed meeting participants must be unique at {location}.")
        if not set(meeting.participant_keys) <= participant_keys:
            raise ValueError(f"Seed meeting has an unknown participant at {location}.")
        if meeting.organizer_key not in meeting.participant_keys:
            raise ValueError(f"Seed organizer must belong to {location}.")

        if not 30 <= len(meeting.transcript) <= 45:
            raise ValueError(f"Seed transcript must contain 30-45 segments at {location}.")
        _validate_ordered_indexes(meeting.transcript, f"{location} transcript")
        previous_end = -1
        for segment in meeting.transcript:
            _require_text(segment.text, f"{location} transcript {segment.sequence_index}")
            if segment.speaker_key not in meeting.participant_keys:
                raise ValueError(f"Transcript speaker does not belong to {location}.")
            if segment.start_time_ms < 0 or segment.end_time_ms <= segment.start_time_ms:
                raise ValueError(f"Invalid transcript timestamp at {location}.")
            if segment.start_time_ms < previous_end:
                raise ValueError(f"Transcript timestamps are not chronological at {location}.")
            if segment.end_time_ms > duration_ms:
                raise ValueError(f"Transcript exceeds meeting duration at {location}.")
            previous_end = segment.end_time_ms

        if not 4 <= len(meeting.action_items) <= 6:
            raise ValueError(f"Seed meeting must have 4-6 action items at {location}.")
        _validate_ordered_indexes(meeting.action_items, f"{location} action items")
        for action in meeting.action_items:
            _require_text(action.text, f"{location} action {action.sequence_index}")
            if action.assignee_key not in meeting.participant_keys:
                raise ValueError(f"Action assignee does not belong to {location}.")
            if action.timestamp_ms is not None and not 0 <= action.timestamp_ms <= duration_ms:
                raise ValueError(f"Action timestamp exceeds duration at {location}.")

        if not 4 <= len(meeting.topics) <= 6:
            raise ValueError(f"Seed meeting must have 4-6 topics at {location}.")
        _validate_ordered_indexes(meeting.topics, f"{location} topics")
        for topic in meeting.topics:
            _require_text(topic.name, f"{location} topic {topic.sequence_index}")

        if not 4 <= len(meeting.chapters) <= 6:
            raise ValueError(f"Seed meeting must have 4-6 chapters at {location}.")
        _validate_ordered_indexes(meeting.chapters, f"{location} chapters")
        previous_start = -1
        for chapter in meeting.chapters:
            _require_text(chapter.title, f"{location} chapter {chapter.sequence_index}")
            _require_text(chapter.summary, f"{location} chapter summary {chapter.sequence_index}")
            if chapter.start_time_ms < 0 or chapter.start_time_ms < previous_start:
                raise ValueError(f"Chapter timestamps are not chronological at {location}.")
            if chapter.end_time_ms is not None:
                if chapter.end_time_ms < chapter.start_time_ms:
                    raise ValueError(f"Chapter end precedes its start at {location}.")
                if chapter.end_time_ms > duration_ms:
                    raise ValueError(f"Chapter exceeds meeting duration at {location}.")
            if chapter.start_time_ms > duration_ms:
                raise ValueError(f"Chapter starts beyond meeting duration at {location}.")
            previous_start = chapter.start_time_ms
