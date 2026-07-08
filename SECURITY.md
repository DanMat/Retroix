# Security Policy

## Supported versions

The latest published version of Retroix is the supported one.

## A note on the leaderboard

`Retroix.leaderboard` can talk to a **Supabase** backend. The Supabase
**anon/publishable key** you pass it is *designed to be public* — the database
is protected by row-level-security policies. Publishing that key is expected and
is not a vulnerability. As with any client-side leaderboard, scores can be
spoofed by a determined user; server-side validation is out of scope.

## Reporting a vulnerability

Please report genuine security issues privately rather than opening a public
issue:

- GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  (Security tab → "Report a vulnerability"), **or**
- Email **dannymatthew@gmail.com**.

Include a description, steps to reproduce, and the browser/version. Expect a
first response within **7 days**.
