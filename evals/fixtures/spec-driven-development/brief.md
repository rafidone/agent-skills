# Feature brief: notification preferences

Customers currently receive every notification. Support gets complaints from
people who want email only, or push only, or nothing for marketing but
everything for security.

Desired: a preferences page where a signed-in customer chooses, per category
(security, billing, product, marketing), whether they receive email, push,
both, or neither. Security notices must always be delivered by at least one
channel; a customer may not disable them entirely.

Open questions the team has not settled:

- Whether preferences apply to existing queued notifications.
- Whether an admin can change preferences on a customer's behalf.
- What happens when a push token is missing but push is selected.

The team wants this in the next release. Nobody has written acceptance criteria
yet.
