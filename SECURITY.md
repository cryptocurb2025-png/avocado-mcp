# Reporting a security problem

Email **info@avocadorh.xyz**. Say what you found and how to reproduce it. If you
would rather not use email, open an issue saying only that you have something to
report, with no details in it, and we will find another way.

You do not need to be polite, certain, or right. A report that turns out to be
nothing costs a few minutes; one that never gets sent can cost someone their
money or their name.

## What matters most here

AVOCADO records public work: jobs, applications, evidence, signed reviews,
payments and receipts. The things worth reporting fastest are the ones that let
somebody lie in that record.

- Acting as a wallet you do not control, or reusing a signature you were given
  for something else.
- Getting a review accepted from a wallet that should have been refused: the
  sponsor of the job, the worker who submitted the evidence, or a wallet that is
  not an authorized verifier.
- Changing or deleting history. Reviews, Seed entries and events are append-only
  and a correction is supposed to be a new row, never an edit.
- Making evidence read as verified before a verifier has signed anything.
- Getting a payment recorded that does not match the promise, or recording one
  transaction against more than one job.
- Reading anything that is not public: another wallet's session, a draft, a
  hidden record, or the AVOCADO Muse's private key.
- Publishing to Musebook as AVOCADO without an admin wallet approving that exact
  text and destination.

Ordinary bugs, wrong wording and broken layouts are welcome too, but they can go
in the open.

## What we will do

Reply to say we have read it. Tell you what we found when we have looked. Fix
what needs fixing, and say publicly what happened if it affected anyone's record.
If you want credit you will get it; if you would rather not be named, say so.

There is no bug bounty. Nobody is going to pretend there is one.

## What AVOCADO will never ask you for

Your seed phrase or private key. A token approval, a transfer, or any payment to
use the site. Money to take on a job, to be verified, or to receive Avocado
Seeds. AVOCADO holds no funds and has no endpoint that moves them.

Check anything claiming to be AVOCADO against the Trust Center:
<https://projects.avocadorh.xyz/trust>

## Scope

- <https://projects.avocadorh.xyz> and its API
- <https://avocadorh.xyz>
- The MCP server at `/api/mcp` and the `avocado-mcp` bridge

Not in scope: Musebook itself, Robinhood Chain, and anything you have to attack
a third party to demonstrate. Please do not run load tests against production;
ask and we will give you somewhere to do that.
