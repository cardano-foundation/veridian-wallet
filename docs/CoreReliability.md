# Core Reliability

Our wallet is an edge device which connects to a cloud agent, and uses the Signify library to send signed requests.
Signify itself is stateless, but we use SQLite locally to add reliability into our usage of it, and for other reasons.

Many applications may take advantage of database transactions to make user interactions atomic, but this is not an option for us as a single interaction may require a series of local database updates and Signify remote calls mixed together.
As such, it is critical that actions in our wallet are idempotent and auto-retried.

For example, when deleting an identifier we will always:
- Mark the local SQLite record with `pendingDeletion: true`.
- Emit an event to trigger deletion callback.
- Deletion callback will delete everything that is necessary, locally and remote.
  - This includes other things, such as local notification records lately to that identifier.

Whenever the Signify client connects to the cloud, we also scan the database for any identifiers with `pendingDeletion: true` and trigger the deletion callback.
This ensures if the connection is lost (app crash, network, cloud availability) while deleting, the core will automatically re-try the deletion.

Caveats:
- Every step in the deletion process must be idempotent
  - For example, `signifyClient.identifiers().delete` will throw an error if the identifier does not exist, so we must catch this error and ignore it if it successfully occured in the previous attempt.
- The last step in the deletion process *must* be to delete the local SQLite record.
  - If not, we cannot be sure everything has completed and we have no way to re-try any failed parts (via scanning for `pendingDeletion: true`).

### Exception handling

For exceptions/errors that relate to retrying of an operation, and are expected, these can be caught and ignored.
However, other exceptions should be re-thrown if they are exceptional and not expected.

This applies to any application but catching an exception which is *not* expected - just to log it - and _continue_ program execution will lead to adverse effects and is a security concern.

## Notifications and operations

The same rules apply for any handlers we have for notifications or long running operations.
It's always possible that these can fail halfway through and need be be re-tried, so we need to make sure it can succeed on the next retry without breaking or corrupting anything.

### Failed notifications

In the case of notification processing, it's very possible due to the async nature of KERI that the notification came out of order so cannot be processed fully right now.
We use a failed notification list record to track any notifications we need to retry so that we can move onto processing the next notification without being blocked.

### Operation chaining

Many Signify API calls are async, so we will often be returned an `Operation` which we must track for completion on KERIA.

In the case of identifier creation:
- We queue an identifier to create and emit an event for our creation handler.
  - In case of a restart, we scan the queue to retry creation.
- Once the identifier has been created, locally and in the cloud, we will have a long running operation (`witness` op) to track.
- Once we're started tracking this operation, we can safely remove the identifier from the pending creation queue.
- Once the operation completes, the identifier has been created and we can update the local DB again to mark it as complete.

The main thing to note here is we may move from scanning the DB for pending items to complete vs scanning for operations.
